import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';
import { DeliveryStatus, DELIVERY_STATUS_FLOW } from '@/services/deliveries.service';

export interface StatusPillOption {
  key: DeliveryStatus | 'ALL';
  label: string;
}

export const ALL_STATUSES: StatusPillOption[] = [
  { key: 'ALL', label: 'Todas' },
  ...DELIVERY_STATUS_FLOW.map((status) => ({
    key: status,
    label: deliveryLabel(status),
  })),
];

function deliveryLabel(status: DeliveryStatus): string {
  switch (status) {
    case 'AGUARDANDO_MOTORISTA':
      return 'Aguardando';
    case 'MOTORISTA_DEFINIDO':
      return 'Mot. Definido';
    case 'SAIU_ENTREGA':
      return 'Saiu';
    case 'EM_ROTA':
      return 'Em Rota';
    case 'ENTREGUE':
      return 'Entregue';
  }
}

export interface DeliveryStatusFilterProps {
  selected: DeliveryStatus | 'ALL';
  onChange: (status: DeliveryStatus | 'ALL') => void;
  testID?: string;
}

export function DeliveryStatusFilter({
  selected,
  onChange,
  testID = 'delivery-status-filter',
}: DeliveryStatusFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={testID}
    >
      {ALL_STATUSES.map((option) => {
        const isActive = selected === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            testID={`delivery-pill-${option.key}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  pillActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  pillText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textSecondary,
  },
  pillTextActive: {
    color: colors.neutral.white,
  },
});