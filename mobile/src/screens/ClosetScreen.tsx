import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING, SHADOWS, useTheme } from '../theme';
import { GarmentVisual } from '../components/GarmentVisual';
import { WorkbenchTray } from '../components/WorkbenchTray';
import { batchUploadQueue } from '../uploads/BatchUploadQueue';

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
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleBatchPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick photos.');
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
      }
    } catch (e: any) {
      Alert.alert('Gallery error', e.message || 'Could not pick photos.');
    }
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
      <View style={styles.filterRow}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
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
              style={styles.card}
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
                style={[styles.quickAddBtn, inWorkbench && styles.quickAddBtnActive]}
              >
                <Ionicons
                  name={inWorkbench ? 'checkmark' : 'add'}
                  size={16}
                  color={inWorkbench ? COLORS.background : COLORS.textPrimary}
                />
              </TouchableOpacity>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardMetaRow}>
                  <View style={[styles.colorDot, { backgroundColor: item.primaryColor }]} />
                  <Text style={styles.cardMeta}>
                    {item.category} · {item.primaryColorName}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No pieces here yet.</Text>
          </View>
        }
      />

      {/* Batch upload — multi-select from gallery, processed in the background */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleBatchPick}
        style={[styles.fabBatch, { bottom: 242 }]}
      >
        <Ionicons name="albums-outline" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressAdd}
        style={[styles.fab, { bottom: 170 }]}
      >
        <Ionicons name="add" size={22} color={COLORS.background} />
        <Text style={styles.fabText}>Add</Text>
      </TouchableOpacity>

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
  quickAddBtnActive: {
    backgroundColor: COLORS.accent,
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
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    gap: 6,
    ...SHADOWS.glow,
  },
  fabText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
  },
  fabBatch: {
    position: 'absolute',
    right: SPACING.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderStrong,
    ...SHADOWS.card,
  },
});
