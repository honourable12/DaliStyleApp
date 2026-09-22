import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme';
import { MONK_SCALE, MONK_PALETTE_PROFILES, matchMonkScale } from '../core/monkScale';
import { MonkTone } from '../types';
import { EdgeAIPipeline } from '../ai/edgePipeline';

interface SelfieCalibrationModalProps {
  visible: boolean;
  onClose: () => void;
  onCalibrate: (tone: MonkTone) => void;
}

export const SelfieCalibrationModal: React.FC<SelfieCalibrationModalProps> = ({
  visible,
  onClose,
  onCalibrate,
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedResult, setDetectedResult] = useState<(MonkTone & { confidence: number }) | null>(null);

  const requestPermission = async (isCamera: boolean) => {
    if (isCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const handleTakePhoto = async () => {
    const granted = await requestPermission(true);
    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take a style selfie.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        processSelfie(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not open camera.');
    }
  };

  const handlePickPhoto = async () => {
    const granted = await requestPermission(false);
    if (!granted) {
      Alert.alert('Permission Required', 'Photo library permission is needed to select a selfie.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        processSelfie(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Picker Error', e.message || 'Could not pick image.');
    }
  };

  const processSelfie = async (uri: string) => {
    setPhotoUri(uri);
    setAnalyzing(true);

    try {
      // 1. Try Live FastAPI Backend /api/wardrobe/selfie if reachable
      let matchedTone: (MonkTone & { confidence: number }) | null = null;

      try {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'selfie.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('http://10.0.2.2:8000/api/wardrobe/selfie', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const found = MONK_SCALE.find((m) => m.name === data.skin_type || m.label === data.monk_label);
          if (found) {
            matchedTone = { ...found, confidence: data.confidence || 0.94 };
          }
        }
      } catch {
        // Fallback to on-device engine
      }

      // 2. On-Device Edge Calibration (Biometric HSV + YCrCb pixel extraction)
      if (!matchedTone) {
        const edgeResult = await EdgeAIPipeline.processSelfie(uri);
        matchedTone = edgeResult;
      }

      setDetectedResult(matchedTone);
    } catch {
      Alert.alert('Analysis Failed', 'Could not detect skin tone. Please try with better lighting.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (detectedResult) {
      onCalibrate(detectedResult);
      onClose();
      Alert.alert(
        'Calibration Complete',
        `Your profile is now calibrated to ${detectedResult.label} (${detectedResult.name}). Outfits have been re-scored.`
      );
    }
  };

  const profile = detectedResult ? MONK_PALETTE_PROFILES[detectedResult.label] : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>PHOTO CALIBRATION</Text>
              <Text style={styles.subtitle}>Center your face in natural lighting</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Viewfinder / Preview */}
          <View style={styles.viewfinder}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderFace}>
                <Ionicons name="camera-reverse-outline" size={54} color={COLORS.textSecondary} />
                <Text style={styles.placeholderText}>Take a style selfie or choose a portrait</Text>
              </View>
            )}

            {analyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.analyzingText}>Reading skin tone on Monk Scale...</Text>
              </View>
            )}
          </View>

          {/* Detected Result Card */}
          {detectedResult && !analyzing && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={[styles.skinToneCircle, { backgroundColor: detectedResult.hex }]} />
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultLabel}>
                    {detectedResult.label} · {detectedResult.name}
                  </Text>
                  <Text style={styles.confidenceText}>
                    Confidence: {Math.round(detectedResult.confidence * 100)}%
                  </Text>
                </View>
              </View>

              {profile && (
                <View style={styles.paletteRow}>
                  <Text style={styles.paletteTitle}>RECOMMENDED ACCENTS:</Text>
                  <View style={styles.swatchGroup}>
                    {profile.recommendedAccents.map((hex, i) => (
                      <View key={i} style={[styles.swatchItem, { backgroundColor: hex }]} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {!detectedResult ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleTakePhoto}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Ionicons name="camera-outline" size={18} color={COLORS.background} style={styles.btnIcon} />
                  <Text style={styles.btnPrimaryText}>Open Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickPhoto}
                  style={[styles.btn, styles.btnSecondary]}
                >
                  <Ionicons name="images-outline" size={18} color={COLORS.textPrimary} style={styles.btnIcon} />
                  <Text style={styles.btnSecondaryText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleTakePhoto}
                  style={[styles.btn, styles.btnSecondary]}
                >
                  <Text style={styles.btnSecondaryText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirm}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Text style={styles.btnPrimaryText}>Apply Calibration</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  viewfinder: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderFace: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  analyzingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(14, 13, 12, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginTop: SPACING.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skinToneCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  resultTextCol: {
    flex: 1,
  },
  resultLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  confidenceText: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 2,
  },
  paletteRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  paletteTitle: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  swatchGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  swatchItem: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionsContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  btnSecondaryText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 6,
  },
});
