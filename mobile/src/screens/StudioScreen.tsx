import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { WardrobeItem, UserStyleProfile } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { calculateGarmentHarmony, calculateSkinContrast } from '../core/colorTheory';
import { GarmentVisual } from '../components/GarmentVisual';

interface StudioScreenProps {
  wardrobe: WardrobeItem[];
  userProfile: UserStyleProfile;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
  wardrobe,
  userProfile,
}) => {
  const tops = wardrobe.filter((i) => i.category === 'top');
  const bottoms = wardrobe.filter((i) => i.category === 'bottom');

  const [selectedTop, setSelectedTop] = useState<WardrobeItem | null>(tops[0] || null);
  const [selectedBottom, setSelectedBottom] = useState<WardrobeItem | null>(bottoms[0] || null);

  const colors = [
    ...(selectedTop ? [selectedTop.primaryColor] : []),
    ...(selectedBottom ? [selectedBottom.primaryColor] : []),
  ];

  const harmony = calculateGarmentHarmony(colors);
  const skinContrast = selectedTop
    ? calculateSkinContrast(userProfile.skinHex, selectedTop.primaryColor)
    : 80;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.gaugeCard}>
        <View style={styles.gaugeRow}>
          <View style={styles.gaugeCol}>
            <Text style={styles.gaugeScore}>{harmony.score}%</Text>
            <Text style={styles.gaugeLabel}>Harmony</Text>
            <Text style={styles.gaugeSub}>{harmony.type}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.gaugeCol}>
            <Text style={styles.gaugeScore}>{skinContrast}%</Text>
            <Text style={styles.gaugeLabel}>Skin contrast</Text>
            <Text style={styles.gaugeSub}>{userProfile.monkLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.previewContainer}>
        {selectedTop && (
          <View style={styles.previewBox}>
            <GarmentVisual
              imageUrl={selectedTop.imageUrl}
              category={selectedTop.category}
              primaryColor={selectedTop.primaryColor}
              primaryColorName={selectedTop.primaryColorName}
              name={selectedTop.name}
              style={styles.previewImg}
              iconSize={40}
            />
            <Text style={styles.previewName} numberOfLines={1}>{selectedTop.name}</Text>
          </View>
        )}
        {selectedBottom && (
          <View style={styles.previewBox}>
            <GarmentVisual
              imageUrl={selectedBottom.imageUrl}
              category={selectedBottom.category}
              primaryColor={selectedBottom.primaryColor}
              primaryColorName={selectedBottom.primaryColorName}
              name={selectedBottom.name}
              style={styles.previewImg}
              iconSize={40}
            />
            <Text style={styles.previewName} numberOfLines={1}>{selectedBottom.name}</Text>
          </View>
        )}
      </View>

      <Text style={styles.pickerTitle}>Top</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {tops.map((top) => {
          const isSelected = selectedTop?.id === top.id;
          return (
            <TouchableOpacity
              key={top.id}
              activeOpacity={0.8}
              onPress={() => setSelectedTop(top)}
              style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
            >
              <GarmentVisual
                imageUrl={top.imageUrl}
                category={top.category}
                primaryColor={top.primaryColor}
                primaryColorName={top.primaryColorName}
                name={top.name}
                style={styles.pickerImg}
                iconSize={20}
              />
              <View style={[styles.pickerDot, { backgroundColor: top.primaryColor }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.pickerTitle}>Bottom</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {bottoms.map((bottom) => {
          const isSelected = selectedBottom?.id === bottom.id;
          return (
            <TouchableOpacity
              key={bottom.id}
              activeOpacity={0.8}
              onPress={() => setSelectedBottom(bottom)}
              style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
            >
              <GarmentVisual
                imageUrl={bottom.imageUrl}
                category={bottom.category}
                primaryColor={bottom.primaryColor}
                primaryColorName={bottom.primaryColorName}
                name={bottom.name}
                style={styles.pickerImg}
                iconSize={20}
              />
              <View style={[styles.pickerDot, { backgroundColor: bottom.primaryColor }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  gaugeCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  gaugeCol: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: COLORS.surfaceBorder,
  },
  gaugeScore: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  gaugeLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  gaugeSub: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  previewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: SPACING.lg,
  },
  previewBox: {
    width: 140,
    alignItems: 'center',
  },
  previewImg: {
    width: 140,
    height: 170,
    borderRadius: RADIUS.lg,
  },
  previewName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  pickerTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  pickerScroll: {
    marginBottom: SPACING.lg,
  },
  pickerItem: {
    width: 68,
    height: 80,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceRaised,
  },
  pickerItemActive: {
    borderColor: COLORS.accent,
  },
  pickerImg: {
    width: '100%',
    height: '100%',
  },
  pickerDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceRaised,
  },
});
