import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { useSyncStore } from '@/stores/sync.store';
import { OutboxItemCard } from '@/components/sync/OutboxItemCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type FilterType = 'ALL' | 'PENDING' | 'ERROR';

export default function SyncStatusScreen() {
  const router = useRouter();
  const {
    isConnected,
    isSyncing,
    pendingCount,
    errorCount,
    lastSyncedAt,
    mutations,
    init,
    loadMutations,
    syncNow,
    retryErrors,
    retryMutation,
    removeMutation,
    refreshStatus,
    clearOutbox,
  } = useSyncStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    init();
    loadMutations();
  }, [init, loadMutations]);

  const filteredMutations = useMemo(() => {
    if (activeFilter === 'PENDING') {
      return mutations.filter((m) => m.status === 'PENDING' || m.status === 'SYNCING');
    }
    if (activeFilter === 'ERROR') {
      return mutations.filter((m) => m.status === 'ERROR');
    }
    return mutations;
  }, [mutations, activeFilter]);

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Nenhuma sincronização nesta sessão';
    try {
      const date = new Date(isoString);
      return date.toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleManualSync = async () => {
    if (!isConnected) {
      Alert.alert('Modo Offline', 'Conecte-se à internet para sincronizar suas alterações.');
      return;
    }
    await syncNow();
  };

  const handleRetryAll = async () => {
    await retryErrors();
  };

  const handleClearOutbox = () => {
    Alert.alert(
      'Limpar Fila de Sincronização',
      'Tem certeza de que deseja descartar todas as alterações locais pendentes? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await clearOutbox();
          },
        },
      ]
    );
  };

  const handleRetryItem = async (id: string) => {
    await retryMutation(id);
  };

  const handleRemoveItem = async (id: string) => {
    await removeMutation(id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="sync-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sincronização</Text>

        <TouchableOpacity
          testID="sync-refresh-button"
          accessibilityRole="button"
          accessibilityLabel="Atualizar status"
          style={styles.refreshButton}
          onPress={refreshStatus}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Network & Overview Card */}
        <View style={styles.overviewCard} testID="sync-overview-card">
          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <Text style={styles.statusTitle}>Conectividade</Text>
              <Text style={styles.statusSubtitle}>
                {isConnected ? 'Dispositivo conectado à internet' : 'Dispositivo sem conexão (Offline)'}
              </Text>
            </View>
            <Badge
              label={isConnected ? 'Online' : 'Offline'}
              backgroundColor={isConnected ? '#d1fae5' : colors.neutral.surfaceSubtle}
              textColor={isConnected ? '#047857' : colors.neutral.textSecondary}
              borderColor={isConnected ? '#6ee7b7' : colors.neutral.border}
              size="md"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <Text style={styles.statusTitle}>Status do Sync</Text>
              <Text style={styles.statusSubtitle}>
                {isSyncing
                  ? 'Sincronizando com a lavifort-API...'
                  : pendingCount === 0 && errorCount === 0
                  ? 'Todas as alterações sincronizadas'
                  : `${pendingCount} pendente(s), ${errorCount} erro(s)`}
              </Text>
            </View>
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.brand[600]} testID="sync-spinner" />
            ) : errorCount > 0 ? (
              <Badge syncStatus="ERROR" label={`${errorCount} Erro(s)`} size="md" />
            ) : pendingCount > 0 ? (
              <Badge syncStatus="PENDING" label={`${pendingCount} Pendente(s)`} size="md" />
            ) : (
              <Badge syncStatus="SYNCED" label="Sincronizado" size="md" />
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.lastSyncRow}>
            <Text style={styles.lastSyncLabel}>Último sincronismo:</Text>
            <Text style={styles.lastSyncValue} testID="last-sync-timestamp">
              {formatLastSync(lastSyncedAt)}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          <Button
            title={isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            onPress={handleManualSync}
            isLoading={isSyncing}
            disabled={!isConnected || isSyncing}
            variant="primary"
            fullWidth
            testID="sync-now-button"
          />

          <View style={styles.secondaryActionsRow}>
            {errorCount > 0 && (
              <Button
                title="Reprocessar Erros"
                onPress={handleRetryAll}
                variant="outline"
                size="sm"
                testID="retry-all-errors-button"
                style={styles.flexButton}
              />
            )}

            {mutations.length > 0 && (
              <Button
                title="Limpar Fila"
                onPress={handleClearOutbox}
                variant="ghost"
                size="sm"
                testID="clear-outbox-button"
                style={styles.flexButton}
              />
            )}
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{mutations.length}</Text>
            <Text style={styles.metricLabel}>Total na Fila</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: colors.brand[600] }]}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>Pendentes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#dc2626' }]}>{errorCount}</Text>
            <Text style={styles.metricLabel}>Erros / Conflitos</Text>
          </View>
        </View>

        {/* Section Title & Filter Tabs */}
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>Fila Outbox ({filteredMutations.length})</Text>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              testID="filter-all"
              style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
              onPress={() => setActiveFilter('ALL')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'ALL' && styles.filterTabTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="filter-pending"
              style={[styles.filterTab, activeFilter === 'PENDING' && styles.filterTabActive]}
              onPress={() => setActiveFilter('PENDING')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'PENDING' && styles.filterTabTextActive,
                ]}
              >
                Pendentes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="filter-error"
              style={[styles.filterTab, activeFilter === 'ERROR' && styles.filterTabActive]}
              onPress={() => setActiveFilter('ERROR')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'ERROR' && styles.filterTabTextActive,
                ]}
              >
                Erros
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mutations List */}
        {filteredMutations.length === 0 ? (
          <View style={styles.emptyContainer} testID="empty-outbox-state">
            <Text style={styles.emptyTitle}>Nenhuma mutação na fila</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'ERROR'
                ? 'Nenhum erro de sincronização encontrado.'
                : activeFilter === 'PENDING'
                ? 'Nenhuma alteração pendente no momento.'
                : 'Todas as alterações locais foram processadas com sucesso.'}
            </Text>
          </View>
        ) : (
          filteredMutations.map((mutation) => (
            <OutboxItemCard
              key={mutation.id}
              mutation={mutation}
              onRetry={handleRetryItem}
              onRemove={handleRemoveItem}
              testID={`outbox-item-${mutation.id}`}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  backButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand[600],
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  refreshButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  refreshButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textSecondary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  overviewCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabelContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  statusSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.borderSubtle,
    marginVertical: spacing.sm,
  },
  lastSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastSyncLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  lastSyncValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  actionsContainer: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flexButton: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.neutral.surface,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  metricLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  queueTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.sm,
    padding: 2,
  },
  filterTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  filterTabActive: {
    backgroundColor: colors.neutral.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterTabText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  filterTabTextActive: {
    color: colors.brand[600],
    fontWeight: typography.fontWeights.bold,
  },
  emptyContainer: {
    backgroundColor: colors.neutral.surface,
    borderRadius: radii.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
