import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  required?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  inputWrapperStyle,
  required,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          hasError && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
          inputWrapperStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            !editable && styles.inputDisabled,
            inputStyle,
          ]}
          placeholderTextColor={colors.neutral.textMuted}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          accessibilityState={{ disabled: !editable }}
          {...rest}
        />

        {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
      </View>

      {hasError ? (
        <Text style={styles.errorText} testID="input-error-text">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  labelContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  requiredAsterisk: {
    color: '#dc2626',
    fontWeight: typography.fontWeights.bold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.brand[600],
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputWrapperDisabled: {
    backgroundColor: colors.neutral.surfaceSubtle,
    borderColor: colors.neutral.borderSubtle,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textPrimary,
    padding: 0,
  },
  inputDisabled: {
    color: colors.neutral.textMuted,
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: '#dc2626',
    marginTop: 4,
    fontWeight: typography.fontWeights.medium,
  },
  helperText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: 4,
  },
});
