import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii } from '@/core/theme';
import { StockAvailability } from '@/types';
import { stockService } from '@/services/stock.service';
import { Input } from '@/components/ui';
import { AvailabilityCard } from '@/components/stock';

export default function EstoqueScreen() {
  const router = useRouter();

  const [items, setItems] = useState<StockAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await stockService.getAvailability();
      setItems(data);
    } catch {
      setError('Não foi possível carregar a disponibilidade.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const data = await stockService.getAvailability();
      setItems(data);
    } catch {
      setError('Não foi possível atualizar a disponibilidade.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.productName?.toLowerCase().includes(query) ||
        item.locationName?.toLowerCase().includes(query) ||
        item.unitName?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const renderItem = ({ item }: { item: StockAvailability }) => (
    <AvailabilityCard
      key={`stock-${item.id}`}
      item={item}
      testID={`stock-card-${item.id}`}
    />
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer} testID="stock-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.stateText}>Carregando disponibilidade...</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View style={styles.stateContainer} testID="stock-empty-search">
          <Text style={styles.stateTitle}>Sin resultados para la búsqueda</Text>
          <Text style={styles.stateHint}>Revisá el término de búsqueda o limpiá el filtro.</Text>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer} testID="stock-empty">
        <Text style={styles.stateTitle}>Sin disponibilidad registrada</Text>
        <Text style={styles.stateHint}>
          Sin productos cargados para este módulo. Cuando la API responda con datos, aparecerán acá.
        </Text>
      </View>
    );
  };

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="estoque-back-button"
            accessibilityRole="button"
            accessibilityLabel="Volver atrás"
            style={styles.headerBack}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackText}>‹ Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estoque</Text>
        </View>

        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>No se pudo cargar la disponibilidad</Text>
          <Text style={styles.stateHint}>{error}</Text>
          <TouchableOpacity
            testID="stock-retry-button"
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              load();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="estoque-back-button"
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
          style={styles.headerBack}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackText}>‹ Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estoque</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Input
          testID="stock-search-input"
          placeholder="Buscar por producto, ubicación o unidad..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand[600]]}
            tintColor={colors.brand[600]}
          />
        }
        testID="stock-list"
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
  list: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerBack: {
    minHeight: 44,
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
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  stateContainer: {
    flex: 1,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stateHint: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stateText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
  },
  retryButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.white,
  },
});
