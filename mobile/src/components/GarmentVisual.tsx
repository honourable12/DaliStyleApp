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

      {/* High-visibility Editorial Fallback Card */}
      {showFallback && (
        <View style={[styles.fallbackContainer, { borderColor: primaryColor }]}>
          {/* Glowing color aura */}
          <View
            style={[
              styles.colorAura,
              { backgroundColor: primaryColor, opacity: 0.22 },
            ]}
          />

          <Ionicons
            name={getCategoryIcon(category)}
            size={iconSize}
            color={COLORS.textPrimary}
          />

          <View style={styles.colorPill}>
            <View style={[styles.swatchDot, { backgroundColor: primaryColor }]} />
            <Text style={styles.swatchText} numberOfLines={1}>
              {primaryColorName || primaryColor}
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
    backgroundColor: COLORS.surfaceRaised,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1.5,
  },
  colorAura: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 13, 12, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 6,
    maxWidth: '90%',
  },
  swatchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  swatchText: {
    color: COLORS.accentSoft,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
