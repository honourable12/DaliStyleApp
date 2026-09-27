import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import { GarmentVisual } from './GarmentVisual';

interface OutfitRingProps {
  items: WardrobeItem[];
  harmonyScore: number;
  harmonyType: string;
  onSelectItem?: (item: WardrobeItem) => void;
}

const RING_SIZE = Dimensions.get('window').width * 0.74;
const RADIUS_DISTANCE = RING_SIZE / 2.35;

export const OutfitRing: React.FC<OutfitRingProps> = ({
  items,
  harmonyScore,
  harmonyType,
  onSelectItem,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressCenter = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ringContainer, { transform: [{ rotate: spin }] }]}>
        <View style={styles.trackRing} />
        {items.map((item, index) => {
          const angle = (index * 2 * Math.PI) / items.length - Math.PI / 2;
          const x = RADIUS_DISTANCE * Math.cos(angle);
          const y = RADIUS_DISTANCE * Math.sin(angle);

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => onSelectItem && onSelectItem(item)}
              style={[
                styles.itemNode,
                {
                  transform: [{ translateX: x }, { translateY: y }],
                },
              ]}
            >
              <GarmentVisual
                imageUrl={item.imageUrl}
                category={item.category}
                primaryColor={item.primaryColor}
                primaryColorName={item.primaryColorName}
                name={item.name}
                iconSize={22}
              />
              <View style={[styles.colorIndicator, { backgroundColor: item.primaryColor }]} />
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePressCenter}
        style={styles.centerHub}
      >
        <Text style={styles.scoreValue}>{harmonyScore}%</Text>
        <Text style={styles.scoreLabel}>Harmony</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{harmonyType}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRing: {
    position: 'absolute',
    width: RING_SIZE - 24,
    height: RING_SIZE - 24,
    borderRadius: (RING_SIZE - 24) / 2,
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 48, 0.18)',
  },
  itemNode: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surfaceRaised,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  colorIndicator: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surfaceRaised,
  },
  centerHub: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  scoreValue: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 0,
  },
  typeBadge: {
    marginTop: 5,
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeText: {
    color: COLORS.accentSoft,
    fontSize: 9,
    fontWeight: '700',
  },
});
