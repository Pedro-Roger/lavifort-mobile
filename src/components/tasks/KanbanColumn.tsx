import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography } from '@/core/theme';
import { Task, StatusTarefa } from '@/types';
import { TaskCard } from './TaskCard';

export interface KanbanColumnProps {
  status: StatusTarefa;
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function KanbanColumn({
  status,
  tasks,
  onTaskPress,
  onRefresh,
  isRefreshing = false,
  emptyTitle,
  emptyMessage,
  style,
  testID,
}: KanbanColumnProps) {
  const statusConfig = colors.status[status];
  const columnTitle = statusConfig.label;
  const columnTestID = testID || `kanban-column-${status}`;

  const renderItem = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={onTaskPress}
      testID={`kanban-task-${item.id}`}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer} testID={`kanban-column-empty-${status}`}>
      <View style={[styles.emptyDot, { backgroundColor: statusConfig.border }]} />
      <Text style={styles.emptyTitle}>
        {emptyTitle || `Nenhuma tarefa em ${columnTitle}`}
      </Text>
      <Text style={styles.emptyMessage}>
        {emptyMessage || 'Nenhum item pendente nesta etapa'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]} testID={columnTestID}>
      {/* Column Header */}
      <View style={styles.header} testID={`kanban-column-header-${status}`}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.statusDot, { backgroundColor: statusConfig.text }]}
            testID={`kanban-status-dot-${status}`}
          />
          <Text style={styles.headerTitle}>{columnTitle}</Text>
        </View>

        <View
          style={[styles.countBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}
          testID={`kanban-column-count-${status}`}
        >
          <Text style={[styles.countBadgeText, { color: statusConfig.text }]}>
            {tasks.length}
          </Text>
        </View>
      </View>

      {/* Column Task Cards */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        style={styles.listFlex}
        renderItem={renderItem}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  headerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  listFlex: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
