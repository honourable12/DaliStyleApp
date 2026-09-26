import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface StyloraLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const StyloraLogo: React.FC<StyloraLogoProps> = ({ size = 28, style }) => {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.2,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};
