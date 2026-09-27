import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { OutfitRing } from '../components/OutfitRing';
import { OutfitRecommendation, WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { GarmentVisual } from '../components/GarmentVisual';

interface TodayScreenProps {
  outfit: OutfitRecommendation | null;
  onReroll: () => void;
  onSaveToLookbook: (outfit: OutfitRecommendation) => void;
  onSelectItem: (item: WardrobeItem) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  outfit,
  onReroll,
  onSaveToLookbook,
  onSelectItem,
}) => {
  const [wornLogged, setWornLogged] = useState(false);

  if (!outfit) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your closet is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add pieces to generate your daily look.
        </Text>
      </View>
    );
  }

  const handleLogWorn = () => {
    setWornLogged(true);
    Alert.alert('Logged', "Today's outfit saved to your history.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.bannerContainer}>
        <Text style={styles.sectionHeading}>Today's Look</Text>
        <Text style={styles.subHeading}>
          Tuned to your skin tone & the weather
        </Text>
      </View>

      <OutfitRing
        items={outfit.items}
        harmonyScore={outfit.harmonyScore}
        harmonyType={outfit.harmonyType}
        onSelectItem={onSelectItem}
      />

      <View style={styles.blurbCard}>
        <View style={styles.blurbHeader}>
          <Text style={styles.blurbTag}>{outfit.harmonyType}</Text>
          <Text style={styles.contrastPill}>{outfit.skinContrastScore}% contrast</Text>
        </View>
        <Text style={styles.blurbText}>{outfit.stylingNote}</Text>
      </View>

      <View style={styles.piecesContainer}>
        <Text style={styles.piecesTitle}>Pieces</Text>
        {outfit.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onSelectItem(item)}
            style={styles.pieceRow}
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
              <Text style={styles.pieceName}>{item.name}</Text>
              <Text style={styles.pieceSub}>
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
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>Reroll</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSaveToLookbook(outfit)}
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>
            {outfit.savedInLookbook ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogWorn}
          style={[styles.btn, styles.btnPrimary, wornLogged && styles.btnActive]}
        >
          <Text style={styles.btnPrimaryText}>{wornLogged ? 'Worn' : 'Wear Today'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
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
