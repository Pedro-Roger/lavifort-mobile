import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, minTouchTarget } from '@/core/theme';
import { Cliente } from '@/types';
import { clientsService } from '@/services/clients.service';
import { Card, Button, Input } from '@/components/ui';
import { ClientCard, ClientDetail } from '@/components/clients';

export default function ClientesScreen() {
  const router = useRouter();

  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadClients = async (search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await clientsService.getClients(
        search.trim().length > 0 ? { search: search.trim() } : undefined
      );
      setClients(Array.isArray(page.items) ? page.items : []);
    } catch {
      setError('Não foi possível carregar os clientes.');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients(searchQuery);
  }, [searchQuery]);

  const handleRetry = () => {
    if (selectedClient) {
      openDetail(selectedClient.id);
    } else {
      loadClients(searchQuery);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const client = await clientsService.getClientById(id);
      setSelectedClient(client);
    } catch {
      setDetailError('Não foi possível carregar o detalhe.');
      setSelectedClient(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedClient(null);
    setDetailError(null);
  };

  const renderDetail = () => {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="clientes-detail-back-button"
            accessibilityRole="button"
            accessibilityLabel="Voltar para a lista de clientes"
            style={styles.headerBack}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cliente</Text>
        </View>

        {detailLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={colors.brand[600]} testID="client-detail-loading" />
          </View>
        ) : detailError ? (
          <Card variant="subtle" testID="client-detail-error">
            <Text style={styles.detailErrorText}>{detailError}</Text>
            <Button
              title="Tentar novamente"
              variant="outline"
              onPress={handleRetry}
              testID="client-detail-retry-button"
            />
          </Card>
        ) : selectedClient ? (
          <Card testID="client-detail-card">
            <ClientDetail client={selectedClient} testID="client-detail" />
          </Card>
        ) : null}
      </ScrollView>
    );
  };

  const renderList = () => {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="clientes-back-button"
            accessibilityRole="button"
            accessibilityLabel="Voltar ao módulo anterior"
            style={styles.headerBack}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clientes</Text>
        </View>

        <View style={styles.searchWrapper}>
          <Input
            testID="clientes-search-input"
            placeholder="Buscar por nome ou telefone"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={colors.brand[600]} testID="clientes-loading" />
          </View>
        ) : error ? (
          <Card variant="subtle" testID="clientes-error">
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Tentar novamente"
              variant="outline"
              onPress={handleRetry}
              testID="clientes-retry-button"
            />
          </Card>
        ) : clients.length === 0 ? (
          <View style={styles.emptyWrapper} testID="clientes-empty">
            <Text style={styles.emptyTitle}>Nenhum cliente</Text>
            <Text style={styles.emptyHint}>
              {searchQuery.trim().length > 0
                ? 'Nenhum cliente corresponde à busca.'
                : 'Os clientes sincronizados aparecerão aqui.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list} testID="clientes-list">
            {clients.map((client) => (
              <Card
                key={client.id}
                onPress={() => openDetail(client.id)}
                testID={`client-card-${client.id}`}
                touchableProps={{ accessibilityLabel: 'Ver detalle del cliente' }}
              >
                <ClientCard client={client} testID="client-card-body" />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {selectedClient !== null || detailLoading || detailError ? renderDetail() : renderList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    padding: spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.none,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerBack: {
    minHeight: minTouchTarget,
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
  searchWrapper: {
    marginBottom: spacing.md,
  },
  loadingWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyWrapper: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  emptyHint: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.sm,
  },
  detailErrorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});