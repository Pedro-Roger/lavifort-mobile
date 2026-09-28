import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/core/theme';
import { Task } from '@/types';
import { Card, CardBody, Badge, Button } from '../ui';

export interface ActivityCardProps {
  activity: Task;
  isConfirming?: boolean;
  onConfirm?: (activity: Task) => void;
  testID?: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
}

/**
 * Card de atividade de campo.
 *
 * Alinhamento TechLead: fluxo direto — sem seleção de progresso intermediário
 * ('Iniciar' / 'Em andamento'). A atividade está "Não executada" ou o operador
 * toca "Concluir" (check-in com geolocalização).
 */
export function ActivityCard({
  activity,
  isConfirming = false,
  onConfirm,
  testID = 'activity-card',
}: ActivityCardProps) {
  const isConfirmed = Boolean(activity.confirmation);

  return (
    <Card testID={testID}>
      <CardBody>
        <Text style={styles.title} numberOfLines={2}>
          {activity.titulo}
        </Text>

        {activity.clienteName ? (
          <Text style={styles.client} numberOfLines={1}>
            {activity.clienteName}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Prazo</Text>
          <Text style={styles.metaValue}>{formatDate(activity.prazo)}</Text>
        </View>

        <View style={styles.statusRow}>
          {isConfirmed ? (
            <Badge
              type="custom"
              label={`Concluída em ${formatDate(activity.confirmation?.confirmedAt)}`}
              size="sm"
              backgroundColor="#d1fae5"
              textColor="#047857"
              borderColor="#6ee7b7"
              testID="activity-status-badge"
            />
          ) : (
            <Badge
              type="custom"
              label="Não executada"
              size="sm"
              backgroundColor="#fef3c7"
              textColor="#b45309"
              borderColor="#fcd34d"
              testID="activity-status-badge"
            />
          )}
        </View>

        {!isConfirmed && (
          <Button
            title="Concluir"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isConfirming}
            disabled={isConfirming}
            onPress={() => onConfirm?.(activity)}
            accessibilityLabel={`Concluir atividade ${activity.titulo}`}
            testID="activity-confirm-button"
            style={styles.confirmButton}
          />
        )}
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  client: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  metaLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  metaValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  statusRow: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  confirmButton: {
    marginTop: spacing.md,
  },
});
