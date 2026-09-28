import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/core/theme';
import { Appointment, TipoCompromisso } from '@/types';
import { Card, CardBody, Badge, Button } from '@/components/ui';

export interface AppointmentCardProps {
  appointment: Appointment;
  isDeleting?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  testID?: string;
}

const TIPO_LABELS: Record<TipoCompromisso, string> = {
  REUNIAO: 'Reunião',
  VISITA: 'Visita',
};

const TIPO_COLORS: Record<TipoCompromisso, { bg: string; text: string; border: string }> = {
  REUNIAO: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  VISITA: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

/**
 * Card de compromisso/agendamento.
 *
 * Exibe tipo (Reunião/Visita), título, data, horário e endereço.
 * Ações: editar e excluir.
 */
export function AppointmentCard({
  appointment,
  isDeleting = false,
  onEdit,
  onDelete,
  testID = 'appointment-card',
}: AppointmentCardProps) {
  const tipoConfig = TIPO_COLORS[appointment.tipo];
  const tipoLabel = TIPO_LABELS[appointment.tipo];

  return (
    <Card testID={testID}>
      <CardBody>
        <View style={styles.headerRow}>
          <Badge
            type="custom"
            label={tipoLabel}
            size="sm"
            backgroundColor={tipoConfig.bg}
            textColor={tipoConfig.text}
            borderColor={tipoConfig.border}
            testID={`${testID}-type-badge`}
          />
          <Text style={styles.dateText}>{formatDate(appointment.data)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {appointment.titulo}
        </Text>

        {appointment.horario ? (
          <Text style={styles.hint}>🕐 {appointment.horario}</Text>
        ) : null}

        {appointment.endereco ? (
          <Text style={styles.hint} numberOfLines={1}>
            📍 {appointment.endereco}
          </Text>
        ) : null}

        {appointment.clienteName ? (
          <Text style={styles.client} numberOfLines={1}>
            {appointment.clienteName}
          </Text>
        ) : null}

        {appointment.observacoes ? (
          <Text style={styles.obs} numberOfLines={2}>
            {appointment.observacoes}
          </Text>
        ) : null}
      </CardBody>

      <View style={styles.actionsRow}>
        <Button
          title="Editar"
          variant="secondary"
          size="sm"
          onPress={() => onEdit?.(appointment)}
          accessibilityLabel={`Editar compromisso ${appointment.titulo}`}
          testID={`${testID}-edit-button`}
          style={styles.actionButton}
        />
        <Button
          title="Excluir"
          variant="secondary"
          size="sm"
          isLoading={isDeleting}
          disabled={isDeleting}
          onPress={() => onDelete?.(appointment)}
          accessibilityLabel={`Excluir compromisso ${appointment.titulo}`}
          testID={`${testID}-delete-button`}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  hint: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  client: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  obs: {
    marginTop: spacing.xxs,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});