import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';
import { FieldSearch, PendingFieldSearchRecord, Uniformidade } from '@/types';
import { Card, Badge } from '../ui';

export interface FieldSearchCardProps {
  search?: FieldSearch;
  pending?: PendingFieldSearchRecord;
  testID?: string;
}

const UNIFORMIDADE_COLORS: Record<Uniformidade, { bg: string; text: string; border: string }> = {
  OTIMA: { bg: '#d1fae5', text: '#047857', border: '#6ee7b7' },
  BOA: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  REGULAR: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  RUIM: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
};

export function uniformidadeLabel(u: Uniformidade | null): string {
  if (!u) return '—';
  return { OTIMA: 'Ótima', BOA: 'Boa', REGULAR: 'Regular', RUIM: 'Ruim' }[u];
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Card de pesquisa de campo. Renderiza uma pesquisa remota (`search`) OU um
 * registro pendente local (`pending`) — nunca os dois.
 */
export function FieldSearchCard({ search, pending, testID = 'field-search-card' }: FieldSearchCardProps) {
  const isPending = Boolean(pending);
  const clientName = pending?.clientName ?? search?.clienteNome ?? 'Cliente';
  const dataPesquisa = pending
    ? pending.input.dataPesquisa ?? pending.createdAt
    : search?.dataPesquisa;
  const larvas = pending?.input.larvas ?? search?.larvas ?? [];
  const maioria = pending ? pending.input.maioriaLarvifort : search?.maioriaLarvifort;
  const bercario = pending?.input.uniformidadeBercario ?? search?.uniformidadeBercario ?? null;
  const cultivo = pending?.input.uniformidadeCultivo ?? search?.uniformidadeCultivo ?? null;
  const sobrevBercario = pending?.input.sobrevBercario ?? search?.sobrevBercario ?? null;
  const sobrevCultivo = pending?.input.sobrevCultivo ?? search?.sobrevCultivo ?? null;

  const UniformidadeBadge = ({ label, value }: { label: string; value: Uniformidade | null }) => {
    const c = value ? UNIFORMIDADE_COLORS[value] : { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    return (
      <Badge
        type="custom"
        label={`${label}: ${uniformidadeLabel(value)}`}
        size="sm"
        backgroundColor={c.bg}
        textColor={c.text}
        borderColor={c.border}
        testID={`${testID}-uniformidade`}
      />
    );
  };

  return (
    <Card testID={testID}>
      <View style={styles.header}>
        <Text style={styles.clientName} numberOfLines={1}>
          {clientName}
        </Text>
        {isPending ? (
          <Badge
            type="custom"
            label="Pendente de envio"
            size="sm"
            backgroundColor="#fef3c7"
            textColor="#b45309"
            borderColor="#fcd34d"
            testID={`${testID}-pending-badge`}
          />
        ) : (
          <Text style={styles.date}>{formatDate(dataPesquisa)}</Text>
        )}
      </View>

      <View style={styles.larvasRow} testID={`${testID}-larvas`}>
        {larvas.length > 0
          ? larvas.map((l) => (
              <View key={`${testID}-larva-${l}`} style={styles.larvaChip}>
                <Text style={styles.larvaChipText}>{l}</Text>
              </View>
            ))
          : null}
      </View>

      <Text style={styles.meta}>
        {maioria ? 'Maioria Larvifort' : 'Concorrente majoritário'}
        {typeof sobrevBercario === 'number' ? ` · Berçário ${sobrevBercario}%` : ''}
        {typeof sobrevCultivo === 'number' ? ` · Cultivo ${sobrevCultivo}%` : ''}
      </Text>

      <View style={styles.badgesRow}>
        <UniformidadeBadge label="Berçário" value={bercario} />
        <UniformidadeBadge label="Cultivo" value={cultivo} />
      </View>

      {search?.observacoes ? (
        <Text style={styles.observacoes} numberOfLines={2}>
          {search.observacoes}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  clientName: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  date: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  larvasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  larvaChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  larvaChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[700],
    fontWeight: typography.fontWeights.medium,
  },
  meta: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  observacoes: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    lineHeight: typography.lineHeights.sm,
  },
});