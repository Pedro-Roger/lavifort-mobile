import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Task, StatusTarefa } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { Input } from '../ui/Input';

export interface KanbanBoardProps {
  tasks: Task[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTaskPress?: (task: Task) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeStatus?: StatusTarefa;
  onStatusChange?: (status: StatusTarefa) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const KANBAN_STATUSES: StatusTarefa[] = [
  'BACKLOG',
  'EM_ANDAMENTO',
  'EM_REVISAO',
  'CONCLUIDO',
];

export function KanbanBoard({
  tasks,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onTaskPress,
  searchQuery = '',
  onSearchChange,
  activeStatus: controlledActiveStatus,
  onStatusChange,
  style,
  testID = 'kanban-board',
}: KanbanBoardProps) {
  const [internalStatus, setInternalStatus] = useState<StatusTarefa>('BACKLOG');
  const activeStatus = controlledActiveStatus || internalStatus;

  const handleSelectTab = (status: StatusTarefa) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      setInternalStatus(status);
    }
  };

  const tasksByStatus = useMemo(() => {
    const map: Record<StatusTarefa, Task[]> = {
      BACKLOG: [],
      EM_ANDAMENTO: [],
      EM_REVISAO: [],
      CONCLUIDO: [],
    };

    tasks.forEach((task) => {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    });

    return map;
  }, [tasks]);

  const activeTasks = tasksByStatus[activeStatus] || [];

  if (isLoading && tasks.length === 0) {
    return (
      <View style={[styles.container, styles.loadingCenter, style]} testID="kanban-board-loading">
        <ActivityIndicator size="large" color={colors.brand[600]} />
        <Text style={styles.loadingText}>Carregando quadro Kanban...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Search Bar */}
      {onSearchChange && (
        <View style={styles.searchWrapper}>
          <Input
            testID="kanban-search-input"
            placeholder="Buscar no Kanban..."
            value={searchQuery}
            onChangeText={onSearchChange}
            containerStyle={styles.searchInput}
          />
        </View>
      )}

      {/* Column Tabs Navigation */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {KANBAN_STATUSES.map((status) => {
            const isSelected = activeStatus === status;
            const statusConfig = colors.status[status];
            const columnCount = tasksByStatus[status]?.length || 0;

            return (
              <TouchableOpacity
                key={status}
                testID={`kanban-tab-${status}`}
                accessibilityRole="button"
                accessibilityLabel={`Coluna ${statusConfig.label} com ${columnCount} tarefas`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.tabButton,
                  isSelected ? styles.activeTabButton : styles.inactiveTabButton,
                ]}
                onPress={() => handleSelectTab(status)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.tabDot,
                    { backgroundColor: statusConfig.text },
                  ]}
                />
                <Text
                  style={[
                    styles.tabTitle,
                    isSelected ? styles.activeTabTitle : styles.inactiveTabTitle,
                  ]}
                >
                  {statusConfig.label}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor: isSelected ? statusConfig.bg : colors.neutral.surfaceSubtle,
                      borderColor: isSelected ? statusConfig.border : colors.neutral.border,
                    },
                  ]}
                  testID={`kanban-tab-count-${status}`}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: isSelected ? statusConfig.text : colors.neutral.textMuted },
                    ]}
                  >
                    {columnCount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Column Content */}
      <View style={styles.columnContainer}>
        <KanbanColumn
          status={activeStatus}
          tasks={activeTasks}
          onTaskPress={onTaskPress}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          testID={`kanban-column-${activeStatus}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  searchInput: {
    marginBottom: 0,
  },
  tabsWrapper: {
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    paddingVertical: spacing.xs,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: 6,
  },
  inactiveTabButton: {
    backgroundColor: colors.neutral.surface,
    borderColor: colors.neutral.border,
  },
  activeTabButton: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  tabTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  inactiveTabTitle: {
    color: colors.neutral.textSecondary,
  },
  activeTabTitle: {
    color: colors.brand[800],
    fontWeight: typography.fontWeights.bold,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  tabBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  columnContainer: {
    flex: 1,
  },
});
