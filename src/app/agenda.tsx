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
import { Appointment } from '@/types';
import { appointmentsService } from '@/services/appointments.service';
import { AppointmentCard } from '@/components/appointments';
import { Button } from '@/components/ui';

type AgendaFilter = 'ALL' | 'REUNIAO' | 'VISITA';

const FILTER_OPTIONS: { id: AgendaFilter; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'REUNIAO', label: 'Reuniões' },
  { id: 'VISITA', label: 'Visitas' },
];

/**
 * Tela de Agenda — compromissos e agendamentos de campo.
 *
 * Lista compromissos com filtros por tipo (Todos / Reuniões / Visitas),
 * ação de criar novo compromisso, editar e excluir.
 */
export default function AgendaScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgendaFilter>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await appointmentsService.getAppointments();
      setAppointments(data);
    } catch {
      setError('Não foi possível carregar os compromissos.');
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
    if (filter === 'ALL') return appointments;
    return appointments.filter((a) => a.tipo === filter);
  }, [appointments, filter]);

  const handleDelete = (appointment: Appointment) => {
    Alert.alert(
      'Excluir compromisso',
      `Tem certeza que deseja excluir "${appointment.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(appointment.id);
            try {
              await appointmentsService.deleteAppointment(appointment.id);
              setAppointments((prev) =>
                prev.filter((a) => a.id !== appointment.id),
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o compromisso.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer} testID="agenda-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.stateText}>Carregando compromissos...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer} testID="agenda-error">
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateHint}>{error}</Text>
          <Button
            title="Tentar novamente"
            variant="outline"
            onPress={load}
            style={styles.retryButton}
            testID="agenda-retry-button"
          />
        </View>
      );
    }
    return (
      <View style={styles.stateContainer} testID="agenda-empty">
        <Text style={styles.stateTitle}>
          {filter === 'REUNIAO'
            ? 'Nenhuma reunião'
            : filter === 'VISITA'
              ? 'Nenhuma visita'
              : 'Nenhum compromisso'}
        </Text>
        <Text style={styles.stateHint}>
          {filter === 'ALL'
            ? 'Quando houver compromissos agendados, aparecerão aqui.'
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
          testID="agenda-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>

        <TouchableOpacity
          testID="agenda-add-button"
          accessibilityRole="button"
          accessibilityLabel="Novo compromisso"
          style={styles.addButton}
          onPress={() => router.push('/agenda/form' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filters} testID="agenda-filters">
        {FILTER_OPTIONS.map((option) => {
          const isActive = filter === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              testID={`agenda-filter-${option.id}`}
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
          <AppointmentCard
            key={`appointment-${item.id}`}
            appointment={item}
            isDeleting={deletingId === item.id}
            onEdit={(appt) => router.push(`/agenda/form?id=${appt.id}` as any)}
            onDelete={handleDelete}
            testID={`appointment-card-${item.id}`}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand[600]]}
            tintColor={colors.brand[600]}
          />
        }
        testID="agenda-list"
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
  addButton: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
  },
  addButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.white,
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
    borderRadius: radii.lg,
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