import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Order, OrderTracking } from '@/types';
import { ordersService, extractApiError } from '@/services/orders.service';
import { networkMonitor } from '@/services/sync/network-monitor';
import { Card, Button } from '@/components/ui';
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline';
import { formatBRL, formatDateUTC } from '@/utils/format';

/** Acompanhamento do pedido: cabeçalho + linha do tempo por setor + fechar pedido. */
export default function PedidoDetalheScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [t, o] = await Promise.allSettled([ordersService.getOrderTracking(id), ordersService.getOrderById(id)]);
      if (o.status === 'fulfilled') setOrder(o.value);
      if (t.status === 'fulfilled') setTracking(t.value);
      else setError(extractApiError(t.reason, 'Não foi possível carregar o acompanhamento.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isClosed = order?.operationalStatus === 'FECHADO';
  const isCancelled = tracking?.ciclo === 'CANCELADO' || order?.operationalStatus === 'CANCELADO';

  const doClose = async () => {
    if (!id) return;
    if (!networkMonitor.isConnected) {
      setCloseError('Sem conexão. Fechar o pedido exige internet (validação do servidor).');
      return;
    }
    setIsClosing(true);
    setCloseError(null);
    try {
      await ordersService.closeOrder(id);
      await load();
    } catch (err) {
      const offline = (err as { response?: unknown })?.response === undefined;
      setCloseError(
        offline
          ? 'Sem conexão. Fechar o pedido exige internet.'
          : extractApiError(err, 'Não foi possível fechar o pedido.'),
      );
    } finally {
      setIsClosing(false);
    }
  };

  const confirmClose = () =>
    Alert.alert('Fechar pedido', 'Após fechar, o pedido segue para Financeiro e Logística. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Fechar pedido', onPress: doClose },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity testID="pedido-back" accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{tracking?.orderNumber ? `Pedido #${tracking.orderNumber}` : 'Pedido'}</Text>
        <View style={styles.back} />
      </View>

      {isLoading ? (
        <View style={styles.center} testID="pedido-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                load();
              }}
              colors={[colors.brand[600]]}
              tintColor={colors.brand[600]}
            />
          }
        >
          {error || !tracking ? (
            <View style={styles.center} testID="pedido-error">
              <Text style={styles.stateTitle}>Acompanhamento indisponível</Text>
              <Text style={styles.muted}>{error ?? 'Pedido não encontrado.'}</Text>
              <Button title="Tentar novamente" variant="outline" onPress={load} testID="pedido-retry" />
            </View>
          ) : (
            <>
              <Card style={styles.card} testID="pedido-header">
                <Text style={styles.client}>{tracking.clientName ?? 'Cliente sem nome'}</Text>
                <Text style={styles.total}>{formatBRL(tracking.totalAmount)}</Text>
                <Line label="Pagamento" value={tracking.paymentMethod} />
                <Line
                  label="Entrega"
                  value={`${formatDateUTC(tracking.deliveryDate)}${tracking.horaEntrega ? ` às ${tracking.horaEntrega}` : ''}`}
                />
                <Line label="Local" value={tracking.localEntrega} />
              </Card>

              <Text style={styles.section}>Andamento por setor</Text>
              <Card style={styles.card}>
                <OrderTrackingTimeline setores={tracking.setores} />
              </Card>

              {isClosed ? (
                <Text style={styles.closed} testID="pedido-closed">Pedido fechado</Text>
              ) : !isCancelled ? (
                <>
                  {closeError && (
                    <View style={styles.errorBox} testID="pedido-close-error">
                      <Text style={styles.errorText}>{closeError}</Text>
                    </View>
                  )}
                  <Button title="Fechar pedido" onPress={confirmClose} isLoading={isClosing} disabled={isClosing} testID="pedido-close-button" />
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Line({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  back: { minHeight: minTouchTarget, minWidth: 72, justifyContent: 'center' },
  backText: { fontSize: typography.fontSizes.base, color: colors.neutral.textSecondary },
  title: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.neutral.textPrimary },
  content: { gap: spacing.md, paddingBottom: spacing['3xl'], flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing['3xl'] },
  stateTitle: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  muted: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary, textAlign: 'center' },
  card: { padding: spacing.lg, gap: spacing.sm },
  client: { fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  total: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.brand[700] },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  lineLabel: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
  lineValue: { flex: 1, textAlign: 'right', fontSize: typography.fontSizes.sm, color: colors.neutral.textPrimary },
  section: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.neutral.textSecondary, textTransform: 'uppercase', marginTop: spacing.sm },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: radii.md, padding: spacing.md },
  errorText: { color: '#b91c1c', fontSize: typography.fontSizes.sm },
  closed: { textAlign: 'center', color: '#047857', fontWeight: typography.fontWeights.semibold },
});
