import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { mapsService } from '@/services/maps.service';

export interface AddressButtonProps {
  address?: string | null;
  variant?: 'compact' | 'full' | 'inline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  onPress?: () => void;
  onCopyAddress?: (address: string) => void;
}

export function AddressButton({
  address,
  variant = 'compact',
  style,
  textStyle,
  testID = 'address-button',
  onPress,
  onCopyAddress,
}: AddressButtonProps) {
  const cleanAddress = address?.trim();

  if (!cleanAddress) {
    return null;
  }

  const handlePress = () => {
    try {
      if (onPress) {
        onPress();
        return;
      }
      if (mapsService && typeof mapsService.openAddressSelector === 'function') {
        mapsService.openAddressSelector(cleanAddress, onCopyAddress);
      }
    } catch (err: any) {
      console.log('HANDLE_PRESS_ERROR:', err?.message, err?.stack);
      throw err;
    }
  };

  if (variant === 'full') {
    return (
      <TouchableOpacity
        testID={testID}
        style={[styles.fullContainer, style]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Abrir rotas para ${cleanAddress}`}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.pinIcon}>📍</Text>
        </View>
        <View style={styles.textColumn}>
          <Text style={styles.labelTitle}>Localização / Endereço</Text>
          <Text style={[styles.fullAddressText, textStyle]} numberOfLines={2}>
            {cleanAddress}
          </Text>
        </View>
        <View style={styles.actionPill}>
          <Text style={styles.actionPillText}>Rotas ➔</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'inline') {
    return (
      <TouchableOpacity
        testID={testID}
        style={[styles.inlineContainer, style]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Rotas para ${cleanAddress}`}
      >
        <Text style={styles.pinIconSmall}>📍</Text>
        <Text style={[styles.inlineAddressText, textStyle]} numberOfLines={1}>
          {cleanAddress}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default 'compact'
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.compactContainer, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Abrir rotas para ${cleanAddress}`}
    >
      <Text style={styles.pinIconSmall}>📍</Text>
      <Text style={[styles.compactAddressText, textStyle]} numberOfLines={1}>
        {cleanAddress}
      </Text>
      <View style={styles.compactBadge}>
        <Text style={styles.compactBadgeText}>Rotas</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[200],
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    minHeight: minTouchTarget,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  pinIcon: {
    fontSize: 16,
  },
  pinIconSmall: {
    fontSize: 13,
    marginRight: spacing.xs,
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.xs,
  },
  labelTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand[700],
  },
  fullAddressText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textPrimary,
    fontWeight: typography.fontWeights.regular,
    marginTop: 2,
  },
  actionPill: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  actionPillText: {
    color: colors.neutral.white,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.borderSubtle,
    borderColor: colors.neutral.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: minTouchTarget,
  },
  compactAddressText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginRight: spacing.xs,
  },
  compactBadge: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  compactBadgeText: {
    color: colors.neutral.white,
    fontSize: 10,
    fontWeight: typography.fontWeights.semibold,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  inlineAddressText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[600],
    fontWeight: typography.fontWeights.medium,
  },
});
