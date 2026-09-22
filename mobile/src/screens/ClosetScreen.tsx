import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { ClothingCategory, WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';

interface ClosetScreenProps {
  items: WardrobeItem[];
  onSelectItem: (item: WardrobeItem) => void;
  onPressAdd: () => void;
}

const COLUMN_WIDTH = (Dimensions.get('window').width - SPACING.md * 3) / 2;

export const ClosetScreen: React.FC<ClosetScreenProps> = ({
  items,
  onSelectItem,
  onPressAdd,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'ALL' },
    { id: 'top', label: 'TOPS' },
    { id: 'bottom', label: 'BOTTOMS' },
    { id: 'outerwear', label: 'OUTER' },
    { id: 'shoes', label: 'SHOES' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Category Horizontal Filter */}
      <View style={styles.filterRow}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Wardrobe 2-Column Grid */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSelectItem(item)}
            style={styles.card}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: item.primaryColor },
                  ]}
                />
              </View>
              <Text style={styles.cardMeta}>
                {item.category.toUpperCase()} · {item.primaryColorName}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found in this category.</Text>
          </View>
        }
      />

      {/* Floating Add Item Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressAdd}
        style={styles.fab}
      >
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: COLORS.background,
  },
  gridContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: COLUMN_WIDTH * 1.25,
  },
  cardInfo: {
    padding: SPACING.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  cardMeta: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPlus: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '800',
    marginRight: 6,
    lineHeight: 18,
  },
  fabText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
});
