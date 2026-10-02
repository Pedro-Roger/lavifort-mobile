import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Region, Cliente } from '@/types';
import { regionsService } from '@/services/regions.service';
import { clientsService } from '@/services/clients.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncStore } from '@/stores/sync.store';
import { ClientCard } from '@/components/clients';
import { OfflineBanner, Button } from '@/components/ui';

/**
 * Carteira de clientes da vendedora, filtrada por região de atuação.
 *
 * - Carrega regiões (GET /regions, com fallback offline p/ lista default).
 * - Carrega clientes (GET /clients).
 * - Filtra client-side pela região selecionada (uf/cidade), padrão = região
 *   atribuída à vendedora no login (ou a primeira disponível).
 */
export default function CarteiraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isConnected } = useSyncStore();

  const [regions, setRegions] = useState<Region[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    const list = await regionsService.getRegions();
    setRegions(list);
    return list;
  }, []);

  const loadClients = useCallback(async () => {
    const page = await clientsService.getClients();
    const items = Array.isArray(page.items) ? page.items : [];
    setClients(items);
    return items;
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [regionList] = await Promise.all([loadRegions(), loadClients()]);
      // Região da vendedora do perfil, senão a primeira.
      const preferred = (user as { regiaoId?: string } | null)?.regiaoId;
      const preferredRegion = regionList.find((r) => r.id === preferred);
      setSelectedRegionId((prev) => {
        if (prev) return prev;
        if (preferredRegion) return preferredRegion.id;
        return regionList.length > 0 ? regionList[0].id : null;
      });
    } catch {
      setError('Não foi possível carregar a carteira de clientes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadRegions, loadClients, user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    load();
  }, [load]);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selectedRegionId) || null,
    [regions, selectedRegionId]
  );

  const wallet = useMemo(() => {
    if (!selectedRegion) return clients;
    return regionsService.filterCarteira(selectedRegion, clients);
  }, [selectedRegion, clients]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        testID="carteira-back-button"
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>‹ Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Carteira</Text>
    </View>
  );

  const renderRegionChips = () => {
    if (regions.length === 0) return null;
    return (
      <View style={styles.regionRow} testID="carteira-region-selector">
        {regions.map((region) => {
          const isActive = region.id === selectedRegionId;
          return (
            <TouchableOpacity
              key={region.id}
              testID={`carteira-region-${region.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Região: ${region.nome}`}
              accessibilityState={{ selected: isActive }}
              style={[styles.regionChip, isActive && styles.regionChipActive]}
              onPress={() => setSelectedRegionId(region.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.regionChipText, isActive && styles.regionChipTextActive]}>
                {region.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer} testID="carteira-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.stateHint}>Carregando carteira...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer} testID="carteira-error">
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateHint}>{error}</Text>
          <Button
            title="Tentar novamente"
            variant="outline"
            onPress={load}
            style={styles.retryButton}
            testID="carteira-retry-button"
          />
        </View>
      );
    }
    return (
      <View style={styles.stateContainer} testID="carteira-empty">
        <Text style={styles.stateTitle}>Nenhum cliente nesta região</Text>
        <Text style={styles.stateHint}>
          {selectedRegion
            ? `Os clientes de ${selectedRegion.nome} aparecerão aqui.`
            : 'Selecione uma região para ver a carteira.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderHeader()}
      <OfflineBanner testID="carteira-offline-banner" hideWhenSynced />

      <Text style={styles.subtitle}>
        {selectedRegion ? `Carteira de ${selectedRegion.nome}` : 'Carteira da vendedora'}
        {wallet.length > 0 ? ` · ${wallet.length} ${wallet.length === 1 ? 'cliente' : 'clientes'}` : ''}
      </Text>

      {renderRegionChips()}

      <FlatList
        data={wallet}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ClientCard client={item} testID={`carteira-client-${item.id}`} />
          </View>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, wallet.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand[600]]}
            tintColor={colors.brand[600]}
          />
        }
        testID="carteira-list"
      />

      {!isConnected ? (
        <Text style={styles.offlineNote}>
          Modo offline: exibindo carteira local. Conecte-se para atualizar.
        </Text>
      ) : null}
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
    marginBottom: spacing.xs,
  },
  backButton: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
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
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.md,
  },
  regionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  regionChip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  regionChipActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  regionChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textSecondary,
  },
  regionChipTextActive: {
    color: colors.neutral.white,
    fontWeight: typography.fontWeights.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardWrapper: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.surface,
    overflow: 'hidden',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    textAlign: 'center',
  },
  stateHint: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.base,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    minWidth: 140,
  },
  offlineNote: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    color: colors.sync.offline,
    textAlign: 'center',
  },
});