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
      <View style={styles.tabRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('matched')}
          style={[styles.tabBtn, activeTab === 'matched' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'matched' && styles.tabTextActive]}>
            Matched
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('saved')}
          style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

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
                    <Text style={styles.scoreText}>{item.harmonyScore}%</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{item.harmonyType}</Text>
                    </View>
                  </View>
                  <Text style={styles.piecesCountText}>
                    {item.items.length} pieces · {item.skinContrastScore}% contrast
                  </Text>
                </View>

                {activeTab === 'saved' ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onRemove(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onSavePrecombined(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[styles.actionBtn, isSaved && styles.actionBtnSaved]}
                  >
                    <Ionicons
                      name={isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isSaved ? COLORS.accent : COLORS.textPrimary}
                    />
                  </TouchableOpacity>
                )}
              </View>

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

              <Text style={styles.noteText}>{item.stylingNote}</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (onWearLook) {
                    onWearLook(item);
                    Alert.alert('Applied', 'This look is now your outfit for today.');
                  }
                }}
                style={styles.wearBtn}
              >
                <Text style={styles.wearBtnText}>Wear this look</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'matched' ? 'sparkles-outline' : 'bookmark-outline'}
              size={44}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'matched' ? 'Need more pieces' : 'Nothing saved yet'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'matched'
                ? 'Add a top and a bottom to generate matched looks.'
                : 'Bookmark any outfit to keep it here.'}
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
    paddingHorizontal: SPACING.lg,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.full,
    padding: 4,
    marginVertical: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
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
    fontSize: 16,
    fontWeight: '800',
  },
  typeBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  typeText: {
    color: COLORS.accentSoft,
    fontSize: 10,
    fontWeight: '700',
  },
  piecesCountText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSaved: {
    backgroundColor: COLORS.accentMuted,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: SPACING.sm,
  },
  thumbWrap: {
    width: 68,
    height: 84,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  colorDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  noteText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  wearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  wearBtnText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
