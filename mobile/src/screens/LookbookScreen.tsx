import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutfitRecommendation } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { GarmentVisual } from '../components/GarmentVisual';

interface LookbookScreenProps {
  savedLooks: OutfitRecommendation[];
  precombinedLooks: OutfitRecommendation[];
  onRemove: (id: string) => void;
  onSavePrecombined: (outfit: OutfitRecommendation) => void;
  onWearLook?: (outfit: OutfitRecommendation) => void;
}

export const LookbookScreen: React.FC<LookbookScreenProps> = ({
  savedLooks,
  precombinedLooks,
  onRemove,
  onSavePrecombined,
  onWearLook,
}) => {
  const [activeTab, setActiveTab] = useState<'matched' | 'saved'>('matched');

  const displayedList = activeTab === 'matched' ? precombinedLooks : savedLooks;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>CURATED LOOKBOOK</Text>
      <Text style={styles.subHeading}>Precombined matched styles and personal archives</Text>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('matched')}
          style={[styles.tabBtn, activeTab === 'matched' && styles.tabBtnActive]}
        >
          <Ionicons
            name="sparkles-outline"
            size={14}
            color={activeTab === 'matched' ? COLORS.background : COLORS.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'matched' && styles.tabTextActive]}>
            MATCHED LOOKS ({precombinedLooks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('saved')}
          style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
        >
          <Ionicons
            name="bookmark-outline"
            size={14}
            color={activeTab === 'saved' ? COLORS.background : COLORS.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            SAVED VAULT ({savedLooks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Outfits List */}
      <FlatList
        data={displayedList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSaved = savedLooks.some((s) => s.id === item.id);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreText}>HARMONY {item.harmonyScore}%</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{item.harmonyType.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.piecesCountText}>
                    {item.items.length} pieces · Skin Contrast {item.skinContrastScore}%
                  </Text>
                </View>

                {activeTab === 'saved' ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onRemove(item.id)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onSavePrecombined(item)}
                    style={[styles.actionBtn, isSaved && styles.actionBtnSaved]}
                  >
                    <Ionicons
                      name={isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={isSaved ? COLORS.accent : COLORS.textPrimary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Garments Thumbnail Row */}
              <View style={styles.thumbRow}>
                {item.items.map((garment) => (
                  <View key={garment.id} style={styles.thumbWrap}>
                    <GarmentVisual
                      imageUrl={garment.imageUrl}
                      category={garment.category}
                      primaryColor={garment.primaryColor}
                      primaryColorName={garment.primaryColorName}
                      name={garment.name}
                      style={styles.thumbImg}
                      iconSize={18}
                    />
                    <View style={[styles.colorDot, { backgroundColor: garment.primaryColor }]} />
                  </View>
                ))}
              </View>

              {/* Editorial styling note */}
              <Text style={styles.noteText}>{item.stylingNote}</Text>

              {/* Action Buttons */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onWearLook) {
                      onWearLook(item);
                      Alert.alert('Outfit Selected', 'Applied this look as your active outfit for today!');
                    }
                  }}
                  style={styles.wearBtn}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.background} style={styles.btnIcon} />
                  <Text style={styles.wearBtnText}>Wear This Look</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'matched' ? 'shirt-outline' : 'bookmark-outline'}
              size={48}
              color={COLORS.surfaceBorder}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'matched' ? 'Need More Clothes' : 'No Saved Looks Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'matched'
                ? 'Add at least one Top and one Bottom to your closet to generate precombined matched looks.'
                : 'Tap the bookmark icon on any outfit to archive it into your personal vault.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  heading: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tabTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  typeBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  typeText: {
    color: COLORS.accentSoft,
    fontSize: 7.5,
    fontWeight: '700',
  },
  piecesCountText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  actionBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  actionBtnSaved: {
    borderColor: COLORS.accent,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: SPACING.sm,
  },
  thumbWrap: {
    width: 62,
    height: 76,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  colorDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  noteText: {
    color: COLORS.textPrimary,
    fontSize: 11.5,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardFooter: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.sm,
  },
  wearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  wearBtnText: {
    color: COLORS.background,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
