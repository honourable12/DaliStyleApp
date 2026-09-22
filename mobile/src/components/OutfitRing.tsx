import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS } from '../theme';

interface OutfitRingProps {
  items: WardrobeItem[];
  harmonyScore: number;
  harmonyType: string;
  onSelectItem?: (item: WardrobeItem) => void;
}

const RING_SIZE = Dimensions.get('window').width * 0.76;
const RADIUS_DISTANCE = RING_SIZE / 2.3;

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
        duration: 800,
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
        {/* Radial Circular Guide Track */}
        <View style={styles.trackRing} />

        {/* Orbiting Wardrobe Items */}
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
                  transform: [
                    { translateX: x },
                    { translateY: y },
                  ],
                },
              ]}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
              <View style={[styles.colorIndicator, { backgroundColor: item.primaryColor }]} />
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Central Interactive Harmony Hub */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePressCenter}
        style={styles.centerHub}
      >
        <Text style={styles.scoreValue}>{harmonyScore}%</Text>
        <Text style={styles.scoreLabel}>HARMONY</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{harmonyType}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE + 70,
    height: RING_SIZE + 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRing: {
    position: 'absolute',
    width: RING_SIZE - 20,
    height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 168, 48, 0.22)', // Turmeric faint ring
    borderStyle: 'dashed',
  },
  itemNode: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surfaceRaised,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  colorIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  categoryBadge: {
    position: 'absolute',
    top: 2,
    backgroundColor: 'rgba(14, 13, 12, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  categoryText: {
    color: COLORS.accentSoft,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerHub: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  scoreValue: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    color: COLORS.accent,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -2,
  },
  typeBadge: {
    marginTop: 4,
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  typeText: {
    color: COLORS.accentSoft,
    fontSize: 8,
    fontWeight: '600',
  },
});
