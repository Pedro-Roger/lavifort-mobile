import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/core/theme';
import { Delivery } from '@/types';
import { DeliveryStatus, DELIVERY_STATUS_FLOW } from '@/services/deliveries.service';
import { Card, CardHeader, CardBody, CardFooter, Badge, Button } from '@/components/ui';
import { deliveryStatusConfig } from './deliveryStatusConfig';

export interface DeliveryCardProps {
  delivery: Delivery;
  isAdvancing?: boolean;
  onAdvance?: (delivery: Delivery, nextStatus: DeliveryStatus) => void;
}

export function getNextDeliveryStatus(status: string): DeliveryStatus | null {
  const index = DELIVERY_STATUS_FLOW.indexOf(status as DeliveryStatus);
  if (index < 0 || index >= DELIVERY_STATUS_FLOW.length - 1) return null;
  return DELIVERY_STATUS_FLOW[index + 1];
}

export function DeliveryCard({ delivery, isAdvancing = false, onAdvance }: DeliveryCardProps) {
  const config = deliveryStatusConfig[delivery.status as DeliveryStatus] ?? {
    label: delivery.status || 'Desconocido',
    actionLabel: 'Avanzar',
    bg: colors.neutral.surfaceSubtle,
    text: colors.neutral.textSecondary,
    border: colors.neutral.border,
  };
  const nextStatus = getNextDeliveryStatus(delivery.status);
  const isDelivered = delivery.status === 'ENTREGUE';

  return (
    <Card testID="delivery-card">
      <CardHeader style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.orderNumber} numberOfLines={1}>
            Pedido {delivery.orderNumber ?? '—'}
          </Text>
          <Badge
            type="custom"
            label={config.label}
            size="sm"
            backgroundColor={config.bg}
            textColor={config.text}
            borderColor={config.border}
            testID="delivery-status-badge"
          />
        </View>
      </CardHeader>

      <CardBody>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cliente</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.clientName ?? '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Motorista</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.driverName ?? '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehículo</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.vehiclePlate ?? '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ruta</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.route ?? '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estimada</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.estimatedAt ? new Date(delivery.estimatedAt).toLocaleString() : '—'}
          </Text>
        </View>
      </CardBody>

      {!isDelivered && nextStatus && (
        <CardFooter style={styles.footer}>
          <Button
            title={config.actionLabel}
            size="sm"
            variant="secondary"
            fullWidth
            isLoading={isAdvancing}
            disabled={isAdvancing}
            onPress={() => onAdvance?.(delivery, nextStatus)}
            testID="delivery-advance-button"
          />
        </CardFooter>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.sm,
  },
  orderNumber: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xxs,
  },
  infoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
    textAlign: 'right',
  },
  footer: {
    marginTop: spacing.md,
  },
});