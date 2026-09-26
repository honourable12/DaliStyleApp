import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
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
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setCollapsed(!collapsed)}
          style={styles.headerLeft}
        >
          <Ionicons
            name="construct-outline"
            size={16}
            color={COLORS.accent}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>OUTFIT WORKBENCH</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}/3</Text>
          </View>

          {items.length >= 2 && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{harmony.score}%</Text>
              <Text style={styles.typeText}>{harmony.type.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {items.length > 0 && (
            <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setCollapsed(!collapsed)}
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

      {/* Expandable Body */}
      {!collapsed && (
        <>
          {/* 3 Garment Slots */}
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

                      {/* Remove badge */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onRemoveItem(item.id)}
                        style={styles.removeBtn}
                      >
                        <Ionicons name="close" size={12} color={COLORS.textPrimary} />
                      </TouchableOpacity>

                      <View style={styles.itemMeta}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
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
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.emptySlotLabel}>
                        {slotIndex === 0 ? '+ TOP' : slotIndex === 1 ? '+ BOTTOM' : '+ LAYER'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Action Row & Instructions */}
          {items.length === 0 ? (
            <Text style={styles.instructionText}>
              Tap the <Text style={styles.boldText}>'+'</Text> button on any piece in your closet to test combinations.
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
                <Text style={styles.btnPrimaryText}>Save as Look</Text>
              </TouchableOpacity>

              {onOpenStudio && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onOpenStudio}
                  style={[styles.btn, styles.btnSecondary]}
                >
                  <Ionicons name="color-palette-outline" size={15} color={COLORS.textPrimary} style={styles.btnIcon} />
                  <Text style={styles.btnSecondaryText}>Studio Lab</Text>
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
    borderTopWidth: 1.5,
    borderTopColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  headerIcon: {
    marginRight: 2,
  },
  title: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  countText: {
    color: COLORS.accentSoft,
    fontSize: 8.5,
    fontWeight: '700',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 10.5,
    fontWeight: '800',
  },
  typeText: {
    color: COLORS.accentSoft,
    fontSize: 7.5,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chevronBtn: {
    padding: 2,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  slot: {
    flex: 1,
    height: 82,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptySlotLabel: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.5,
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
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(14, 13, 12, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  itemMeta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(14, 13, 12, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  instructionText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 4,
  },
  boldText: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  btnSecondaryText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 4,
  },
});
