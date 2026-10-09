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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ClothingCategory, WardrobeItem, PatternType, PatternScale } from '../types';
import { COLORS, RADIUS, SPACING, SHADOWS, useTheme } from '../theme';
import { EdgeAIPipeline } from '../ai/edgePipeline';
import { showAtelierToast } from '../context/ToastContext';

interface AddGarmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
}

const SAMPLE_PRESETS = [
  {
    name: 'Emerald Pleated Midi Dress',
    category: 'one-piece' as ClothingCategory,
    hex: '#0A5C36',
    colorName: 'Emerald Silk',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Breton Striped Knit',
    category: 'top' as ClothingCategory,
    hex: '#1E293B',
    colorName: 'Midnight Navy',
    pattern: 'striped' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Turmeric Silk Overshirt',
    category: 'top' as ClothingCategory,
    hex: '#E8A830',
    colorName: 'Rust / Turmeric',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Charcoal Relaxed Slacks',
    category: 'bottom' as ClothingCategory,
    hex: '#2A2B2D',
    colorName: 'Charcoal',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Off-White Waffle Knit',
    category: 'top' as ClothingCategory,
    hex: '#F2EDE6',
    colorName: 'Cream',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Midnight Navy Blazer',
    category: 'outerwear' as ClothingCategory,
    hex: '#141E30',
    colorName: 'Navy',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Derby Oxford Shoes',
    category: 'shoes' as ClothingCategory,
    hex: '#1A1817',
    colorName: 'Espresso Black',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Midnight Navy Suit Trousers',
    category: 'bottom' as ClothingCategory,
    hex: '#141E30',
    colorName: 'Navy',
    pattern: 'solid' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Silk Leopard Scarf',
    category: 'accessory' as ClothingCategory,
    hex: '#C19A6B',
    colorName: 'Camel / Leopard',
    pattern: 'animal print' as PatternType,
    patternScale: 'medium' as PatternScale,
    imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=400&q=80',
  },
];

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: 'Top',
  bottom: 'Bottom',
  'one-piece': 'Dresses / Gowns',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessory',
};

const PATTERNS: Array<{ id: PatternType; label: string }> = [
  { id: 'solid', label: 'Solid' },
  { id: 'striped', label: 'Striped' },
  { id: 'plaid', label: 'Plaid' },
  { id: 'floral', label: 'Floral' },
  { id: 'polka dot', label: 'Polka Dot' },
  { id: 'animal print', label: 'Animal' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'graphic print', label: 'Graphic' },
];

const SCALES: Array<{ id: PatternScale; label: string }> = [
  { id: 'micro', label: 'Micro' },
  { id: 'medium', label: 'Medium' },
  { id: 'macro', label: 'Macro' },
];

