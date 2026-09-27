import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';
import { OutboxMutation } from '@/types';
import { Badge } from '@/components/ui/Badge';

export interface OutboxItemCardProps {
  mutation: OutboxMutation;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
  testID?: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criar Tarefa',
  UPDATE: 'Atualizar Tarefa',
  UPDATE_STATUS: 'Alterar Status',
  UPDATE_PROGRESS: 'Atualizar Progresso',
  TRANSFER: 'Transferir Tarefa',
  DELETE: 'Excluir Tarefa',
  UPLOAD_ATTACHMENT: 'Upload de Foto',
  DELETE_ATTACHMENT: 'Excluir Anexo',
};

export function OutboxItemCard({
  mutation,
  onRetry,
  onRemove,
  testID = 'outbox-item-card',
}: OutboxItemCardProps) {
  const actionLabel = ACTION_LABELS[mutation.action] || mutation.action;

  const getStatusBadge = () => {
    switch (mutation.status) {
      case 'PENDING':
        return <Badge syncStatus="PENDING" size="sm" />;
      case 'SYNCING':
        return (
          <Badge
            label="Enviando..."
            backgroundColor="#e0f2fe"
            textColor="#0369a1"
            borderColor="#7dd3fc"
            size="sm"
          />
        );
      case 'ERROR':
        return <Badge syncStatus="ERROR" label="Erro / Conflito" size="sm" />;
      default:
        return <Badge label={mutation.status} size="sm" />;
    }
  };

  const formattedDate = () => {
    try {
      const date = new Date(mutation.createdAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return mutation.createdAt;
    }
  };

  const getPayloadSummary = () => {
    if (!mutation.payload) return null;

    if (mutation.payload.titulo && typeof mutation.payload.titulo === 'string') {
      return `"${mutation.payload.titulo}"`;
    }
    if (mutation.payload.status && typeof mutation.payload.status === 'string') {
      return `Novo status: ${mutation.payload.status}`;
    }
    if (typeof mutation.payload.progresso === 'number') {
      return `Progresso: ${mutation.payload.progresso}%`;
    }
    if (mutation.payload.nome && typeof mutation.payload.nome === 'string') {
      return `Arquivo: ${mutation.payload.nome}`;
    }
    return null;
  };

  const payloadSummary = getPayloadSummary();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        mutation.status === 'ERROR' && styles.cardError,
        mutation.status === 'SYNCING' && styles.cardSyncing,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>{actionLabel}</Text>
          <Text style={styles.entitySubtitle}>
            {mutation.entityType}: {mutation.entityId.slice(0, 8)}...
          </Text>
        </View>
        <View style={styles.badgeWrapper}>{getStatusBadge()}</View>
      </View>

      {payloadSummary && (
        <Text style={styles.payloadSummaryText} numberOfLines={1}>
          {payloadSummary}
        </Text>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{`Horário: ${formattedDate()}`}</Text>
        <Text style={styles.metaText}>{`Tentativas: ${mutation.retryCount}`}</Text>
      </View>

      {mutation.status === 'ERROR' && mutation.errorMessage && (
        <View style={styles.errorContainer} testID={`${testID}-error-box`}>
          <Text style={styles.errorTitle}>Motivo do erro:</Text>
          <Text style={styles.errorMessage}>{mutation.errorMessage}</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        {mutation.status === 'ERROR' && onRetry && (
          <TouchableOpacity
            testID={`${testID}-retry-button`}
            accessibilityRole="button"
            accessibilityLabel="Reprocessar mutação"
            style={styles.retryButton}
            onPress={() => onRetry(mutation.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Reprocessar</Text>
          </TouchableOpacity>
        )}

        {onRemove && (
          <TouchableOpacity
            testID={`${testID}-remove-button`}
            accessibilityRole="button"
            accessibilityLabel="Descartar mutação"
            style={styles.removeButton}
            onPress={() => onRemove(mutation.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>Descartar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  cardError: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffafb',
  },
  cardSyncing: {
    borderColor: '#7dd3fc',
    backgroundColor: '#f0f9ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  actionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  entitySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
  payloadSummaryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textPrimary,
    backgroundColor: colors.neutral.surfaceSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSubtle,
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  errorContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radii.sm,
  },
  errorTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#b91c1c',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: typography.fontSizes.xs,
    color: '#991b1b',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.brand[600],
    borderRadius: radii.sm,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.sm,
  },
  removeButtonText: {
    color: colors.neutral.textSecondary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
});
