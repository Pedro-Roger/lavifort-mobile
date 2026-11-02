import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Package, CalendarCheck, Users, LogOut, ChevronRight, MoreHorizontal } from 'lucide-react-native';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import larvifortLogo from '@/assets/larvifort-logo.png';
import { Order } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncStore } from '@/stores/sync.store';
import { ordersService } from '@/services/orders.service';
import { appointmentsService } from '@/services/appointments.service';
import { OfflineBanner, Card } from '@/components/ui';
import { groupVisits } from '@/components/appointments';
import { PHASE_CONFIG, formatMoney } from '@/components/orders/orderMeta';

/** Home da vendedora: Pedidos, Visitas e Clientes + resumo do dia. */
export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { init: initSync, syncNow, isConnected } = useSyncStore();
  const [visitsToday, setVisitsToday] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [v, o] = await Promise.allSettled([
      appointmentsService.getAppointments({ tipo: 'VISITA' }),
      ordersService.getOrders({ limit: 5 }),
    ]);
    if (v.status === 'fulfilled') {
      const pending = await appointmentsService.getPendingCheckins().catch(() => ({}));
      setVisitsToday(groupVisits(v.value, pending)[0].data.length);
    }
    if (o.status === 'fulfilled') setOrders(o.value.slice(0, 5));
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    initSync();
    load();
  }, [initSync, load]);

  const go = (route: string) => router.push(route as never);

  const tiles = [
    { id: 'pedidos', label: 'Pedidos', hint: 'Fazer e acompanhar', icon: Package, route: '/pedidos' },
    { id: 'visitas', label: 'Visitas', hint: 'Agenda e conclusão', icon: CalendarCheck, route: '/agenda' },
    { id: 'clientes', label: 'Clientes', hint: 'Lista e detalhes', icon: Users, route: '/clientes' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header} testID="app-header">
        <Image source={larvifortLogo} style={styles.logo} resizeMode="contain" testID="header-logo" />
        <View style={styles.flex1}>
          <Text style={styles.hello} numberOfLines={1}>
            Olá{user ? `, ${(user.nome || user.email || '').split(' ')[0]}` : ''}
          </Text>
          <Text style={styles.sub}>Seu dia comercial</Text>
        </View>
        <TouchableOpacity testID="more-header-button" accessibilityRole="button" accessibilityLabel="Mais módulos" style={styles.iconBtn} onPress={() => go('/modules')}>
          <MoreHorizontal size={20} color={colors.neutral.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity testID="logout-header-button" accessibilityRole="button" accessibilityLabel="Sair" style={styles.iconBtn} onPress={() => logout()}>
          <LogOut size={18} color={colors.neutral.textSecondary} />
        </TouchableOpacity>
      </View>

      <OfflineBanner testID="offline-banner" onSyncPress={() => syncNow()} onPressBanner={() => go('/sync-status')} />

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
        <TouchableOpacity style={styles.summary} activeOpacity={0.8} onPress={() => go('/agenda')} testID="home-visits-summary" accessibilityRole="button">
          <Text style={styles.summaryNumber}>{visitsToday ?? '–'}</Text>
          <View style={styles.flex1}>
            <Text style={styles.summaryTitle}>{visitsToday === 1 ? 'visita para hoje' : 'visitas para hoje'}</Text>
            <Text style={styles.summaryHint}>{isConnected ? 'Toque para abrir a agenda' : 'Sem internet — dados podem estar desatualizados'}</Text>
          </View>
          <ChevronRight size={20} color={colors.neutral.white} />
        </TouchableOpacity>

        <View style={styles.tiles}>
          {tiles.map((t) => (
            <TouchableOpacity key={t.id} style={styles.tile} activeOpacity={0.7} onPress={() => go(t.route)} accessibilityRole="button" accessibilityLabel={t.label} testID={`home-tile-${t.id}`}>
              <View style={styles.tileIcon}>
                <t.icon size={22} color={colors.brand[700]} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.tileLabel}>{t.label}</Text>
                <Text style={styles.tileHint}>{t.hint}</Text>
              </View>
              <ChevronRight size={18} color={colors.neutral.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Pedidos recentes</Text>
        {orders === null ? (
          <Text style={styles.muted}>Carregando...</Text>
        ) : orders.length === 0 ? (
          <Text style={styles.muted} testID="home-no-orders">Nenhum pedido ainda.</Text>
        ) : (
          orders.map((o) => {
            const phase = PHASE_CONFIG[o.phase] || PHASE_CONFIG.DRAFT;
            return (
              <Card
                key={o.id}
                style={styles.orderCard}
                onPress={() => router.push({ pathname: '/pedido-detalhe', params: { id: o.id } } as never)}
                testID={`home-order-${o.id}`}
              >
                <View style={styles.flex1}>
                  <Text style={styles.orderClient} numberOfLines={1}>{o.clientName || 'Cliente sem nome'}</Text>
                  <Text style={styles.muted}>#{o.orderNumber || o.id.slice(0, 6)} · {formatMoney(o.totalAmount)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: phase.bg, borderColor: phase.border }]}>
                  <Text style={[styles.badgeText, { color: phase.text }]}>{phase.label}</Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  flex1: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  logo: { width: 36, height: 36 },
  hello: { fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.neutral.textPrimary },
  sub: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
  iconBtn: { minHeight: minTouchTarget, minWidth: minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.brand[600], borderRadius: radii.lg, padding: spacing.lg },
  summaryNumber: { fontSize: 40, fontWeight: typography.fontWeights.bold, color: colors.neutral.white },
  summaryTitle: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.neutral.white },
  summaryHint: { fontSize: typography.fontSizes.sm, color: colors.brand[100] },
  tiles: { gap: spacing.sm },
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 68, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.neutral.border, backgroundColor: colors.neutral.surface },
  tileIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  tileHint: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
  sectionTitle: { marginTop: spacing.md, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.neutral.textSecondary, textTransform: 'uppercase' },
  muted: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
  orderCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  orderClient: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill, borderWidth: 1 },
  badgeText: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold },
});
