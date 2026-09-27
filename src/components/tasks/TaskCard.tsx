import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Task, StatusTarefa } from '@/types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

export interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: StatusTarefa) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TaskCard({
  task,
  onPress,
  style,
  testID = `task-card-${task.id}`,
}: TaskCardProps) {
  const progressPercent = Math.max(0, Math.min(100, task.progresso || 0));

  const CardWrapper = onPress ? TouchableOpacity : View;
  const touchableProps = onPress
    ? {
        onPress: () => onPress(task),
        activeOpacity: 0.7,
        accessibilityRole: 'button' as const,
        accessibilityLabel: `Tarefa: ${task.titulo}`,
      }
    : {};

  return (
    <CardWrapper
      testID={testID}
      style={[styles.container, style]}
      {...touchableProps}
    >
      {/* Top row: Badges */}
      <View style={styles.badgeRow}>
        <View style={styles.badgeGroup}>
          <Badge
            status={task.status}
            size="sm"
            testID={`task-status-badge-${task.id}`}
          />
          <Badge
            priority={task.prioridade}
            size="sm"
            testID={`task-priority-badge-${task.id}`}
          />
        </View>

        {task.syncStatus === 'PENDING' && (
          <Badge
            syncStatus="PENDING"
            size="sm"
            showDot
            testID={`task-sync-pending-${task.id}`}
          />
        )}
        {task.syncStatus === 'ERROR' && (
          <Badge
            syncStatus="ERROR"
            size="sm"
            showDot
            testID={`task-sync-error-${task.id}`}
          />
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {task.referenceCode ? `${task.referenceCode} ` : ''}{task.titulo}
      </Text>

      {/* Description */}
      {Boolean(task.descricao) && (
        <Text style={styles.description} numberOfLines={2}>
          {task.descricao}
        </Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso</Text>
          <Text style={styles.progressValue}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent === 100
                    ? colors.status.CONCLUIDO.text
                    : colors.brand[600],
              },
            ]}
          />
        </View>
      </View>

      {/* Footer: Assignee and Due Date */}
      <View style={styles.footerRow}>
        <View style={styles.assigneeContainer}>
          <Avatar
            name={task.responsavel || 'Sem Responsável'}
            size="sm"
            style={styles.avatar}
          />
          <Text style={styles.assigneeText} numberOfLines={1}>
            {task.responsavel || 'Não atribuído'}
          </Text>
        </View>

        {Boolean(task.prazo) && (
          <View style={styles.dueDateContainer}>
            <Text style={styles.dueDateLabel}>Prazo:</Text>
            <Text style={styles.dueDateText}>{task.prazo}</Text>
          </View>
        )}

        {Array.isArray(task.subtarefas) && task.subtarefas.length > 0 && (
          <View style={styles.subtasksBadge}>
            <Text style={styles.subtasksText}>
              {task.subtarefas.filter((s) => s.concluida).length}/
              {task.subtarefas.length} subs
            </Text>
          </View>
        )}
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: minTouchTarget,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    lineHeight: typography.lineHeights.base,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    lineHeight: typography.lineHeights.sm,
    marginTop: spacing.xxs,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    fontWeight: typography.fontWeights.medium,
  },
  progressValue: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.neutral.borderSubtle,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSubtle,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    marginRight: spacing.xs,
  },
  assigneeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
  },
  dueDateText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  subtasksBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.neutral.surfaceSubtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  subtasksText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
});
