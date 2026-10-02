import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';
import { StatusTarefa, PrioridadeTarefa, TaskSyncStatus } from '@/types';

export type BadgeType = 'status' | 'priority' | 'sync' | 'custom';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label?: string;
  type?: BadgeType;
  status?: StatusTarefa;
  priority?: PrioridadeTarefa;
  syncStatus?: TaskSyncStatus;
  size?: BadgeSize;
  showDot?: boolean;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function Badge({
  label,
  type = 'custom',
  status,
  priority,
  syncStatus,
  size = 'md',
  showDot = false,
  icon,
  backgroundColor,
  textColor,
  borderColor,
  style,
  textStyle,
  testID = 'badge-container',
}: BadgeProps) {
  let computedLabel = label || '';
  let computedBg = backgroundColor || colors.neutral.surfaceSubtle;
  let computedText = textColor || colors.neutral.textSecondary;
  let computedBorder = borderColor || colors.neutral.border;
  let dotColor = computedText;

  if (status) {
    const statusConfig = colors.status[status] || colors.status.BACKLOG;
    computedLabel = label || statusConfig.label;
    computedBg = backgroundColor || statusConfig.bg;
    computedText = textColor || statusConfig.text;
    computedBorder = borderColor || statusConfig.border;
    dotColor = computedText;
  } else if (priority) {
    const priorityConfig = colors.priority[priority] || colors.priority.BAIXA;
    computedLabel = label || priorityConfig.label;
    computedBg = backgroundColor || priorityConfig.bg;
    computedText = textColor || priorityConfig.text;
    computedBorder = borderColor || priorityConfig.border;
    dotColor = computedText;
  } else if (syncStatus) {
    switch (syncStatus) {
      case 'SYNCED':
        computedLabel = label || 'Sincronizado';
        computedBg = backgroundColor || '#d1fae5';
        computedText = textColor || '#047857';
        computedBorder = borderColor || '#6ee7b7';
        break;
      case 'PENDING':
        computedLabel = label || 'Pendente';
        computedBg = backgroundColor || '#fef3c7';
        computedText = textColor || '#b45309';
        computedBorder = borderColor || '#fcd34d';
        break;
      case 'ERROR':
        computedLabel = label || 'Erro';
        computedBg = backgroundColor || '#fee2e2';
        computedText = textColor || '#b91c1c';
        computedBorder = borderColor || '#fca5a5';
        break;
    }
    dotColor = computedText;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        isSmall ? styles.sizeSm : styles.sizeMd,
        { backgroundColor: computedBg, borderColor: computedBorder },
        style,
      ]}
      testID={testID}
    >
      {showDot && (
        <View
          style={[styles.dot, isSmall ? styles.dotSm : styles.dotMd, { backgroundColor: dotColor }]}
          testID="badge-dot"
        />
      )}
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          isSmall ? styles.textSm : styles.textMd,
          { color: computedText },
          textStyle,
        ]}
      >
        {computedLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dot: {
    borderRadius: radii.full,
    marginRight: 6,
  },
  dotSm: {
    width: 6,
    height: 6,
  },
  dotMd: {
    width: 8,
    height: 8,
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
  },
  textSm: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 14,
  },
  textMd: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 18,
  },
});
