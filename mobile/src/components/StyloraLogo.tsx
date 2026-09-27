import React from 'react';
import { View, Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';

interface StyloraLogoProps {
  size?: number; // total size of the component
  withWhiteBg?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const StyloraLogo: React.FC<StyloraLogoProps> = ({
  size = 48,
  withWhiteBg = true,
  containerStyle,
  imageStyle,
}) => {
  const imageSize = withWhiteBg ? Math.round(size * 0.74) : size;
  const borderRadius = Math.round(size * 0.22);

  if (!withWhiteBg) {
    return (
      <Image
        source={require('../../assets/logo.png')}
        style={[
          {
            width: size,
            height: size,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: '#FFFFFF',
          borderRadius: borderRadius,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        },
        containerStyle,
      ]}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={[
          {
            width: imageSize,
            height: imageSize,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};
