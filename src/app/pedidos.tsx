import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Order, CreateOrderInput } from '@/types';
import { ordersService } from '@/services/orders.service';
import { OrderCard, OrderDetail, CreateOrderModal } from '@/components/orders';

export default function PedidosScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os pedidos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleSearchClients = async (search: string) => ordersService.getClients(search);

  const handleCreateOrder = async (input: CreateOrderInput) => {
    const created = await ordersService.createOrder(input);
    if (created) await loadOrders();
    return created;
  };

  const renderItem = ({ item }: { item: Order }) => (
    <OrderCard order={item} onPress={handleOrderPress} testID={`order-item-${item.id}`} />
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerBox} testID="pedidos-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.centerHint}>Carregando pedidos...</Text>
        </View>
      );
    }
    return (
      <View style={styles.centerBox} testID="pedidos-empty">
        <Text style={styles.emptyTitle}>Nenhum pedido</Text>
        <Text style={styles.emptyHint}>Crie seu primeiro pedido pelo botão acima.</Text>
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.centerBox} testID="pedidos-error">
      <Text style={styles.emptyTitle}>Não foi possível carregar os pedidos</Text>
      <Text style={styles.emptyHint}>{error}</Text>
      <TouchableOpacity
        onPress={() => loadOrders()}
        style={styles.retryButton}
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
        testID="pedidos-retry-button"
      >
        <Text style={styles.retryButtonText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="pedidos-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.headerBack}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <TouchableOpacity
          testID="pedidos-create-button"
          accessibilityRole="button"
          accessibilityLabel="Criar pedido"
          style={styles.createButton}
          onPress={() => setIsCreateOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        renderError()
      ) : (
        <FlatList
          testID="pedidos-list"
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadOrders(true)}
              colors={[colors.brand[600]]}
              tintColor={colors.brand[600]}
            />
          }
        />
      )}

      {/* Detail */}
      <OrderDetailModal
        order={selectedOrder}
        visible={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
      />

      {/* Create */}
      <CreateOrderModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSearchClients={handleSearchClients}
        onCreateOrder={handleCreateOrder}
      />
    </SafeAreaView>
  );
}

function OrderDetailModal({ order, visible, onClose }: { order: Order | null; visible: boolean; onClose: () => void }) {
  if (!visible || !order) return null;
  return (
    <View style={styles.detailOverlay} testID="pedidos-detail-overlay">
      <TouchableOpacity style={styles.detailBackdrop} onPress={onClose} activeOpacity={1}>
        <View />
      </TouchableOpacity>
      <View style={styles.detailSheet}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.detailClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar detalhe"
          testID="pedidos-detail-close"
        >
          <Text style={styles.detailCloseText}>✕</Text>
        </TouchableOpacity>
        <OrderDetail order={order} testID="pedidos-detail" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerBack: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    justifyContent: 'center',
  },
  headerBackText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textSecondary,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  createButton: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
  },
  createButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.white,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  centerBox: {
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHint: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm,
  },
  retryButton: {
    marginTop: spacing.md,
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand[600],
  },
  retryButtonText: {
    color: colors.neutral.white,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  detailBackdrop: { flex: 1 },
  detailSheet: {
    backgroundColor: colors.neutral.surface,
    padding: spacing.lg,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  detailClose: {
    alignSelf: 'flex-end',
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  detailCloseText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.bold,
  },
});