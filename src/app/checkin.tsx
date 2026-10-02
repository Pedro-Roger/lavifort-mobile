import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Region, Cliente, CheckinRecord } from '@/types';
import { regionsService } from '@/services/regions.service';
import { clientsService } from '@/services/clients.service';
import { checkinService } from '@/services/checkin.service';
import { getCheckinCoords, CheckinLocationError } from '@/services/location.service';
import { useAuthStore } from '@/stores/auth.store';
import { ClientCard } from '@/components/clients';
import { OfflineBanner, Button } from '@/components/ui';

/**
 * Check-in georreferenciado nas fazendas da carteira (CRM diário da vendedora).
 *
 * Fluxo: seleciona a fazenda (cliente) → captura o GPS → verifica se a
 * coordenada está dentro da região (geofence) → registra o check-in local
 * (offline-first). Também sincroniza pendências vinculadas a compromissos.
 */
export default function CheckinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [regions, setRegions] = useState<Region[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [regionList, page] = await Promise.all([
        regionsService.getRegions(),
        clientsService.getClients(),
      ]);
      setRegions(regionList);
      setClients(Array.isArray(page.items) ? page.items : []);

      const preferred = (user as { regiaoId?: string } | null)?.regiaoId;
      const preferredRegion = regionList.find((r) => r.id === preferred);
      setSelectedRegionId((prev) => {
        if (prev) return prev;
        if (preferredRegion) return preferredRegion.id;
        return regionList.length > 0 ? regionList[0].id : null;
      });

      setHistory(await checkinService.getHistory());
    } catch {
      setHistory(await checkinService.getHistory());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

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

  const fazendas = useMemo(() => {
    if (!selectedRegion) return clients;
    return regionsService.filterCarteira(selectedRegion, clients);
  }, [selectedRegion, clients]);

  const checkedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return history.filter((r) => r.checkedInAt.slice(0, 10) === today);
  }, [history]);

  const handleCheckin = async (client: Cliente) => {
    if (!selectedRegion) {
      Alert.alert('Atenção', 'Selecione uma região primeiro.');
      return;
    }

    setCheckingId(client.id);
    try {
      const coords = await getCheckinCoords();

      const verification = checkinService.verifyRegion(selectedRegion, coords);
      const clientName = `${client.firstName} ${client.lastName}`.trim();

      const doRecord = async () => {
        await checkinService.recordCheckin({
          clientId: client.id,
          clientName,
          regionId: selectedRegion.id,
          regionName: selectedRegion.nome,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracyMeters,
        });
        setHistory(await checkinService.getHistory());
        Alert.alert(
          'Check-in realizado',
          `Visita registrada em ${clientName} (${selectedRegion.nome}).`,
        );
      };

      if (!verification.inside) {
        Alert.alert(
          'Fora da região',
          `Você está a ${verification.distanceKm.toFixed(1)} km do centro de ${selectedRegion.nome}. Deseja registrar mesmo assim?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Registrar', onPress: doRecord },
          ],
        );
        return;
      }

      await doRecord();
    } catch (err: unknown) {
      if (err instanceof CheckinLocationError) {
        Alert.alert('Localização', err.message);
        return;
      }
      Alert.alert('Erro', 'Não foi possível realizar o check-in.');
    } finally {
      setCheckingId(null);
    }
  };

  const handleSync = async () => {
    try {
      const result = await checkinService.syncPendingCheckins();
      setHistory(await checkinService.getHistory());
      Alert.alert(
        'Sincronização',
        `${result.synced} check-in(s) enviados, ${result.failed} falhou(ram).`,
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível sincronizar os check-ins.');
    }
  };

  const renderFazenda = ({ item }: { item: Cliente }) => (
    <View style={styles.cardWrapper}>
      <ClientCard client={item} testID={`checkin-client-${item.id}`} />
      <Button
        title={checkingId === item.id ? 'Capturando GPS...' : 'Fazer check-in no local'}
        variant="primary"
        size="sm"
        onPress={() => handleCheckin(item)}
        isLoading={checkingId === item.id}
        disabled={!selectedRegion}
        testID={`checkin-button-${item.id}`}
        style={styles.checkinButton}
      />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer} testID="checkin-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.stateHint}>Carregando fazendas...</Text>
        </View>
      );
    }
    return (
      <View style={styles.stateContainer} testID="checkin-empty">
        <Text style={styles.stateTitle}>Nenhuma fazenda nesta região</Text>
        <Text style={styles.stateHint}>
          {selectedRegion
            ? `As fazendas de ${selectedRegion.nome} aparecerão aqui para check-in.`
            : 'Selecione uma região para continuar.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="checkin-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in GPS</Text>
      </View>

      <OfflineBanner testID="checkin-offline-banner" hideWhenSynced />

      <Text style={styles.subtitle}>
        Registre sua presença nas fazendas. A verificação é feita pela sua região.
      </Text>

      <View style={styles.regionRow} testID="checkin-region-selector">
        {regions.map((region) => {
          const isActive = region.id === selectedRegionId;
          return (
            <TouchableOpacity
              key={region.id}
              testID={`checkin-region-${region.id}`}
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

      <FlatList
        data={fazendas}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={renderFazenda}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, fazendas.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand[600]]}
            tintColor={colors.brand[600]}
          />
        }
        testID="checkin-list"
      />

      {/* Histórico do dia */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>
            Check-ins de hoje ({checkedToday.length})
          </Text>
          <TouchableOpacity
            testID="checkin-sync-button"
            accessibilityRole="button"
            accessibilityLabel="Sincronizar check-ins"
            style={styles.syncButton}
            onPress={handleSync}
            activeOpacity={0.7}
          >
            <Text style={styles.syncButtonText}>Sincronizar</Text>
          </TouchableOpacity>
        </View>

        {checkedToday.length === 0 ? (
          <Text style={styles.historyEmpty} testID="checkin-history-empty">
            Nenhum check-in hoje ainda.
          </Text>
        ) : (
          checkedToday.map((record) => (
            <View key={record.id} style={styles.historyItem} testID={`checkin-record-${record.id}`}>
              <Text style={styles.historyItemName} numberOfLines={1}>
                {record.clientName}
              </Text>
              <Text style={styles.historyItemMeta}>
                {new Date(record.checkedInAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {record.syncStatus === 'SYNCED' ? 'sincronizado' : record.syncStatus === 'PENDING' ? 'pendente' : 'local'}
              </Text>
            </View>
          ))
        )}
      </View>
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
    borderRadius: radii.full,
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
    paddingBottom: spacing.lg,
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
    padding: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  checkinButton: {
    alignSelf: 'flex-start',
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
  historySection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  historyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  syncButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  syncButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand[600],
    fontWeight: typography.fontWeights.semibold,
  },
  historyEmpty: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  historyItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.borderSubtle,
  },
  historyItemName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  historyItemMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
});