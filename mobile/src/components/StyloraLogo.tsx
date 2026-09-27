import React from 'react';
import { View, Image, ImageStyle, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { SHADOWS } from '../theme';

interface StyloraLogoProps {
  size?: number;
  /** Kept for API compatibility — the mark is always the cream tile now. */
  withWhiteBg?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

/**
 * The Stylora brand mark — the charcoal+gold emblem on a cream tile.
 * Uses assets/icon.png (the same cream tile used as the app launcher icon),
 * so the in-app logo is always visually identical to the home-screen icon.
 */
export const StyloraLogo: React.FC<StyloraLogoProps> = ({
  size = 44,
  containerStyle,
  imageStyle,
}) => {
  const radius = Math.round(size * 0.24);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          ...SHADOWS.card,
        },
        containerStyle,
      ]}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="cover"
      />
    </View>
  );
};

export const styloraLogoStyles = StyleSheet.create({
  // exported for consumers that need a matching border treatment
  bordered: {
    borderWidth: 1,
    borderColor: 'rgba(242, 237, 230, 0.12)',
  },
});
