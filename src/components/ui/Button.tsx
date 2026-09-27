import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  children,
  ...rest
}: ButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  const getVariantContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.variantSecondary;
      case 'outline':
        return styles.variantOutline;
      case 'ghost':
        return styles.variantGhost;
      case 'danger':
        return styles.variantDanger;
      case 'primary':
      default:
        return styles.variantPrimary;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'ghost':
        return styles.textGhost;
      case 'danger':
        return styles.textDanger;
      case 'primary':
      default:
        return styles.textPrimary;
    }
  };

  const getSizeContainerStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getSizeTextStyle = () => {
    switch (size) {
      case 'sm':
        return styles.textSizeSm;
      case 'lg':
        return styles.textSizeLg;
      case 'md':
      default:
        return styles.textSizeMd;
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return colors.brand[600];
    }
    if (variant === 'secondary') {
      return colors.neutral.textPrimary;
    }
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isButtonDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isButtonDisabled, busy: isLoading }}
      style={[
        styles.base,
        getSizeContainerStyle(),
        getVariantContainerStyle(),
        fullWidth && styles.fullWidth,
        isButtonDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} testID="button-loading-indicator" />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}
          {title ? (
            <Text style={[styles.baseText, getSizeTextStyle(), getVariantTextStyle(), textStyle]}>
              {title}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
  },
  // Sizes
  sizeSm: {
    height: minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  sizeMd: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  sizeLg: {
    height: 54,
    paddingHorizontal: spacing.xl,
  },
  // Variant containers
  variantPrimary: {
    backgroundColor: colors.brand[600],
  },
  variantSecondary: {
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brand[600],
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  variantDanger: {
    backgroundColor: '#dc2626',
  },
  // Base text
  baseText: {
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
  },
  textSizeSm: {
    fontSize: typography.fontSizes.sm,
  },
  textSizeMd: {
    fontSize: typography.fontSizes.base,
  },
  textSizeLg: {
    fontSize: typography.fontSizes.lg,
  },
  // Variant text
  textPrimary: {
    color: '#ffffff',
  },
  textSecondary: {
    color: colors.brand[700],
  },
  textOutline: {
    color: colors.brand[600],
  },
  textGhost: {
    color: colors.neutral.textPrimary,
  },
  textDanger: {
    color: '#ffffff',
  },
});
