import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Briefcase, Wallet, Truck, Circle } from 'lucide-react-native';
import { colors, spacing, radii, typography } from '@/core/theme';
import { OrderTrackingSetor } from '@/types';
import { formatRelative } from '@/utils/format';
import { orderedSetores, toneForColumn } from './trackingMeta';

const ICONS = { Comercial: Briefcase, Financeiro: Wallet, Logística: Truck } as const;

export function OrderTrackingTimeline({
  setores,
  testID = 'order-timeline',
}: {
  setores: OrderTrackingSetor[];
  testID?: string;
}) {
  const items = orderedSetores(setores);
  return (
    <View testID={testID}>
      {items.map((it, i) => {
        const coluna = it.coluna;
        const desde = it.desde;
        const tone = toneForColumn(coluna);
        const Icon = ICONS[it.setor] ?? Circle;
        return (
          <View key={it.setor} style={styles.row} testID={`timeline-${it.setor}`}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Icon size={16} color={tone.text} />
              </View>
              {i < items.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.body}>
              <Text style={styles.setor}>{it.setor}</Text>
              {coluna ? (
                <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                  <Text style={[styles.pillText, { color: tone.text }]}>{coluna}</Text>
                </View>
              ) : (
                <Text style={styles.muted}>Ainda não chegou neste setor</Text>
              )}
              {coluna && desde ? <Text style={styles.muted}>{formatRelative(desde)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 36 },
  dot: { width: 36, height: 36, borderRadius: radii.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, backgroundColor: colors.neutral.border, marginVertical: 2 },
  body: { flex: 1, paddingBottom: spacing.xl, gap: spacing.xs },
  setor: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill, borderWidth: 1 },
  pillText: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold },
  muted: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
});
