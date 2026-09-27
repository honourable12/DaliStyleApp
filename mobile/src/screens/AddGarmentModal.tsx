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
      Alert.alert('Permission needed', 'Camera permission is required.');
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
      Alert.alert('Camera error', e.message || 'Could not open camera.');
    }
  };

  const handlePickGallery = async () => {
    const granted = await requestPermission(false);
    if (!granted) {
      Alert.alert('Permission needed', 'Gallery permission is required.');
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
      Alert.alert('Gallery error', e.message || 'Could not select photo.');
    }
  };

  const handlePhotoSelected = async (uri: string) => {
    setImageUrl(uri);
    try {
      const edgeResult = await EdgeAIPipeline.processGarment(uri);
      setSelectedHex(edgeResult.primaryHex);
      setColorName(edgeResult.primaryName);
      setCategory(edgeResult.suggestedCategory);
      if (!name.trim()) {
        setName(`Tailored ${edgeResult.primaryName} ${edgeResult.suggestedCategory}`);
      }
    } catch {
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
      Alert.alert('Name required', 'Give this piece a name.');
      return;
    }

    setUploading(true);
    let finalImageUrl = imageUrl;

    if (imageUrl.startsWith('file://')) {
      try {
        const formData = new FormData();
        const filename = imageUrl.split('/').pop() || 'cloth.jpg';
        formData.append('file', { uri: imageUrl, name: filename, type: 'image/jpeg' } as any);
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
        // fallback to local URI
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
            <Text style={styles.title}>Add a piece</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />

              <View style={styles.captureOverlay}>
                <TouchableOpacity activeOpacity={0.7} onPress={handleCaptureCamera} style={styles.captureBtn}>
                  <Ionicons name="camera" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.captureBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={handlePickGallery} style={styles.captureBtn}>
                  <Ionicons name="images" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.captureBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scanBadge}>
                <View style={[styles.scanDot, { backgroundColor: selectedHex }]} />
                <Text style={styles.scanText}>{colorName}</Text>
              </View>
            </View>

            <Text style={styles.label}>Quick examples</Text>
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

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Linen camp shirt"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.catRow}>
              {categories.map((c) => {
                const isActive = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.7}
                    onPress={() => setCategory(c)}
                    style={[styles.catBtn, isActive && styles.catBtnActive]}
                  >
                    <Text style={[styles.catText, isActive && styles.catTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={uploading}
              style={[styles.saveBtn, uploading && styles.saveBtnDisabled]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.saveBtnText}>Save to closet</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  imagePreviewWrap: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceRaised,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captureOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 13, 12, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  captureBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  scanBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 13, 12, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 8,
  },
  scanDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scanText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 6,
  },
  presetScroll: {
    marginBottom: SPACING.sm,
  },
  presetCard: {
    width: 84,
    marginRight: 12,
    alignItems: 'center',
  },
  presetThumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
  },
  presetText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
  },
  catBtnActive: {
    backgroundColor: COLORS.accent,
  },
  catText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  catTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
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
    fontSize: 15,
    fontWeight: '800',
  },
});
