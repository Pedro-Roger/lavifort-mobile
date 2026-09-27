import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, radii } from '@/core/theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'subtle';

export interface CardProps {
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  activeOpacity?: number;
  testID?: string;
  touchableProps?: TouchableOpacityProps;
}

export function Card({
  variant = 'default',
  onPress,
  style,
  children,
  activeOpacity = 0.7,
  testID = 'card-container',
  touchableProps,
}: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.variantElevated;
      case 'outlined':
        return styles.variantOutlined;
      case 'subtle':
        return styles.variantSubtle;
      case 'default':
      default:
        return styles.variantDefault;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[styles.base, getVariantStyle(), style]}
        accessibilityRole="button"
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[styles.base, getVariantStyle(), style]}>
      {children}
    </View>
  );
}

export function CardHeader({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardBody({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return <View style={[styles.body, style]}>{children}</View>;
}

export function CardFooter({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  variantDefault: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  variantElevated: {
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  variantOutlined: {
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
  },
  variantSubtle: {
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
  },
  header: {
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSubtle,
  },
});
