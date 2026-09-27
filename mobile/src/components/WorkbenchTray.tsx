import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../theme';
import { GarmentVisual } from './GarmentVisual';
import { calculateGarmentHarmony } from '../core/colorTheory';

interface WorkbenchTrayProps {
  items: WardrobeItem[];
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  onSaveAsLook: () => void;
  onOpenStudio?: () => void;
}

export const WorkbenchTray: React.FC<WorkbenchTrayProps> = ({
  items,
  onRemoveItem,
  onClear,
  onSaveAsLook,
  onOpenStudio,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const colors = items.map((i) => i.primaryColor);
  const harmony = calculateGarmentHarmony(colors);

  const slots = [0, 1, 2];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCollapsed(!collapsed)}
          style={styles.headerLeft}
        >
          <Ionicons name="construct-outline" size={16} color={COLORS.accent} />
          <Text style={styles.title}>Workbench</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}/3</Text>
          </View>
          {items.length >= 2 && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{harmony.score}%</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {items.length > 0 && (
            <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setCollapsed(!collapsed)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            style={styles.chevronBtn}
          >
            <Ionicons
              name={collapsed ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {!collapsed && (
        <>
          <View style={styles.slotsRow}>
            {slots.map((slotIndex) => {
              const item = items[slotIndex];
              return (
                <View key={slotIndex} style={styles.slot}>
                  {item ? (
                    <View style={styles.filledSlot}>
                      <GarmentVisual
                        imageUrl={item.imageUrl}
                        category={item.category}
                        primaryColor={item.primaryColor}
                        primaryColorName={item.primaryColorName}
                        name={item.name}
                        style={styles.slotImage}
                        iconSize={22}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onRemoveItem(item.id)}
                        style={styles.removeBtn}
                      >
                        <Ionicons name="close" size={12} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.emptySlot}>
                      <Ionicons
                        name={
                          slotIndex === 0
                            ? 'shirt-outline'
                            : slotIndex === 1
                            ? 'layers-outline'
                            : 'shield-outline'
                        }
                        size={18}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.emptySlotLabel}>
                        {slotIndex === 0 ? 'Top' : slotIndex === 1 ? 'Bottom' : 'Layer'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {items.length === 0 ? (
            <Text style={styles.instructionText}>
              Tap <Text style={styles.boldText}>+</Text> on a piece to build a look.
            </Text>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onSaveAsLook}
                disabled={items.length < 2}
                style={[styles.btn, styles.btnPrimary, items.length < 2 && styles.btnDisabled]}
              >
                <Ionicons name="bookmark-outline" size={15} color={COLORS.background} style={styles.btnIcon} />
                <Text style={styles.btnPrimaryText}>Save Look</Text>
              </TouchableOpacity>

              {onOpenStudio && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onOpenStudio}
                  style={[styles.btn, styles.btnSecondary]}
                >
                  <Ionicons name="color-palette-outline" size={15} color={COLORS.textPrimary} style={styles.btnIcon} />
                  <Text style={styles.btnSecondaryText}>Studio</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    ...SHADOWS.float,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  countText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  scorePill: {
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chevronBtn: {
    padding: 2,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  slot: {
    flex: 1,
    height: 92,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceRaised,
    overflow: 'hidden',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
  },
  emptySlotLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  filledSlot: {
    flex: 1,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(14, 13, 12, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 6,
  },
  boldText: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: COLORS.surfaceRaised,
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
