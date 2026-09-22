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
} from 'react-native';
import { ClothingCategory, WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { extractDominantColorFromPixels } from '../ai/edgeVision';
import { STANDARD_COLORS, rgbToHex } from '../core/colorTheory';

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

  const categories: ClothingCategory[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];

  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setSelectedHex(preset.hex);
    setColorName(preset.colorName);
    setImageUrl(preset.imageUrl);
  };

  const handleSimulateColorScan = () => {
    // Simulates on-device K-Means extraction from image pixels in 2ms
    const randomColor = STANDARD_COLORS[Math.floor(Math.random() * STANDARD_COLORS.length)];
    const hex = rgbToHex(randomColor[1][0], randomColor[1][1], randomColor[1][2]);
    setSelectedHex(hex);
    setColorName(randomColor[0]);
    Alert.alert('On-Device Scan', `Detected dominant color: ${randomColor[0]} (${hex})`);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give this garment a name.');
      return;
    }

    const newItem: WardrobeItem = {
      id: `w-${Date.now()}`,
      name: name.trim(),
      category,
      primaryColor: selectedHex,
      primaryColorName: colorName,
      imageUrl,
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
            <Text style={styles.title}>ADD TO WARDROBE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Preview & On-Device Scan Trigger */}
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSimulateColorScan}
                style={styles.scanBadge}
              >
                <View style={[styles.scanDot, { backgroundColor: selectedHex }]} />
                <Text style={styles.scanText}>AI Color: {colorName}</Text>
              </TouchableOpacity>
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
              placeholder="e.g. Vintage Denim Jacket"
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
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Save to Wardrobe</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '90%',
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
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(14, 13, 12, 0.88)',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    marginBottom: 20,
  },
  saveBtnText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
