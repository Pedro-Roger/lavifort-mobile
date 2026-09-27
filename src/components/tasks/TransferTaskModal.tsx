import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Task, Project } from '@/types';
import { Button } from '../ui/Button';

export type TransferMode = 'MOVE_PROJECT' | 'CONVERT_SUBTASK';

export interface TransferTaskModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  projects?: Project[];
  availableTasks?: Task[];
  onTransfer: (taskId: string, targetProjectId: string, parentTaskId?: string) => Promise<unknown>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TransferTaskModal({
  task,
  visible,
  onClose,
  projects = [],
  availableTasks = [],
  onTransfer,
  style,
  testID = 'transfer-task-modal',
}: TransferTaskModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('MOVE_PROJECT');
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task && visible) {
      setSelectedProjectId(task.projetoId);
      setTransferMode('MOVE_PROJECT');
      setSelectedParentTaskId(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [task, visible]);

  if (!task) return null;

  // Potential parent tasks: exclude current task itself
  const candidateParentTasks = availableTasks.filter(
    (t) => t.id !== task.id && (transferMode === 'MOVE_PROJECT' ? true : t.projetoId === selectedProjectId)
  );

  const handleConfirmTransfer = async () => {
    if (!selectedProjectId) {
      setError('Selecione um projeto de destino');
      return;
    }

    if (transferMode === 'CONVERT_SUBTASK' && !selectedParentTaskId) {
      setError('Selecione a tarefa pai para conversão em subtarefa');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onTransfer(
        task.id,
        selectedProjectId,
        transferMode === 'CONVERT_SUBTASK' ? selectedParentTaskId || undefined : undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao transferir tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
          testID="transfer-task-backdrop"
        />

        <View style={[styles.sheetContainer, style]} testID="transfer-task-sheet">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.headerTitle}>Transferir Tarefa</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {task.titulo}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              testID="transfer-task-close-button"
              accessibilityRole="button"
              accessibilityLabel="Fechar transferência"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={styles.errorBanner} testID="transfer-task-error-banner">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Step 1: Mode Selector */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Tipo de Transferência</Text>
              <View style={styles.modeButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    transferMode === 'MOVE_PROJECT' && styles.modeButtonActive,
                  ]}
                  onPress={() => {
                    setTransferMode('MOVE_PROJECT');
                    setSelectedParentTaskId(null);
                  }}
                  activeOpacity={0.7}
                  testID="transfer-mode-move"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: transferMode === 'MOVE_PROJECT' }}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      transferMode === 'MOVE_PROJECT' && styles.modeButtonTextActive,
                    ]}
                  >
                    Mover de Setor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    transferMode === 'CONVERT_SUBTASK' && styles.modeButtonActive,
                  ]}
                  onPress={() => setTransferMode('CONVERT_SUBTASK')}
                  activeOpacity={0.7}
                  testID="transfer-mode-subtask"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: transferMode === 'CONVERT_SUBTASK' }}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      transferMode === 'CONVERT_SUBTASK' && styles.modeButtonTextActive,
                    ]}
                  >
                    Converter em Subtarefa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 2: Target Project */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Setor / Projeto de Destino</Text>
              <View style={styles.projectPillsRow}>
                {projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  return (
                    <TouchableOpacity
                      key={proj.id}
                      style={[
                        styles.projectPill,
                        isSelected && styles.projectPillActive,
                      ]}
                      onPress={() => setSelectedProjectId(proj.id)}
                      activeOpacity={0.7}
                      testID={`transfer-project-pill-${proj.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ${proj.nome}`}
                    >
                      <View
                        style={[
                          styles.projectColorDot,
                          { backgroundColor: proj.cor || colors.brand[600] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.projectPillText,
                          isSelected && styles.projectPillTextActive,
                        ]}
                      >
                        {proj.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 3: If CONVERT_SUBTASK, select parent task */}
            {transferMode === 'CONVERT_SUBTASK' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Vincular à Tarefa Principal</Text>
                {candidateParentTasks.length > 0 ? (
                  <View style={styles.parentTasksList}>
                    {candidateParentTasks.map((pt) => {
                      const isSelected = selectedParentTaskId === pt.id;
                      return (
                        <TouchableOpacity
                          key={pt.id}
                          style={[
                            styles.parentTaskItem,
                            isSelected && styles.parentTaskItemActive,
                          ]}
                          onPress={() => setSelectedParentTaskId(pt.id)}
                          activeOpacity={0.7}
                          testID={`transfer-parent-task-${pt.id}`}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleActive,
                            ]}
                          >
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <View style={styles.parentTaskInfo}>
                            <Text
                              style={[
                                styles.parentTaskTitle,
                                isSelected && styles.parentTaskTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {pt.titulo}
                            </Text>
                            <Text style={styles.parentTaskMeta}>
                              Status: {pt.status} • Responsável: {pt.responsavel || 'Não atribuído'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyParentText} testID="transfer-no-parent-tasks">
                    Nenhuma outra tarefa encontrada no setor selecionado para ser a principal.
                  </Text>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                title="Cancelar"
                variant="outline"
                size="md"
                onPress={onClose}
                disabled={isSubmitting}
                style={styles.actionButton}
                testID="transfer-task-cancel-button"
              />
              <Button
                title={
                  transferMode === 'CONVERT_SUBTASK'
                    ? 'Converter Subtarefa'
                    : 'Mover Tarefa'
                }
                variant="primary"
                size="md"
                onPress={handleConfirmTransfer}
                isLoading={isSubmitting}
                style={styles.actionButton}
                testID="transfer-task-submit-button"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.neutral.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    maxWidth: 240,
  },
  closeButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  closeButtonText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  sectionContainer: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modeButton: {
    flex: 1,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
  },
  modeButtonActive: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
  },
  modeButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  projectPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    gap: 6,
  },
  projectPillActive: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
  },
  projectColorDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  projectPillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  projectPillTextActive: {
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  parentTasksList: {
    gap: 6,
    maxHeight: 180,
  },
  parentTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
    minHeight: minTouchTarget,
    gap: spacing.sm,
  },
  parentTaskItemActive: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: colors.brand[600],
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.brand[600],
  },
  parentTaskInfo: {
    flex: 1,
  },
  parentTaskTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  parentTaskTitleActive: {
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  parentTaskMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    marginTop: 2,
  },
  emptyParentText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
