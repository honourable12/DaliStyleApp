import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING, SHADOWS, useTheme } from '../theme';
import { GarmentVisual } from '../components/GarmentVisual';
import { WorkbenchTray } from '../components/WorkbenchTray';
import { batchUploadQueue } from '../uploads/BatchUploadQueue';
import { showAtelierToast } from '../context/ToastContext';

interface ClosetScreenProps {
  items: WardrobeItem[];
  workbenchItems: WardrobeItem[];
  onSelectItem: (item: WardrobeItem) => void;
  onPressAdd: () => void;
  onAddToWorkbench: (item: WardrobeItem) => void;
  onRemoveWorkbenchItem: (id: string) => void;
  onClearWorkbench: () => void;
  onSaveWorkbenchLook: () => void;
  onDeleteItem: (id: string) => void;
  onOpenStudio?: () => void;
  onOpenWardrobeIQ?: () => void;
}

const COLUMN_WIDTH = (Dimensions.get('window').width - SPACING.lg * 3) / 2;

export const ClosetScreen: React.FC<ClosetScreenProps> = ({
  items,
  workbenchItems,
  onSelectItem,
  onPressAdd,
  onAddToWorkbench,
  onRemoveWorkbenchItem,
  onClearWorkbench,
  onSaveWorkbenchLook,
  onDeleteItem,
  onOpenStudio,
  onOpenWardrobeIQ,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addSheetVisible, setAddSheetVisible] = useState(false);

  const handleBatchPick = async () => {
    setAddSheetVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAtelierToast({
        title: 'PERMISSION REQUIRED',
        message: 'Gallery access is required to import wardrobe photos.',
        type: 'warning',
      });
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 0, // 0 = unlimited multi-select
      });
      if (!result.canceled && result.assets.length > 0) {
        batchUploadQueue.enqueue(result.assets.map((a) => a.uri));
        showAtelierToast({
          title: 'BATCH IMPORT ENQUEUED',
          message: `${result.assets.length} piece(s) queued for on-device processing.`,
          type: 'success',
          icon: 'albums',
        });
      }
    } catch (e: any) {
      showAtelierToast({
        title: 'IMPORT ERROR',
        message: e.message || 'Could not select photos.',
        type: 'error',
      });
    }
  };

  const handleSingleAdd = () => {
    setAddSheetVisible(false);
    onPressAdd();
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Bottoms' },
    { id: 'outerwear', label: 'Outer' },
    { id: 'shoes', label: 'Shoes' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.category === selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {items.length > 0 && onOpenWardrobeIQ && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenWardrobeIQ}
          style={[
            styles.wardrobeIqBanner,
            { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={[styles.iqBannerIconWrap, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="analytics" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.iqBannerTitle, { color: colors.textPrimary }]}>Wardrobe IQ & Circularity</Text>
              <Text style={[styles.iqBannerSub, { color: colors.textSecondary }]}>
                {items.length} pieces · Tap to analyze color distribution & rotation
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      <View style={styles.filterRow}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.filterPill,
                { backgroundColor: isActive ? colors.accent : colors.surfaceRaised },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? COLORS.background : colors.textSecondary },
                  isActive && styles.filterTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: 200 },
        ]}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => {
          const inWorkbench = workbenchItems.some((w) => w.id === item.id);
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSelectItem(item)}
              style={[
                styles.card,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder, borderWidth: 1 },
              ]}
            >
              <GarmentVisual
                imageUrl={item.imageUrl}
                category={item.category}
                primaryColor={item.primaryColor}
                primaryColorName={item.primaryColorName}
                name={item.name}
                style={styles.cardImage}
                iconSize={34}
              />

              {/* single, subtle workbench toggle */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onAddToWorkbench(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.quickAddBtn, inWorkbench && { backgroundColor: colors.accent }]}
              >
                <Ionicons
                  name={inWorkbench ? 'checkmark' : 'add'}
                  size={16}
                  color={inWorkbench ? COLORS.background : colors.textPrimary}
                />
              </TouchableOpacity>

              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardMetaRow}>
                  <View style={[styles.colorDot, { backgroundColor: item.primaryColor }]} />
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                    {item.category} · {item.primaryColorName}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder },
              ]}
            >
              <Ionicons name="shirt-outline" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Your Atelier Awaits
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Build your private digital vault. Add your favorite garments to unlock on-device color harmony and tailored daily looks.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setAddSheetVisible(true)}
              style={[styles.emptyAddBtn, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="add" size={20} color={COLORS.background} />
              <Text style={[styles.emptyAddBtnText, { color: COLORS.background }]}>
                Add Your First Piece
              </Text>
            </TouchableOpacity>

            <View style={[styles.emptyTipRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder }]}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={[styles.emptyTipText, { color: colors.textSecondary }]}>
                On-device AI removes backgrounds live in the viewfinder
              </Text>
            </View>
          </View>
        }
      />

      {/* Merged Single & Bulk Add Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setAddSheetVisible(true)}
        style={[styles.fab, { bottom: 170, backgroundColor: colors.accent }]}
      >
        <Ionicons name="add" size={22} color={COLORS.background} />
        <Text style={[styles.fabText, { color: COLORS.background }]}>Add Pieces</Text>
      </TouchableOpacity>

      {/* Unified Add Action Modal */}
      <Modal
        visible={addSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAddSheetVisible(false)}
        >
          <View
            style={[
              styles.actionSheetContent,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Pieces to Closet</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  Choose your preferred capture method
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddSheetVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleSingleAdd}
              style={[styles.sheetOption, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.accentMuted }]}>
                <Ionicons name="camera-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.textPrimary }]}>
                  Single Piece (Live AI Cutout)
                </Text>
                <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                  Instant camera or single photo with real-time background removal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleBatchPick}
              style={[styles.sheetOption, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.accentMuted }]}>
                <Ionicons name="albums-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.textPrimary }]}>
                  Bulk Gallery Import
                </Text>
                <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                  Select multiple wardrobe photos to process in the background
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <WorkbenchTray
        items={workbenchItems}
        onRemoveItem={onRemoveWorkbenchItem}
        onClear={onClearWorkbench}
        onSaveAsLook={onSaveWorkbenchLook}
        onOpenStudio={onOpenStudio}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  wardrobeIqBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iqBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iqBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  iqBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
  },
  filterPillActive: {
    backgroundColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  gridContent: {
    padding: SPACING.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: COLUMN_WIDTH * 1.2,
  },
  quickAddBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(14, 13, 12, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: SPACING.sm + 2,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cardMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    paddingHorizontal: SPACING.xl,
    gap: 12,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 290,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: RADIUS.full,
    gap: 8,
    marginTop: SPACING.sm,
    ...SHADOWS.glow,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  emptyTipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: RADIUS.full,
    gap: 6,
    ...SHADOWS.glow,
  },
  fabText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl + 10,
    gap: SPACING.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: {
    flex: 1,
  },
  sheetOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetOptionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
