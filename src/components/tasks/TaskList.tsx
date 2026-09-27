import React from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Task, StatusTarefa } from '@/types';
import { TaskCard } from './TaskCard';
import { Input } from '../ui/Input';

export interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTaskPress?: (task: Task) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedStatus?: StatusTarefa | 'ALL';
  onStatusFilterChange?: (status: StatusTarefa | 'ALL') => void;
  emptyTitle?: string;
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const STATUS_OPTIONS: { id: StatusTarefa | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'BACKLOG', label: 'Backlog' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { id: 'EM_REVISAO', label: 'Em Revisão' },
  { id: 'CONCLUIDO', label: 'Concluído' },
];

export function TaskList({
  tasks,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onTaskPress,
  searchQuery = '',
  onSearchChange,
  selectedStatus = 'ALL',
  onStatusFilterChange,
  emptyTitle = 'Nenhuma tarefa encontrada',
  emptyMessage = 'Tente alterar os filtros de busca ou selecione outro setor.',
  style,
  testID = 'task-list',
}: TaskListProps) {
  const renderItem = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={onTaskPress}
      testID={`task-item-${item.id}`}
    />
  );

  const renderEmptyComponent = () => {
    if (isLoading && tasks.length === 0) {
      return (
        <View style={styles.loadingContainer} testID="task-list-loading">
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.loadingText}>Carregando tarefas...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer} testID="task-list-empty">
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIconText}>📋</Text>
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDescription}>{emptyMessage}</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      {onSearchChange && (
        <Input
          testID="task-search-input"
          placeholder="Buscar tarefas..."
          value={searchQuery}
          onChangeText={onSearchChange}
          containerStyle={styles.searchInputContainer}
        />
      )}

      {/* Status Filter Chips */}
      {onStatusFilterChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFiltersScroll}
          style={styles.statusFiltersWrapper}
        >
          {STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatus === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                testID={`status-filter-${option.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${option.label}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.filterChip,
                  isSelected ? styles.activeFilterChip : styles.inactiveFilterChip,
                ]}
                onPress={() => onStatusFilterChange(option.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.activeFilterChipText : styles.inactiveFilterChipText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.brand[600]]}
              tintColor={colors.brand[600]}
            />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  headerContainer: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  searchInputContainer: {
    marginBottom: spacing.xs,
  },
  statusFiltersWrapper: {
    marginVertical: spacing.xs,
  },
  statusFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterChip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveFilterChip: {
    backgroundColor: colors.neutral.surface,
    borderColor: colors.neutral.border,
  },
  activeFilterChip: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  filterChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  inactiveFilterChipText: {
    color: colors.neutral.textSecondary,
  },
  activeFilterChipText: {
    color: colors.neutral.white,
    fontWeight: typography.fontWeights.semibold,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm,
  },
});
