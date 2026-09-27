import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { colors, typography, radii } from '@/core/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name?: string;
  imageUri?: string;
  size?: AvatarSize | number;
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  testID?: string;
}

const AVATAR_COLORS = [
  '#0284c7', // Brand blue
  '#0d9488', // Teal
  '#059669', // Emerald
  '#d97706', // Amber
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#4f46e5', // Indigo
  '#475569', // Slate
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDeterministicColor(str?: string): string {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function Avatar({
  name,
  imageUri,
  size = 'md',
  backgroundColor,
  textColor = '#ffffff',
  style,
  textStyle,
  imageStyle,
  testID = 'avatar-container',
}: AvatarProps) {
  const getDimension = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 28;
      case 'lg':
        return 48;
      case 'xl':
        return 64;
      case 'md':
      default:
        return 36;
    }
  };

  const dimension = getDimension();
  const fontSize = typeof size === 'number' ? Math.round(size * 0.4) : getFontSize(size);
  const bgColor = backgroundColor || getDeterministicColor(name);
  const initials = getInitials(name);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
            imageStyle,
          ]}
          testID="avatar-image"
        />
      ) : (
        <Text
          testID="avatar-initials"
          style={[
            styles.initials,
            {
              fontSize,
              color: textColor,
            },
            textStyle,
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function getFontSize(size: AvatarSize): number {
  switch (size) {
    case 'sm':
      return typography.fontSizes.xs;
    case 'lg':
      return typography.fontSizes.lg;
    case 'xl':
      return typography.fontSizes['2xl'];
    case 'md':
    default:
      return typography.fontSizes.sm;
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
});
