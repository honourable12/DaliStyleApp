import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
      <Text style={styles.heading}>STUDIO LAB</Text>
      <Text style={styles.subHeading}>Interactive color & contrast testing</Text>

      {/* Live Harmony Score Gauge */}
      <View style={styles.gaugeCard}>
        <View style={styles.gaugeRow}>
          <View style={styles.gaugeCol}>
            <Text style={styles.gaugeScore}>{harmony.score}%</Text>
            <Text style={styles.gaugeLabel}>GARMENT HARMONY</Text>
            <Text style={styles.gaugeSub}>{harmony.type.toUpperCase()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.gaugeCol}>
            <Text style={styles.gaugeScore}>{skinContrast}%</Text>
            <Text style={styles.gaugeLabel}>SKIN CONTRAST</Text>
            <Text style={styles.gaugeSub}>{userProfile.monkLabel} PROFILE</Text>
          </View>
        </View>
      </View>

      {/* Preview Selected Combination */}
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
            <Text style={styles.previewName}>{selectedTop.name}</Text>
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
            <Text style={styles.previewName}>{selectedBottom.name}</Text>
          </View>
        )}
      </View>

      {/* Top Selector Carousel */}
      <Text style={styles.pickerTitle}>SELECT TOP</Text>
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

      {/* Bottom Selector Carousel */}
      <Text style={styles.pickerTitle}>SELECT BOTTOM</Text>
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
    padding: SPACING.md,
    paddingBottom: 40,
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
  gaugeCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
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
    height: 40,
    backgroundColor: COLORS.surfaceBorder,
  },
  gaugeScore: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  gaugeLabel: {
    color: COLORS.accent,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  gaugeSub: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  previewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  previewBox: {
    width: 130,
    alignItems: 'center',
  },
  previewImg: {
    width: 130,
    height: 160,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  previewName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  pickerTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: SPACING.sm,
    marginBottom: 8,
  },
  pickerScroll: {
    marginBottom: SPACING.md,
  },
  pickerItem: {
    width: 64,
    height: 76,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
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
    bottom: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
