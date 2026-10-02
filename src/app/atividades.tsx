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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Task } from '@/types';
import { activitiesService } from '@/services/activities.service';
import { getCheckinCoords, CheckinLocationError } from '@/services/location.service';
import { ActivityCard } from '@/components/activities';
import { Button } from '@/components/ui';

type ActivityFilter = 'ALL' | 'PENDING' | 'DONE';

const FILTER_OPTIONS: { id: ActivityFilter; label: string }[] = [
  { id: 'ALL', label: 'Todas' },
  { id: 'PENDING', label: 'Não executadas' },
  { id: 'DONE', label: 'Concluídas' },
];

/**
 * Atividades de campo do operador.
 *
 * Alinhamento TechLead: sem seleção de progresso intermediário
 * ('Iniciar' / 'Em andamento'). Fluxo direto: a atividade está
 * "Não executada" ou é "Concluída" (check-in com geolocalização).
 * Filtros simplificados: Todas / Não executadas / Concluídas.
 */
export default function AtividadesScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>('ALL');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await activitiesService.getActivities();
      setActivities(data);
    } catch {
      setError('Não foi possível carregar as atividades.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'PENDING') return activities.filter((a) => !a.confirmation);
    if (filter === 'DONE') return activities.filter((a) => Boolean(a.confirmation));
    return activities;
  }, [activities, filter]);

  const pendingCount = useMemo(
    () => activities.filter((a) => !a.confirmation).length,
    [activities]
  );

  const handleConfirm = async (activity: Task) => {
    setConfirmingId(activity.id);
    try {
      const coords = await getCheckinCoords();
      const confirmation = await activitiesService.confirmActivity(activity.id, coords);

      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, confirmation } : a))
      );
    } catch (err: unknown) {
      if (err instanceof CheckinLocationError && err.code === 'PERMISSION_BLOCKED') {
        Alert.alert('Localização bloqueada', err.message, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      if (err instanceof CheckinLocationError) {
        Alert.alert('Localização', err.message);
        return;
      }
      let message = 'Não foi possível concluir a atividade.';
      if (err && typeof err === 'object') {
        const anyErr = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        const statusCode = anyErr.response?.status;
        if (statusCode === 409) {
          message = 'Esta atividade já foi concluída.';
          load();
        } else if (statusCode === 403) {
          message = 'Você não tem permissão para concluir esta atividade.';
        } else if (anyErr.response?.data?.message) {
          message = anyErr.response.data.message;
        }
      }
      Alert.alert('Erro', message);
    } finally {
      setConfirmingId(null);
    }
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer} testID="activities-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.stateText}>Carregando atividades...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer} testID="activities-error">
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateHint}>{error}</Text>
          <Button
            title="Tentar novamente"
            variant="outline"
            onPress={load}
            style={styles.retryButton}
            testID="activities-retry-button"
          />
        </View>
      );
    }
    return (
      <View style={styles.stateContainer} testID="activities-empty">
        <Text style={styles.stateTitle}>
          {filter === 'DONE'
            ? 'Nenhuma atividade concluída'
            : filter === 'PENDING'
              ? 'Nenhuma atividade pendente'
              : 'Sem atividades de campo'}
        </Text>
        <Text style={styles.stateHint}>
          {filter === 'ALL'
            ? 'Quando houver compromissos para você, aparecerão aqui.'
            : 'Tente outro filtro.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="atividades-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Atividades</Text>
      </View>

      <Text style={styles.subtitle}>
        {pendingCount === 0
          ? 'Nenhuma atividade pendente.'
          : `${pendingCount} ${pendingCount === 1 ? 'atividade pendente' : 'atividades pendentes'}.`}
      </Text>

      {/* Filtros simplificados */}
      <View style={styles.filters} testID="activities-filters">
        {FILTER_OPTIONS.map((option) => {
          const isActive = filter === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              testID={`activities-filter-${option.id}`}
              accessibilityRole="tab"
              accessibilityLabel={`Filtro: ${option.label}`}
              accessibilityState={{ selected: isActive }}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(option.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterTabText, isActive && styles.filterTabTextActive]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <ActivityCard
            key={`activity-${item.id}`}
            activity={item}
            isConfirming={confirmingId === item.id}
            onConfirm={handleConfirm}
            testID={`activity-card-${item.id}`}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand[600]]}
            tintColor={colors.brand[600]}
          />
        }
        testID="activities-list"
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
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  filterTabActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  filterTabText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textSecondary,
  },
  filterTabTextActive: {
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
  stateText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  retryButton: {
    marginTop: spacing.md,
    minWidth: 140,
  },
});
