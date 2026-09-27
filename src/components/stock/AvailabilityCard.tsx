import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/core/theme';
import { StockAvailability } from '@/types';
import { Card } from '../ui';

export interface AvailabilityCardProps {
  item: StockAvailability;
  testID?: string;
}

/**
 * Card de disponibilidade de um produto. Jerarquía tipográfica clara:
 * available bem visível, reserved/blocked secundário.
 */
export function AvailabilityCard({ item, testID = 'stock-availability-card' }: AvailabilityCardProps) {
  const hasReservedBlocked = item.reserved > 0 || item.blocked > 0;

  return (
    <Card style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.productName}
        </Text>
        <Text style={styles.unitName}>
          {item.unit} · {item.unitName}
        </Text>
      </View>

      <Text style={styles.location} numberOfLines={1}>
        {item.locationName}
      </Text>

      <View style={styles.metricsRow}>
        <View style={styles.metricMain}>
          <Text style={styles.metricMainValue}>{item.available}</Text>
          <Text style={styles.metricMainLabel}>Disponível</Text>
        </View>

        {hasReservedBlocked && (
          <View style={styles.metricSide}>
            <Text style={styles.metricSideValue}>{item.reserved}</Text>
            <Text style={styles.metricSideLabel}>Reservado</Text>
          </View>
        )}

        {hasReservedBlocked && (
          <View style={styles.metricSide}>
            <Text style={styles.metricSideValue}>{item.blocked}</Text>
            <Text style={styles.metricSideLabel}>Bloqueado</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  unitName: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  location: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSubtle,
  },
  metricMain: {
    alignItems: 'flex-start',
  },
  metricMainValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.brand[600],
    lineHeight: typography.lineHeights['2xl'],
  },
  metricMainLabel: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  metricSide: {
    alignItems: 'flex-start',
  },
  metricSideValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    lineHeight: typography.lineHeights.xl,
  },
  metricSideLabel: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
  },
});
