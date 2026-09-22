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
import { wardrobeStore } from '../db/storage';

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
        <Text style={styles.emptyTitle}>Wardrobe is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Add items to your closet to generate your calibrated daily outfit.
        </Text>
      </View>
    );
  }

  const handleLogWorn = () => {
    setWornLogged(true);
    Alert.alert('Outfit Logged', 'DRAPE noted today’s wear in your local style history.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      <View style={styles.bannerContainer}>
        <Text style={styles.sectionHeading}>THE DAILY RITUAL</Text>
        <Text style={styles.subHeading}>Curated for your skin tone & weather</Text>
      </View>

      {/* The Signature Radial Outfit Ring */}
      <OutfitRing
        items={outfit.items}
        harmonyScore={outfit.harmonyScore}
        harmonyType={outfit.harmonyType}
        onSelectItem={onSelectItem}
      />

      {/* Editorial Styling Blurb */}
      <View style={styles.blurbCard}>
        <View style={styles.blurbHeader}>
          <Text style={styles.blurbTag}>COLOR THEORY NOTE</Text>
          <Text style={styles.contrastPill}>Skin Contrast {outfit.skinContrastScore}%</Text>
        </View>
        <Text style={styles.blurbText}>{outfit.stylingNote}</Text>
      </View>

      {/* Curated Pieces List */}
      <View style={styles.piecesContainer}>
        <Text style={styles.piecesTitle}>CURATED PIECES ({outfit.items.length})</Text>
        {outfit.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => onSelectItem(item)}
            style={styles.pieceRow}
          >
            <View style={[styles.colorSquare, { backgroundColor: item.primaryColor }]} />
            <View style={styles.pieceInfo}>
              <Text style={styles.pieceName}>{item.name}</Text>
              <Text style={styles.pieceSub}>
                {item.category.toUpperCase()} · {item.primaryColorName}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onReroll}
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>Reroll</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSaveToLookbook(outfit)}
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>
            {outfit.savedInLookbook ? 'Saved ★' : 'Save Look'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogWorn}
          style={[styles.btn, styles.btnPrimary, wornLogged && styles.btnActive]}
        >
          <Text style={styles.btnPrimaryText}>{wornLogged ? 'Worn ✓' : 'Wear Today'}</Text>
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
    marginBottom: 4,
  },
  sectionHeading: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  blurbCard: {
    width: '90%',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 4,
  },
  blurbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  blurbTag: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contrastPill: {
    color: COLORS.accentSoft,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blurbText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  piecesContainer: {
    width: '90%',
    marginTop: SPACING.md,
  },
  piecesTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  pieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  colorSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pieceInfo: {
    flex: 1,
  },
  pieceName: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  pieceSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginRight: 8,
  },
  btnSecondaryText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnPrimary: {
    flex: 1.5,
    backgroundColor: COLORS.accent,
  },
  btnActive: {
    backgroundColor: COLORS.success,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
