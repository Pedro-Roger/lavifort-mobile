import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Order } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PHASE_CONFIG, STATUS_CONFIG, formatMoney, formatDate } from './orderMeta';

export interface OrderCardProps {
  order: Order;
  onPress?: (order: Order) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OrderCard({ order, onPress, style, testID = `order-card-${order.id}` }: OrderCardProps) {
  const phase = PHASE_CONFIG[order.phase] || PHASE_CONFIG.DRAFT;
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.ORCAMENTO;
  const number = order.orderNumber || order.id;

  return (
    <Card
      onPress={onPress ? () => onPress(order) : undefined}
      style={[styles.container, style]}
      testID={testID}
    >
      <View style={styles.topRow}>
        <Text style={styles.orderNumber} numberOfLines={1}>
          #{number}
        </Text>
        <Badge
          label={phase.label}
          backgroundColor={phase.bg}
          textColor={phase.text}
          borderColor={phase.border}
          size="sm"
          testID={`order-phase-badge-${order.id}`}
        />
      </View>

      <Text style={styles.clientName} numberOfLines={1}>
        {order.clientName || 'Cliente sem nome'}
      </Text>

      <View style={styles.metaRow}>
        <Badge
          label={status.label}
          backgroundColor={status.bg}
          textColor={status.text}
          borderColor={status.border}
          size="sm"
          testID={`order-status-badge-${order.id}`}
        />
        <Text style={styles.date}>{formatDate(order.orderDate)}</Text>
      </View>

      <Text style={styles.total}>{formatMoney(order.totalAmount)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
  },
  clientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  date: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
  },
  total: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
    marginTop: spacing.xs,
  },
});