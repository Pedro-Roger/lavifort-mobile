import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '@/core/theme';
import { Order } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  PHASE_CONFIG,
  STATUS_CONFIG,
  formatMoney,
  formatDate,
  formatQuantity,
} from './orderMeta';

export interface OrderDetailProps {
  order: Order;
  testID?: string;
}

export function OrderDetail({ order, testID = 'order-detail' }: OrderDetailProps) {
  const phase = PHASE_CONFIG[order.phase] || PHASE_CONFIG.DRAFT;
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.ORCAMENTO;
  const number = order.orderNumber || order.id;

  return (
    <Card style={styles.container} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>#{number}</Text>
        <Badge
          label={phase.label}
          backgroundColor={phase.bg}
          textColor={phase.text}
          borderColor={phase.border}
          size="sm"
          testID="order-detail-phase-badge"
        />
      </View>

      <View style={styles.clientRow}>
        <Text style={styles.clientName}>{order.clientName || 'Cliente sin nombre'}</Text>
        <Badge
          label={status.label}
          backgroundColor={status.bg}
          textColor={status.text}
          borderColor={status.border}
          size="sm"
          testID="order-detail-status-badge"
        />
      </View>

      <View style={styles.dates}>
        <Text style={styles.dateLabel}>Fecha: {formatDate(order.orderDate)}</Text>
        {order.deliveryDate && (
          <Text style={styles.dateLabel}>Entrega: {formatDate(order.deliveryDate)}</Text>
        )}
      </View>

      {order.items && order.items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.sectionLabel}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow} testID={`order-item-${item.id}`}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.itemLine}>
                {formatQuantity(item.quantity)} × {formatMoney(item.unitPrice)}
              </Text>
              <Text style={styles.itemTotal}>{formatMoney(item.totalPrice)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.totals}>
        {order.subtotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(order.subtotal)}</Text>
          </View>
        )}
        {order.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento</Text>
            <Text style={styles.totalValue}>-{formatMoney(order.discount)}</Text>
          </View>
        )}
        {order.shippingCost > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Envío</Text>
            <Text style={styles.totalValue}>{formatMoney(order.shippingCost)}</Text>
          </View>
        )}
        {order.taxAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Impuestos</Text>
            <Text style={styles.totalValue}>{formatMoney(order.taxAmount)}</Text>
          </View>
        )}
        <View style={styles.totalRowGrand}>
          <Text style={styles.totalLabelGrand}>Total</Text>
          <Text style={styles.totalValueGrand}>{formatMoney(order.totalAmount)}</Text>
        </View>
      </View>

      {order.notes && (
        <View>
          <Text style={styles.sectionLabel}>Notas</Text>
          <Text style={styles.notes}>{order.notes}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  clientName: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    flex: 1,
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  dateLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    marginRight: spacing.sm,
  },
  itemsSection: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.borderSubtle,
  },
  itemName: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textPrimary,
  },
  itemLine: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginLeft: spacing.xs,
  },
  itemTotal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    marginLeft: spacing.xs,
  },
  totals: {
    marginTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  totalValue: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  totalRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  totalLabelGrand: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  totalValueGrand: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  notes: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginTop: 2,
    lineHeight: typography.lineHeights.sm,
  },
});