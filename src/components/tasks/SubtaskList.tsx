import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { SubTask } from '@/types';

export interface SubtaskListProps {
  taskId: string;
  subtarefas?: SubTask[];
  onAddSubtask?: (titulo: string) => Promise<unknown>;
  onToggleSubtask?: (subtaskId: string) => Promise<unknown>;
  onDeleteSubtask?: (subtaskId: string) => Promise<unknown>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SubtaskList({
  taskId: _taskId,
  subtarefas = [],
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  style,
  testID = 'subtask-list',
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = subtarefas.filter((s) => s.concluida).length;
  const totalCount = subtarefas.length;

  const handleAdd = async () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    if (!onAddSubtask) return;

    setError(null);
    setIsAdding(true);
    try {
      await onAddSubtask(trimmed);
      setNewSubtaskTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar subtarefa');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (subtaskId: string) => {
    if (!onToggleSubtask) return;
    try {
      await onToggleSubtask(subtaskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar subtarefa');
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!onDeleteSubtask) return;
    try {
      await onDeleteSubtask(subtaskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir subtarefa');
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Subtarefas</Text>
        {totalCount > 0 && (
          <View style={styles.counterBadge} testID="subtask-counter">
            <Text style={styles.counterText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner} testID="subtask-error-banner">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Subtasks List */}
      {subtarefas.length > 0 ? (
        <View style={styles.listContainer}>
          {subtarefas.map((item) => (
            <View
              key={item.id}
              style={[styles.itemRow, item.concluida && styles.itemRowCompleted]}
              testID={`subtask-item-${item.id}`}
            >
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
                testID={`subtask-checkbox-${item.id}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.concluida }}
                accessibilityLabel={`Marcar subtarefa ${item.titulo} como ${
                  item.concluida ? 'não concluída' : 'concluída'
                }`}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    item.concluida && styles.checkboxBoxChecked,
                  ]}
                >
                  {item.concluida && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <Text
                style={[
                  styles.itemTitle,
                  item.concluida && styles.itemTitleCompleted,
                ]}
                numberOfLines={2}
                testID={`subtask-title-${item.id}`}
              >
                {item.titulo}
              </Text>

              {onDeleteSubtask && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                  testID={`subtask-delete-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir subtarefa ${item.titulo}`}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText} testID="subtask-empty-text">
          Nenhuma subtarefa adicionada
        </Text>
      )}

      {/* Add Subtask Input */}
      {onAddSubtask && (
        <View style={styles.addInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Nova subtarefa..."
            placeholderTextColor={colors.neutral.textMuted}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            editable={!isAdding}
            testID="subtask-input"
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              (!newSubtaskTitle.trim() || isAdding) && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!newSubtaskTitle.trim() || isAdding}
            testID="subtask-add-button"
            accessibilityRole="button"
            accessibilityLabel="Adicionar subtarefa"
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.addButtonText}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterBadge: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  counterText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand[700],
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: typography.fontSizes.xs,
  },
  listContainer: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
    minHeight: minTouchTarget - 4,
  },
  itemRowCompleted: {
    backgroundColor: '#f8fafc',
    opacity: 0.8,
  },
  checkboxTouch: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 14,
  },
  itemTitle: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textPrimary,
    marginHorizontal: spacing.xs,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.neutral.textMuted,
  },
  deleteButton: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textMuted,
    fontWeight: typography.fontWeights.bold,
  },
  emptyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textPrimary,
    minHeight: minTouchTarget,
  },
  addButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    backgroundColor: colors.brand[600],
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.neutral.border,
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 22,
  },
});