export const AddGarmentModal: React.FC<AddGarmentModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors, mode } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [autoIdentifiedCategory, setAutoIdentifiedCategory] = useState<ClothingCategory | null>('top');
  const [pattern, setPattern] = useState<PatternType>('solid');
  const [patternScale, setPatternScale] = useState<PatternScale>('medium');
  const [autoIdentifiedPattern, setAutoIdentifiedPattern] = useState<PatternType | null>(null);
  const [selectedHex, setSelectedHex] = useState('#0A5C36');
  const [colorName, setColorName] = useState('Emerald Silk');
  const [imageUrl, setImageUrl] = useState(SAMPLE_PRESETS[0].imageUrl);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categories: ClothingCategory[] = ['top', 'bottom', 'one-piece', 'outerwear', 'shoes', 'accessory'];

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
      showAtelierToast({
        title: 'PERMISSION REQUIRED',
        message: 'Camera permission is required to photograph your garment.',
        type: 'warning',
      });
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const aspect = asset.height && asset.width ? asset.height / asset.width : 1.0;
        await identifyAndProcessPhoto(asset.uri, aspect, asset.fileName || 'camera_garment.jpg', asset.base64);
      }
    } catch (e: any) {
      showAtelierToast({
        title: 'CAMERA ERROR',
        message: e.message || 'Could not open camera.',
        type: 'error',
      });
    }
  };

  const handlePickGallery = async () => {
    const granted = await requestPermission(false);
    if (!granted) {
      showAtelierToast({
        title: 'PERMISSION REQUIRED',
        message: 'Gallery access is required to import your garment photo.',
        type: 'warning',
      });
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const aspect = asset.height && asset.width ? asset.height / asset.width : 1.0;
        await identifyAndProcessPhoto(asset.uri, aspect, asset.fileName || 'gallery_garment.jpg', asset.base64);
      }
    } catch (e: any) {
      showAtelierToast({
        title: 'GALLERY ERROR',
        message: e.message || 'Could not select photo.',
        type: 'error',
      });
    }
  };

  /**
   * On-device real-time garment identification:
   * Immediately identifies category, color, and silhouette geometry without user having to select it.
   */
  const identifyAndProcessPhoto = async (
    uri: string,
    aspectRatio = 1.0,
    hintText?: string,
    base64?: string | null
  ) => {
    setImageUrl(uri);
    setHasCustomImage(true);
    setIsAnalyzing(true);

    try {
      // Execute 100% on-device AI classification & chroma analysis with real pixel extraction
      const edgeResult = await EdgeAIPipeline.processGarment(
        uri,
        aspectRatio,
        hintText,
        base64 || undefined
      );

      const identifiedCat = edgeResult.suggestedCategory;
      setCategory(identifiedCat);
      setAutoIdentifiedCategory(identifiedCat);
      setSelectedHex(edgeResult.primaryHex);
      setColorName(edgeResult.primaryName);

      if (edgeResult.pattern) {
        setPattern(edgeResult.pattern);
        setAutoIdentifiedPattern(edgeResult.pattern);
        if (edgeResult.patternScale) {
          setPatternScale(edgeResult.patternScale);
        }
      }

      // Auto-generate haute-couture name if currently empty or default
      const catLabel =
        identifiedCat === 'one-piece'
          ? 'Dress'
          : identifiedCat === 'top'
          ? 'Top'
          : identifiedCat === 'bottom'
          ? 'Trousers'
          : identifiedCat === 'outerwear'
          ? 'Outerwear'
          : identifiedCat === 'shoes'
          ? 'Shoes'
          : 'Piece';
      const patternPrefix = edgeResult.pattern && edgeResult.pattern !== 'solid' ? `${edgeResult.pattern} ` : '';
      setName(`Tailored ${patternPrefix}${edgeResult.primaryName} ${catLabel}`);

      showAtelierToast({
        title: 'AI CLASSIFICATION COMPLETE',
        message: `Identified as ${identifiedCat.toUpperCase()} · ${edgeResult.primaryName}`,
        type: 'success',
        icon: 'sparkles',
      });
    } catch {
      // Graceful fallback to neutral tone
      setSelectedHex('#1A1917');
      setColorName('Black');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setAutoIdentifiedCategory(preset.category);
    setPattern(preset.pattern || 'solid');
    setPatternScale(preset.patternScale || 'medium');
    setAutoIdentifiedPattern(preset.pattern || 'solid');
    setSelectedHex(preset.hex);
    setColorName(preset.colorName);
    setImageUrl(preset.imageUrl);
    setHasCustomImage(true);
    showAtelierToast({
      title: 'PRESET LOADED',
      message: `Identified as ${preset.category.toUpperCase()} (${preset.colorName})`,
      type: 'info',
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAtelierToast({
        title: 'NAME REQUIRED',
        message: 'Please give your garment an atelier name.',
        type: 'warning',
      });
      return;
    }

    setUploading(true);

    const newItem: WardrobeItem = {
      id: `w-${Date.now()}`,
      name: name.trim(),
      category,
      primaryColor: selectedHex,
      primaryColorName: colorName,
      pattern,
      patternScale: pattern !== 'solid' ? patternScale : undefined,
      imageUrl: imageUrl,
      createdAt: Date.now(),
    };

    onSave(newItem);
    setUploading(false);
    onClose();
    setName('');
    setHasCustomImage(false);

    showAtelierToast({
      title: 'PIECE VAULTED',
      message: `${newItem.name} added to your digital wardrobe.`,
      type: 'success',
      icon: 'shirt',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Add a Piece</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Real-time AI categorization & color extraction
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Viewfinder Preview & Action Bar */}
            <View
              style={[
                styles.imagePreviewWrap,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder },
              ]}
            >
              <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />

              {/* Live Analyzing Shimmer */}
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.analyzingText}>AI Classifying Silhouette...</Text>
                </View>
              )}

              {/* Camera & Gallery Action Buttons */}
              <View style={styles.captureOverlay}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCaptureCamera}
                  style={[styles.captureBtn, { backgroundColor: 'rgba(20, 19, 18, 0.88)' }]}
                >
                  <Ionicons name="camera" size={15} color="#FFFFFF" />
                  <Text style={styles.captureBtnText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickGallery}
                  style={[styles.captureBtn, { backgroundColor: 'rgba(20, 19, 18, 0.88)' }]}
                >
                  <Ionicons name="images" size={15} color="#FFFFFF" />
                  <Text style={styles.captureBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Real-Time Extracted Color & Identified Silhouette Badge */}
              <View style={[styles.scanBadge, { backgroundColor: 'rgba(20, 19, 18, 0.92)' }]}>
                <View style={[styles.scanDot, { backgroundColor: selectedHex }]} />
                <Text style={styles.scanText}>{colorName}</Text>
                <View style={styles.badgeDivider} />
                <Ionicons name="sparkles" size={12} color={colors.accent} />
                <Text style={[styles.scanText, { color: colors.accent, fontWeight: '800' }]}>
                  {category.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Quick Inspiration Presets */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Quick Presets</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {SAMPLE_PRESETS.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSelectPreset(p)}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: colors.surfaceRaised,
                      borderColor: p.imageUrl === imageUrl ? colors.accent : colors.surfaceBorder,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Image source={{ uri: p.imageUrl }} style={styles.presetThumb} />
                  <Text style={[styles.presetText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.presetSub, { color: colors.accent }]} numberOfLines={1}>
                    {p.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Piece Name Input */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Garment Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceRaised,
                  color: colors.textPrimary,
                  borderColor: colors.surfaceBorder,
                },
              ]}
              placeholder="e.g. Linen Relaxed Overshirt"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Category Selector with Immediate Auto-Identification */}
            <View style={styles.catHeaderRow}>
              <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0, marginTop: 0 }]}>
                Category
              </Text>
              {autoIdentifiedCategory && (
                <View style={styles.autoIdentifiedTag}>
                  <Ionicons name="sparkles" size={11} color={colors.accent} />
                  <Text style={[styles.autoIdentifiedTagText, { color: colors.accent }]}>
                    Auto-Identified · Tap to adjust
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.catRow}>
              {categories.map((c) => {
                const isActive = category === c;
                const isAuto = autoIdentifiedCategory === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.7}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.catBtn,
                      {
                        backgroundColor: isActive ? colors.accent : colors.surfaceRaised,
                        borderColor: isActive ? colors.accent : colors.surfaceBorder,
                      },
                    ]}
                  >
                    {isAuto && (
                      <Ionicons
                        name="sparkles"
                        size={11}
                        color={isActive ? '#141312' : colors.accent}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.catText,
                        { color: isActive ? '#141312' : colors.textSecondary },
                        isActive && styles.catTextActive,
                      ]}
                    >
                      {CATEGORY_LABELS[c] || c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pattern & Print Grammar Selector */}
            <View style={styles.catHeaderRow}>
              <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0, marginTop: 0 }]}>
                Pattern / Print
              </Text>
              {autoIdentifiedPattern && autoIdentifiedPattern !== 'solid' && (
                <View style={styles.autoIdentifiedTag}>
                  <Ionicons name="sparkles" size={11} color={colors.accent} />
                  <Text style={[styles.autoIdentifiedTagText, { color: colors.accent }]}>
                    AI Print Detected
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.catRow}>
              {PATTERNS.map((p) => {
                const isActive = pattern === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.7}
                    onPress={() => setPattern(p.id)}
                    style={[
                      styles.catBtn,
                      {
                        backgroundColor: isActive ? colors.accent : colors.surfaceRaised,
                        borderColor: isActive ? colors.accent : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.catText,
                        { color: isActive ? '#141312' : colors.textSecondary },
                        isActive && styles.catTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pattern Scale (if not solid) */}
            {pattern !== 'solid' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: 4 }]}>
                  Pattern Scale
                </Text>
                <View style={styles.catRow}>
                  {SCALES.map((s) => {
                    const isActive = patternScale === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        activeOpacity={0.7}
                        onPress={() => setPatternScale(s.id)}
                        style={[
                          styles.catBtn,
                          {
                            backgroundColor: isActive ? colors.accent : colors.surfaceRaised,
                            borderColor: isActive ? colors.accent : colors.surfaceBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catText,
                            { color: isActive ? '#141312' : colors.textSecondary },
                            isActive && styles.catTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Save to Closet Action */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={uploading || isAnalyzing}
              style={[
                styles.saveBtn,
                { backgroundColor: colors.accent },
                (uploading || isAnalyzing) && styles.saveBtnDisabled,
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#141312" />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Ionicons name="checkmark-circle" size={18} color="#141312" style={{ marginRight: 6 }} />
                  <Text style={[styles.saveBtnText, { color: '#141312' }]}>Save to Atelier Closet</Text>
                </View>
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 13, 12, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  captureOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 5,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scanBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 5,
  },
  scanDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  presetScroll: {
    marginBottom: SPACING.sm,
  },
  presetCard: {
    width: 90,
    marginRight: 10,
    alignItems: 'center',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  presetThumb: {
    width: 58,
    height: 58,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  presetSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  input: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  autoIdentifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoIdentifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  catTextActive: {
    fontWeight: '800',
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    marginBottom: 24,
    ...SHADOWS.float,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
