import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { getCheckinCoords, CheckinLocationError } from '@/services/location.service';
import { Appointment } from '@/types';
import { appointmentsService } from '@/services/appointments.service';
import { AppointmentCard, groupVisits } from '@/components/appointments';
import { Button } from '@/components/ui';

/**
 * Tela de Agenda — compromissos e agendamentos de campo.
 *
 * Visitas em Hoje / Próximas / Concluídas, com "Concluir visita" (GPS de alta
 * precisão, offline-first via outbox) e selo de pendente de envio.
 */
export default function AgendaScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [concludingId, setConcludingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPending(await appointmentsService.getPendingCheckins());
      const data = await appointmentsService.getAppointments({ tipo: 'VISITA' });
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

  const sections = useMemo(() => groupVisits(appointments, pending), [appointments, pending]);
  const total = appointments.length;

  const ask = (title: string, message: string, ok: string) =>
    new Promise<boolean>((resolve) =>
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: ok, onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) }),
    );

  const handleConclude = async (appointment: Appointment) => {
    const go = await ask(
      'Concluir visita',
      'Vamos usar a localização do seu aparelho (GPS) para registrar que você está no local da visita.',
      'Continuar',
    );
    if (!go) return;
    const tappedAt = new Date().toISOString();
    setConcludingId(appointment.id);
    try {
      const coords = await getCheckinCoords(20000, { highAccuracy: true, allowLastKnown: false });
      const confirmed = await ask(
        'Confirmar conclusão',
        `Localização obtida (precisão de ±${Math.round(coords.accuracyMeters)} m).\nConcluir "${appointment.titulo}" agora?`,
        'Concluir',
      );
      if (!confirmed) return;
      const result = await appointmentsService.concludeVisit(appointment.id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracyMeters,
        clientTimestamp: tappedAt,
      });
      if (result.status === 'QUEUED') {
        setPending((p) => ({ ...p, [appointment.id]: tappedAt }));
        Alert.alert('Salva no aparelho', 'Sem internet: a conclusão será enviada automaticamente quando a conexão voltar.');
      } else {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointment.id ? (result.appointment ?? { ...a, concludedAt: tappedAt }) : a,
          ),
        );
      }
    } catch (err) {
      const msg =
        err instanceof CheckinLocationError
          ? err.message
          : 'Não foi possível concluir a visita. Tente novamente.';
      Alert.alert('Não foi possível concluir', msg);
    } finally {
      setConcludingId(null);
    }
  };

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
        <Text style={styles.stateTitle}>Nenhuma visita</Text>
        <Text style={styles.stateHint}>Quando houver visitas agendadas, aparecerão aqui.</Text>
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
        <Text style={styles.headerTitle}>Visitas</Text>

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

      {/* Lista */}
      <SectionList
        sections={total === 0 ? [] : sections.filter((x) => x.data.length > 0)}
        keyExtractor={(item) => item.id}
        style={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>
            {section.title} ({section.data.length})
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <AppointmentCard
              key={`appointment-${item.id}`}
              appointment={item}
              isDeleting={deletingId === item.id}
              isConcluding={concludingId === item.id}
              pendingSince={pending[item.id]}
              onConclude={handleConclude}
              onEdit={(appt) => router.push(`/agenda/form?id=${appt.id}` as any)}
              onDelete={handleDelete}
              testID={`appointment-card-${item.id}`}
            />
          </View>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          total === 0 && styles.listContentEmpty,
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
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
  },
  cardWrap: { marginBottom: spacing.md },
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