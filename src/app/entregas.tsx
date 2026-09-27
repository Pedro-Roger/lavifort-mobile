import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/core/theme';
import { Delivery } from '@/types';
import { deliveriesService, DeliveryStatus } from '@/services/deliveries.service';
import { DeliveryCard, DeliveryStatusFilter } from '@/components/deliveries';
import { Button } from '@/components/ui';

type StatusFilter = DeliveryStatus | 'ALL';

export default function EntregasScreen() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    try {
      setError(null);
      const data = await deliveriesService.getDeliveries();
      setDeliveries(data);
    } catch {
      setError('No fue posible cargar las entregas.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDeliveries();
  }, [loadDeliveries]);

  const filteredDeliveries = statusFilter === 'ALL' ? deliveries : deliveries.filter(
    (d) => d.status === statusFilter
  );

  const handleAdvance = async (delivery: Delivery, nextStatus: DeliveryStatus) => {
    setAdvancingId(delivery.id);
    try {
      const updated = await deliveriesService.updateDeliveryStatus(delivery.id, nextStatus);
      setDeliveries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch {
      Alert.alert('Error', 'No fue posible avanzar el estado de la entrega.');
    } finally {
      setAdvancingId(null);
    }
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centered} testID="deliveries-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered} testID="deliveries-error">
          <Text style={styles.emptyTitle}>Algo salió mal</Text>
          <Text style={styles.emptyHint}>{error}</Text>
          <Button
            title="Reintentar"
            variant="outline"
            onPress={loadDeliveries}
            style={styles.retryButton}
          />
        </View>
      );
    }
    return (
      <View style={styles.centered} testID="deliveries-empty">
        <Text style={styles.emptyTitle}>
          {statusFilter === 'ALL' ? 'No hay entregas' : 'Sin entregas en este estado'}
        </Text>
        <Text style={styles.emptyHint}>
          {statusFilter === 'ALL'
            ? 'Cuando se creen entregas, aparecerán aquí.'
            : 'Prueba con otro filtro de estado.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="deliveries-back-button"
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹ Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entregas</Text>
      </View>

      {/* Filtro por estado */}
      <View style={styles.filters}>
        <DeliveryStatusFilter selected={statusFilter} onChange={setStatusFilter} />
      </View>

      {isLoading ? (
        renderEmpty()
      ) : (
        <FlatList
          data={filteredDeliveries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeliveryCard
              key={`delivery-${item.id}`}
              delivery={item}
              isAdvancing={advancingId === item.id}
              onAdvance={handleAdvance}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredDeliveries.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand[600]}
            />
          }
          testID="deliveries-list"
        />
      )}
    </SafeAreaView>
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
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textSecondary,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  filters: {
    marginBottom: spacing.sm,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.base,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    minWidth: 140,
  },
});