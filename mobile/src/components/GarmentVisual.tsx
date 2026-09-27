import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClothingCategory } from '../types';
import { COLORS } from '../theme';

interface GarmentVisualProps {
  imageUrl?: string;
  category: ClothingCategory;
  primaryColor: string;
  primaryColorName: string;
  name?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  iconSize?: number;
}

export const GarmentVisual: React.FC<GarmentVisualProps> = ({
  imageUrl,
  category,
  primaryColor,
  primaryColorName,
  name = '',
  style,
  imageStyle,
  iconSize = 24,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getCategoryIcon = (cat: ClothingCategory): keyof typeof Ionicons.glyphMap => {
    switch (cat) {
      case 'top':
        return 'shirt-outline';
      case 'bottom':
        return 'layers-outline';
      case 'outerwear':
        return 'shield-outline';
      case 'shoes':
        return 'footsteps-outline';
      case 'accessory':
        return 'watch-outline';
      default:
        return 'pricetag-outline';
    }
  };

  const showFallback = !imageUrl || hasError;

  return (
    <View style={[styles.container, style]}>
      {!showFallback && (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, imageStyle]}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {showFallback && (
        <View style={styles.fallback}>
          {/* soft color wash */}
          <View style={[styles.colorWash, { backgroundColor: primaryColor, opacity: 0.18 }]} />
          <Ionicons
            name={getCategoryIcon(category)}
            size={iconSize}
            color={COLORS.textPrimary}
          />
          <View style={styles.swatchDotRow}>
            <View style={[styles.swatchDot, { backgroundColor: primaryColor }]} />
            <Text style={styles.swatchText} numberOfLines={1}>
              {primaryColorName}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorWash: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    borderRadius: 999,
  },
  swatchDotRow: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 13, 12, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: '88%',
  },
  swatchDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  swatchText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
});
