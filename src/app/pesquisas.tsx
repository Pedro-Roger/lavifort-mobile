import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Cliente, FieldSearch, PendingFieldSearchRecord, FieldSearchInput } from '@/types';
import { pesquisasService } from '@/services/pesquisas.service';
import { clientsService } from '@/services/clients.service';
import { useAuthStore } from '@/stores/auth.store';
import { FieldSearchCard, FieldSearchFormModal } from '@/components/pesquisas';
import { Button } from '@/components/ui';

/**
 * Pesquisa de Campo — questionário de pós-larvas preenchido na fazenda/loja.
 *
 * Offline-first: a lista mostra pesquisas remotas + pendências locais
 * (badge "Pendente de envio"). Ao salvar sem rede, a pesquisa vai para a
 * fila local e é enviada por "Sincronizar" (ou automaticamente no próximo load).
 */
export default function PesquisasScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [searches, setSearches] = useState<FieldSearch[]>([]);
  const [pending, setPending] = useState<PendingFieldSearchRecord[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clientsPage, list] = await Promise.all([
        clientsService.getClients().catch(() => null),
        pesquisasService.getSearchesWithPending(),
      ]);
      if (clientsPage) setClients(Array.isArray(clientsPage.items) ? clientsPage.items : []);
      setSearches(list.remote);
      setPending(list.pending);
    } catch {
      setError('Não foi possível carregar as pesquisas.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-sync best-effort ao abrir (drena pendências quando há rede).
  useEffect(() => {
    if (pending.length === 0) return;
    pesquisasService.syncPendingSearches().then((result) => {
      if (result.synced > 0) load();
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    load();
  }, [load]);

  const pendingCount = pending.length;

  const listData = useMemo(
    () => [
      ...pending.map((p) => ({ key: `pending-${p.id}`, pending: p, search: null as FieldSearch | null })),
      ...searches.map((s) => ({ key: `search-${s.id}`, pending: null as PendingFieldSearchRecord | null, search: s })),
    ],
    [pending, searches]
  );

  const handleSubmit = async (input: FieldSearchInput): Promise<boolean> => {
    try {
      await pesquisasService.createSearch(input);
      Alert.alert('Pesquisa salva', 'Enviada para o servidor com sucesso.');
      await load();
      return true;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const isNetworkError = !status; // sem resposta = rede indisponível
      if (isNetworkError) {
        const clientName = clients.find((c) => c.id === input.clienteId);
        const label = clientName
          ? `${clientName.firstName} ${clientName.lastName}`.trim()
          : 'Cliente';
        await pesquisasService.savePendingSearch(input, label);
        setPending(await pesquisasService.getPendingSearches());
        Alert.alert(
          'Salvo no aparelho',
          'Sem conexão agora. A pesquisa foi guardada e será enviada automaticamente quando a internet voltar.'
        );
        return true;
      }
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      Alert.alert('Erro', typeof message === 'string' ? message : 'Não foi possível salvar a pesquisa.');
      return false;
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await pesquisasService.syncPendingSearches();
      if (result.synced > 0 || result.failed === 0) {
        Alert.alert(
          'Sincronização',
          `${result.synced} pesquisa(s) enviada(s)${result.failed > 0 ? `, ${result.failed} falhou(ram)` : ''}.`
        );
      } else {
        Alert.alert('Sincronização', `${result.failed} pesquisa(s) não puderam ser enviadas. Verifique a conexão.`);
      }
      await load();
    } finally {
      setIsSyncing(false);
    }
  };

  const renderItem = ({ item }: { item: (typeof listData)[number] }) => (
    <FieldSearchCard
      key={item.key}
      search={item.search ?? undefined}
      pending={item.pending ?? undefined}
      testID={`pesquisa-card-${item.key}`}
    />
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer} testID="pesquisas-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.stateHint}>Carregando pesquisas...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer} testID="pesquisas-error">
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateHint}>{error}</Text>
          <Button
            title="Tentar novamente"
            variant="outline"
            onPress={load}
            style={styles.retryButton}
            testID="pesquisas-retry-button"
          />
        </View>
      );
    }
    return (
      <View style={styles.stateContainer} testID="pesquisas-empty">
        <Text style={styles.stateTitle}>Nenhuma pesquisa ainda</Text>
        <Text style={styles.stateHint}>
          Toque em "Nova Pesquisa" para preencher o questionário na fazenda.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="pesquisas-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pesquisa de Campo</Text>
        <TouchableOpacity
          testID="pesquisas-create-button"
          accessibilityRole="button"
          accessibilityLabel="Nova pesquisa"
          style={styles.createButton}
          onPress={() => setIsFormOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {pendingCount > 0
          ? `${pendingCount} ${pendingCount === 1 ? 'pesquisa aguardando envio' : 'pesquisas aguardando envio'}`
          : 'Questionário de pós-larvas dos clientes da sua região.'}
      </Text>

      {pendingCount > 0 ? (
        <TouchableOpacity
          testID="pesquisas-sync-button"
          accessibilityRole="button"
          accessibilityLabel="Sincronizar pesquisas pendentes"
          style={styles.syncButton}
          onPress={handleSync}
          activeOpacity={0.7}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.brand[600]} />
          ) : (
            <Text style={styles.syncButtonText}>Sincronizar pendentes</Text>
          )}
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        style={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, listData.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand[600]]}
            tintColor={colors.brand[600]}
          />
        }
        testID="pesquisas-list"
      />

      <FieldSearchFormModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        clients={clients}
        onSubmit={handleSubmit}
        responsavelId={user?.id ?? null}
        testID="pesquisas-form-modal"
      />
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
  createButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
  },
  createButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.white,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.md,
  },
  syncButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    marginBottom: spacing.md,
  },
  syncButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand[700],
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
});
