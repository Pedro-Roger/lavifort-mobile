import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';
import { Appointment, TipoCompromisso } from '@/types';
import { Card, CardBody, Badge, Button } from '@/components/ui';
import { formatDateUTC, formatDateTimeLocal } from '@/utils/format';

export interface AppointmentCardProps {
  appointment: Appointment;
  isDeleting?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  onConclude?: (appointment: Appointment) => void;
  isConcluding?: boolean;
  /** ISO do toque quando a conclusão aguarda envio (outbox). */
  pendingSince?: string;
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
  onConclude,
  isConcluding = false,
  pendingSince,
  testID = 'appointment-card',
}: AppointmentCardProps) {
  const tipoConfig = TIPO_COLORS[appointment.tipo];
  const tipoLabel = TIPO_LABELS[appointment.tipo];
  const isVisit = appointment.tipo === 'VISITA';
  const concluded = Boolean(appointment.concludedAt);

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
          <Text style={styles.dateText}>{formatDateUTC(appointment.data)}</Text>
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

      {isVisit && concluded ? (
        <View style={[styles.statusBox, styles.doneBox]} testID={`${testID}-done`}>
          <Text style={styles.doneText}>
            Concluída · {formatDateTimeLocal(appointment.concludedAt)}
          </Text>
        </View>
      ) : isVisit && pendingSince ? (
        <View style={[styles.statusBox, styles.pendingBox]} testID={`${testID}-pending`}>
          <Text style={styles.pendingText}>
            Pendente de envio · concluída em {formatDateTimeLocal(pendingSince)}
          </Text>
        </View>
      ) : isVisit && onConclude ? (
        <Button
          title="Concluir visita"
          size="sm"
          isLoading={isConcluding}
          disabled={isConcluding}
          onPress={() => onConclude(appointment)}
          accessibilityLabel={`Concluir visita ${appointment.titulo}`}
          testID={`${testID}-conclude-button`}
          style={styles.concludeButton}
        />
      ) : null}

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
  concludeButton: { marginTop: spacing.md },
  statusBox: { marginTop: spacing.md, padding: spacing.sm, borderRadius: radii.md, borderWidth: 1 },
  doneBox: { backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
  doneText: { color: '#047857', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold },
  pendingBox: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
  pendingText: { color: '#b45309', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});