import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ClothingCategory, WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { STANDARD_COLORS, rgbToHex } from '../core/colorTheory';
import { EdgeAIPipeline } from '../ai/edgePipeline';

interface AddGarmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
}

const SAMPLE_PRESETS = [
  {
    name: 'Turmeric Silk Overshirt',
    category: 'top' as ClothingCategory,
    hex: '#E8A830',
    colorName: 'Rust / Turmeric',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Charcoal Relaxed Slacks',
    category: 'bottom' as ClothingCategory,
    hex: '#2A2B2D',
    colorName: 'Charcoal',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Off-White Waffle Knit',
    category: 'top' as ClothingCategory,
    hex: '#F2EDE6',
    colorName: 'Cream',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Midnight Navy Blazer',
    category: 'outerwear' as ClothingCategory,
    hex: '#141E30',
    colorName: 'Navy',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
  },
];

export const AddGarmentModal: React.FC<AddGarmentModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [selectedHex, setSelectedHex] = useState('#E8A830');
  const [colorName, setColorName] = useState('Rust / Turmeric');
  const [imageUrl, setImageUrl] = useState(SAMPLE_PRESETS[0].imageUrl);
  const [uploading, setUploading] = useState(false);

  const categories: ClothingCategory[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];

  const requestPermission = async (isCamera: boolean) => {
    if (isCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const handleCaptureCamera = async () => {
    const granted = await requestPermission(true);
    if (!granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture clothes.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handlePhotoSelected(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not open camera.');
    }
  };

  const handlePickGallery = async () => {
    const granted = await requestPermission(false);
    if (!granted) {
      Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
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
        handlePhotoSelected(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message || 'Could not select photo.');
    }
  };

  const handlePhotoSelected = async (uri: string) => {
    setImageUrl(uri);

    try {
      // Run full On-Edge AI Pipeline
      const edgeResult = await EdgeAIPipeline.processGarment(uri);
      setSelectedHex(edgeResult.primaryHex);
      setColorName(edgeResult.primaryName);
      setCategory(edgeResult.suggestedCategory);

      if (!name.trim()) {
        setName(`Tailored ${edgeResult.primaryName} ${edgeResult.suggestedCategory.toUpperCase()}`);
      }
    } catch {
      // Fallback
      setSelectedHex('#E8A830');
      setColorName('Rust / Turmeric');
    }
  };

  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setSelectedHex(preset.hex);
    setColorName(preset.colorName);
    setImageUrl(preset.imageUrl);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give this garment a name.');
      return;
    }

    setUploading(true);

    let finalImageUrl = imageUrl;

    // Optional upload to FastAPI backend if URL is a local file URI
    if (imageUrl.startsWith('file://')) {
      try {
        const formData = new FormData();
        const filename = imageUrl.split('/').pop() || 'cloth.jpg';
        formData.append('file', {
          uri: imageUrl,
          name: filename,
          type: 'image/jpeg',
        } as any);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('http://10.0.2.2:8000/api/wardrobe/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (data.image_url) {
            finalImageUrl = `http://10.0.2.2:8000/static/${data.image_url}`;
          }
        }
      } catch {
        // Fallback gracefully to local URI storage
      }
    }

    setUploading(false);

    const newItem: WardrobeItem = {
      id: `w-${Date.now()}`,
      name: name.trim(),
      category,
      primaryColor: selectedHex,
      primaryColorName: colorName,
      imageUrl: finalImageUrl,
      createdAt: Date.now(),
    };

    onSave(newItem);
    onClose();
    setName('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>ADD TO WARDROBE</Text>
              <Text style={styles.subtitle}>Camera capture with instant edge color tagging</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Preview & Capture Controls */}
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />

              {/* Camera / Gallery Quick Overlay Buttons */}
              <View style={styles.captureOverlay}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCaptureCamera}
                  style={styles.captureBtn}
                >
                  <Ionicons name="camera" size={16} color={COLORS.textPrimary} style={styles.btnIcon} />
                  <Text style={styles.captureBtnText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickGallery}
                  style={styles.captureBtn}
                >
                  <Ionicons name="images" size={16} color={COLORS.textPrimary} style={styles.btnIcon} />
                  <Text style={styles.captureBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Color Badge */}
              <View style={styles.scanBadge}>
                <View style={[styles.scanDot, { backgroundColor: selectedHex }]} />
                <Text style={styles.scanText}>Color: {colorName}</Text>
              </View>
            </View>

            {/* Presets Row */}
            <Text style={styles.label}>QUICK EXAMPLES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {SAMPLE_PRESETS.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSelectPreset(p)}
                  style={styles.presetCard}
                >
                  <Image source={{ uri: p.imageUrl }} style={styles.presetThumb} />
                  <Text style={styles.presetText} numberOfLines={1}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Garment Name Input */}
            <Text style={styles.label}>PIECE NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Linen Camp Collar Shirt"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />

            {/* Category Selector */}
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.catRow}>
              {categories.map((c) => {
                const isActive = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    onPress={() => setCategory(c)}
                    style={[styles.catBtn, isActive && styles.catBtnActive]}
                  >
                    <Text style={[styles.catText, isActive && styles.catTextActive]}>
                      {c.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={uploading}
              style={[styles.saveBtn, uploading && styles.saveBtnDisabled]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.saveBtnText}>Save to Wardrobe</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  imagePreviewWrap: {
    width: '100%',
    height: 190,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceRaised,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captureOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 13, 12, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  captureBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 4,
  },
  scanBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(14, 13, 12, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  scanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  scanText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 6,
  },
  presetScroll: {
    marginBottom: SPACING.sm,
  },
  presetCard: {
    width: 80,
    marginRight: 10,
    alignItems: 'center',
  },
  presetThumb: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  presetText: {
    color: COLORS.textPrimary,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  catBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  catText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  catTextActive: {
    color: COLORS.background,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 24,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
