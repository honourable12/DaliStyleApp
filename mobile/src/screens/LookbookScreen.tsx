import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { OutfitRecommendation } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';

interface LookbookScreenProps {
  lookbook: OutfitRecommendation[];
  onRemove: (id: string) => void;
}

export const LookbookScreen: React.FC<LookbookScreenProps> = ({
  lookbook,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>YOUR CURATED LOOKBOOK</Text>
      <Text style={styles.subHeading}>Saved styles & seasonal archives</Text>

      <FlatList
        data={lookbook}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.scoreText}>HARMONY {item.harmonyScore}%</Text>
                <Text style={styles.typeText}>{item.harmonyType} · {item.weatherType}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onRemove(item.id)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Thumbnail row */}
            <View style={styles.thumbRow}>
              {item.items.map((garment) => (
                <View key={garment.id} style={styles.thumbWrap}>
                  <Image source={{ uri: garment.imageUrl }} style={styles.thumbImg} />
                  <View style={[styles.colorDot, { backgroundColor: garment.primaryColor }]} />
                </View>
              ))}
            </View>

            <Text style={styles.noteText}>{item.stylingNote}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Saved Looks</Text>
            <Text style={styles.emptySub}>
              Tap "Save Look" on your Daily recommendation to build your personal lookbook.
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
    padding: SPACING.md,
  },
  heading: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.md,
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
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: SPACING.sm,
  },
  thumbWrap: {
    width: 54,
    height: 66,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noteText: {
    color: COLORS.textPrimary,
    fontSize: 11.5,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
