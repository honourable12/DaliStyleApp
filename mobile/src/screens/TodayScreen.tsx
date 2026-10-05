import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutfitRing } from '../components/OutfitRing';
import { OutfitRecommendation, WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING, useTheme } from '../theme';
import { GarmentVisual } from '../components/GarmentVisual';
import { showAtelierToast } from '../context/ToastContext';

interface TodayScreenProps {
  outfit: OutfitRecommendation | null;
  onReroll: () => void;
  onSaveToLookbook: (outfit: OutfitRecommendation) => void;
  onSelectItem: (item: WardrobeItem) => void;
  onOpenCloset?: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  outfit,
  onReroll,
  onSaveToLookbook,
  onSelectItem,
  onOpenCloset,
}) => {
  const { colors } = useTheme();
  const [wornLogged, setWornLogged] = useState(false);

  if (!outfit) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surfaceRaised,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
          }}
        >
          <Ionicons name="sparkles-outline" size={40} color={colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your Closet Is Ready</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Add pieces to your wardrobe to unlock your personalized, color-calibrated daily looks.
        </Text>
        {onOpenCloset && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onOpenCloset}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: RADIUS.full,
              gap: 8,
              marginTop: SPACING.lg,
            }}
          >
            <Ionicons name="shirt-outline" size={18} color={COLORS.background} />
            <Text style={{ color: COLORS.background, fontSize: 14, fontWeight: '800' }}>
              Add Clothes in Closet
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const handleLogWorn = () => {
    setWornLogged(true);
    showAtelierToast({
      title: 'OUTFIT LOGGED',
      message: "Today's look saved to your rotation archive.",
      type: 'success',
      icon: 'sparkles',
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.bannerContainer}>
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Today's Look</Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          Tuned to your skin tone & the weather
        </Text>
      </View>

      <OutfitRing
        items={outfit.items}
        harmonyScore={outfit.harmonyScore}
        harmonyType={outfit.harmonyType}
        onSelectItem={onSelectItem}
      />

      <View style={[styles.blurbCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceBorder, borderWidth: 1 }]}>
        <View style={styles.blurbHeader}>
          <Text style={[styles.blurbTag, { backgroundColor: colors.tagActiveBg, color: colors.accent }]}>{outfit.harmonyType}</Text>
          <Text style={[styles.contrastPill, { backgroundColor: colors.tagBg, color: colors.textSecondary }]}>{outfit.skinContrastScore}% contrast</Text>
        </View>
        <Text style={[styles.blurbText, { color: colors.textPrimary }]}>{outfit.stylingNote}</Text>
      </View>

      <View style={styles.piecesContainer}>
        <Text style={[styles.piecesTitle, { color: colors.textSecondary }]}>Pieces</Text>
        {outfit.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onSelectItem(item)}
            style={[styles.pieceRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 }]}
          >
            <GarmentVisual
              imageUrl={item.imageUrl}
              category={item.category}
              primaryColor={item.primaryColor}
              primaryColorName={item.primaryColorName}
              name={item.name}
              style={styles.colorSquare}
              iconSize={18}
            />
            <View style={styles.pieceInfo}>
              <Text style={[styles.pieceName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.pieceSub, { color: colors.textSecondary }]}>
                {item.category} · {item.primaryColorName}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReroll}
          style={[styles.btn, styles.btnSecondary, { backgroundColor: colors.surfaceRaised }]}
        >
          <Text style={[styles.btnSecondaryText, { color: colors.textPrimary }]}>Reroll</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSaveToLookbook(outfit)}
          style={[styles.btn, styles.btnSecondary, { backgroundColor: colors.surfaceRaised }]}
        >
          <Text style={[styles.btnSecondaryText, { color: colors.textPrimary }]}>
            {outfit.savedInLookbook ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogWorn}
          style={[styles.btn, styles.btnPrimary, wornLogged && styles.btnActive, { backgroundColor: wornLogged ? colors.success : colors.accent }]}
        >
          <Text style={[styles.btnPrimaryText, { color: colors.accentContrastText }]}>{wornLogged ? 'Worn' : 'Wear Today'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  sectionHeading: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  blurbCard: {
    width: '90%',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  blurbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  blurbTag: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  contrastPill: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  blurbText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  piecesContainer: {
    width: '90%',
    marginTop: SPACING.lg,
  },
  piecesTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  pieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  colorSquare: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    marginRight: 12,
  },
  pieceInfo: {
    flex: 1,
  },
  pieceName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pieceSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: 8,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: COLORS.surfaceRaised,
  },
  btnSecondaryText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1.4,
    backgroundColor: COLORS.accent,
  },
  btnActive: {
    backgroundColor: COLORS.success,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
