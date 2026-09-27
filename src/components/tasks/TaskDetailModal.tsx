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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Task, StatusTarefa, PrioridadeTarefa, Project } from '@/types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Slider } from '../ui/Slider';
import { SubtaskList } from './SubtaskList';
import { TransferTaskModal } from './TransferTaskModal';
import { AttachmentList } from './AttachmentList';

export interface TaskDetailModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  projects?: Project[];
  availableTasks?: Task[];
  onUpdateStatus?: (id: string, status: StatusTarefa) => Promise<Task | null>;
  onUpdateProgress?: (id: string, progresso: number) => Promise<Task | null>;
  onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  onDeleteTask?: (id: string) => Promise<boolean>;
  onTransferTask?: (id: string, targetProjectId: string, parentTaskId?: string) => Promise<Task | null>;
  onAddSubtask?: (taskId: string, titulo: string) => Promise<Task | null>;
  onToggleSubtask?: (taskId: string, subtaskId: string) => Promise<Task | null>;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => Promise<Task | null>;
  onCapturePhoto?: (taskId: string) => Promise<unknown>;
  onPickPhoto?: (taskId: string) => Promise<unknown>;
  onDeleteAttachment?: (taskId: string, attachmentId: string) => Promise<unknown>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const STATUS_OPTIONS: { id: StatusTarefa; label: string }[] = [
  { id: 'BACKLOG', label: 'Backlog' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { id: 'EM_REVISAO', label: 'Em Revisão' },
  { id: 'CONCLUIDO', label: 'Concluído' },
];

const PRIORITY_OPTIONS: { id: PrioridadeTarefa; label: string }[] = [
  { id: 'BAIXA', label: 'Baixa' },
  { id: 'MEDIA', label: 'Média' },
  { id: 'ALTA', label: 'Alta' },
];

export function TaskDetailModal({
  task,
  visible,
  onClose,
  projects = [],
  availableTasks = [],
  onUpdateStatus,
  onUpdateProgress,
  onUpdateTask,
  onDeleteTask,
  onTransferTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onCapturePhoto,
  onPickPhoto,
  onDeleteAttachment,
  style,
  testID = 'task-detail-modal',
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [currentStatus, setCurrentStatus] = useState<StatusTarefa>('BACKLOG');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo);
      setDescricao(task.descricao || '');
      setPrioridade(task.prioridade);
      setResponsavel(task.responsavel || '');
      setPrazo(task.prazo || '');
      setProjetoId(task.projetoId);
      setCurrentStatus(task.status);
      setCurrentProgress(task.progresso || 0);
      setIsEditing(false);
      setIsTransferModalOpen(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [task, visible]);

  if (!task) return null;

  const handleStatusChange = async (newStatus: StatusTarefa) => {
    if (newStatus === currentStatus) return;
    setCurrentStatus(newStatus);
    if (onUpdateStatus) {
      try {
        await onUpdateStatus(task.id, newStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao alterar status');
      }
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    setCurrentProgress(newProgress);
    if (onUpdateProgress) {
      try {
        await onUpdateProgress(task.id, newProgress);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar progresso');
      }
    }
  };

  const handleSaveEdits = async () => {
    if (!titulo.trim()) {
      setError('O título não pode ficar vazio');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (onUpdateTask) {
        await onUpdateTask(task.id, {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          prioridade,
          responsavel: responsavel.trim() || undefined,
          prazo: prazo.trim() || undefined,
          projetoId: projetoId || task.projetoId,
        });
      }
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    const executeDelete = async () => {
      setIsSubmitting(true);
      try {
        if (onDeleteTask) {
          const success = await onDeleteTask(task.id);
          if (success) {
            onClose();
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir tarefa');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      executeDelete();
    } else {
      Alert.alert(
        'Excluir Tarefa',
        'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  const currentProject = projects.find((p) => p.id === (isEditing ? projetoId : task.projetoId));

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
          testID="task-detail-backdrop"
        />

        <View style={[styles.sheetContainer, style]} testID="task-detail-sheet">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerBadgesRow}>
              <Badge status={currentStatus} size="sm" testID="task-detail-status-badge" />
              <Badge priority={prioridade} size="sm" testID="task-detail-priority-badge" />
              {task.syncStatus && (
                <Badge
                  syncStatus={task.syncStatus}
                  size="sm"
                  testID="task-detail-sync-badge"
                />
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              testID="task-detail-close-button"
              accessibilityRole="button"
              accessibilityLabel="Fechar detalhes"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={styles.errorBanner} testID="task-detail-error-banner">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {!isEditing ? (
              // --- VIEW MODE ---
              <View style={styles.viewModeContainer} testID="task-detail-view-mode">
                {/* Title */}
                <Text style={styles.taskTitle} testID="task-detail-title">
                  {task.referenceCode ? `[${task.referenceCode}] ` : ''}{task.titulo}
                </Text>

                {/* Project / Sector Tag */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Setor / Projeto:</Text>
                  <Text style={styles.metaValue} testID="task-detail-project-name">
                    {currentProject?.nome || task.projetoId}
                  </Text>
                </View>

                {Boolean(task.clienteName) && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Cliente:</Text>
                    <Text style={styles.metaValue}>{task.clienteName}</Text>
                  </View>
                )}

                {/* 1-Touch Quick Status Changer */}
                <View style={styles.sectionContainer} testID="task-detail-quick-status">
                  <Text style={styles.sectionLabel}>Alteração Rápida de Status (1 toque)</Text>
                  <View style={styles.statusPillsRow}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = currentStatus === opt.id;
                      const statusConfig = colors.status[opt.id];
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          testID={`task-detail-status-pill-${opt.id}`}
                          style={[
                            styles.quickStatusButton,
                            isSelected && {
                              backgroundColor: statusConfig.bg,
                              borderColor: statusConfig.border,
                            },
                          ]}
                          onPress={() => handleStatusChange(opt.id)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Mover para ${opt.label}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isSelected ? statusConfig.text : colors.neutral.textMuted },
                            ]}
                          />
                          <Text
                            style={[
                              styles.quickStatusText,
                              isSelected && {
                                color: statusConfig.text,
                                fontWeight: typography.fontWeights.bold,
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Interactive Progress Slider */}
                <View style={styles.sectionContainer}>
                  <Slider
                    label="Progresso da Tarefa"
                    value={currentProgress}
                    onChange={handleProgressChange}
                    testID="task-detail-progress-slider"
                  />
                </View>

                {/* Assignee & Prazo Info Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardRow}>
                    <View style={styles.infoBlock}>
                      <Text style={styles.infoBlockLabel}>Responsável</Text>
                      <View style={styles.assigneeRow}>
                        {task.responsavel ? (
                          <>
                            <Avatar name={task.responsavel} size="sm" />
                            <Text style={styles.infoBlockValue} testID="task-detail-assignee">
                              {task.responsavel}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.infoBlockEmpty}>Não atribuído</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.infoBlockLabel}>Prazo de Entrega</Text>
                      <Text style={styles.infoBlockValue} testID="task-detail-prazo">
                        {task.prazo || 'Sem prazo'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                {task.descricao ? (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionLabel}>Descrição</Text>
                    <View style={styles.descCard}>
                      <Text style={styles.descText} testID="task-detail-description">
                        {task.descricao}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Subtasks */}
                <SubtaskList
                  taskId={task.id}
                  subtarefas={task.subtarefas || []}
                  onAddSubtask={onAddSubtask ? (titulo) => onAddSubtask(task.id, titulo) : undefined}
                  onToggleSubtask={onToggleSubtask ? (subtaskId) => onToggleSubtask(task.id, subtaskId) : undefined}
                  onDeleteSubtask={onDeleteSubtask ? (subtaskId) => onDeleteSubtask(task.id, subtaskId) : undefined}
                  testID="task-detail-subtask-list"
                />

                {/* Field Evidence Attachments */}
                <AttachmentList
                  taskId={task.id}
                  anexos={task.anexos || []}
                  onCapturePhoto={onCapturePhoto}
                  onPickPhoto={onPickPhoto}
                  onDeleteAttachment={onDeleteAttachment}
                  testID="task-detail-attachment-list"
                />

                {/* Action Buttons in View Mode */}
                <View style={styles.viewActionsRow}>
                  <Button
                    title="Editar"
                    variant="secondary"
                    size="md"
                    onPress={() => setIsEditing(true)}
                    style={styles.actionButton}
                    testID="task-detail-edit-button"
                  />
                  {onTransferTask && (
                    <Button
                      title="Transferir"
                      variant="outline"
                      size="md"
                      onPress={() => setIsTransferModalOpen(true)}
                      style={styles.actionButton}
                      testID="task-detail-transfer-button"
                    />
                  )}
                  {onDeleteTask && (
                    <Button
                      title="Excluir"
                      variant="danger"
                      size="md"
                      onPress={handleDelete}
                      isLoading={isSubmitting}
                      style={styles.deleteButton}
                      testID="task-detail-delete-button"
                    />
                  )}
                </View>
              </View>
            ) : (
              // --- EDIT MODE ---
              <View style={styles.editModeContainer} testID="task-detail-edit-mode">
                <Text style={styles.editModeHeader}>Editar Tarefa</Text>

                {/* Titulo */}
                <Input
                  label="Título *"
                  value={titulo}
                  onChangeText={(text) => {
                    setTitulo(text);
                    if (error) setError(null);
                  }}
                  testID="task-detail-edit-title-input"
                />

                {/* Priority Selector */}
                <View style={styles.sectionContainer} testID="task-detail-edit-priority-options">
                  <Text style={styles.sectionLabel}>Prioridade</Text>
                  <View style={styles.pillsRow}>
                    {PRIORITY_OPTIONS.map((p) => {
                      const isSelected = prioridade === p.id;
                      const priorityConfig = colors.priority[p.id];
                      return (
                        <TouchableOpacity
                          key={p.id}
                          testID={`task-detail-edit-priority-${p.id}`}
                          style={[
                            styles.pill,
                            isSelected && {
                              backgroundColor: priorityConfig.bg,
                              borderColor: priorityConfig.border,
                            },
                          ]}
                          onPress={() => setPrioridade(p.id)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              isSelected && {
                                color: priorityConfig.text,
                                fontWeight: typography.fontWeights.bold,
                              },
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Responsável */}
                <Input
                  label="Responsável"
                  placeholder="Nome do operador/consultor"
                  value={responsavel}
                  onChangeText={setResponsavel}
                  testID="task-detail-edit-responsavel-input"
                />

                {/* Prazo */}
                <Input
                  label="Prazo"
                  placeholder="Ex: 2026-09-30"
                  value={prazo}
                  onChangeText={setPrazo}
                  testID="task-detail-edit-prazo-input"
                />

                {/* Descrição */}
                <Input
                  label="Descrição"
                  placeholder="Detalhes da atividade..."
                  value={descricao}
                  onChangeText={setDescricao}
                  multiline
                  numberOfLines={3}
                  testID="task-detail-edit-desc-input"
                />

                {/* Edit Mode Buttons */}
                <View style={styles.editActionsRow}>
                  <Button
                    title="Cancelar"
                    variant="outline"
                    size="md"
                    onPress={() => setIsEditing(false)}
                    disabled={isSubmitting}
                    style={styles.actionButton}
                    testID="task-detail-cancel-edit-button"
                  />
                  <Button
                    title="Salvar Alterações"
                    variant="primary"
                    size="md"
                    onPress={handleSaveEdits}
                    isLoading={isSubmitting}
                    style={styles.actionButton}
                    testID="task-detail-save-button"
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Transfer Task Modal */}
      {onTransferTask && (
        <TransferTaskModal
          task={task}
          visible={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          projects={projects}
          availableTasks={availableTasks}
          onTransfer={async (taskId, targetProjectId, parentTaskId) => {
            if (onTransferTask) {
              await onTransferTask(taskId, targetProjectId, parentTaskId);
              setIsTransferModalOpen(false);
              onClose();
            }
          }}
          testID="task-detail-transfer-modal"
        />
      )}
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
    maxHeight: '90%',
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
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
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
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  viewModeContainer: {
    gap: spacing.sm,
  },
  editModeContainer: {
    gap: spacing.xs,
  },
  editModeHeader: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
    marginBottom: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  metaValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand[700],
  },
  sectionContainer: {
    marginVertical: spacing.xs,
  },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  quickStatusText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  infoCard: {
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
    marginVertical: spacing.xs,
  },
  infoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoBlock: {
    flex: 1,
  },
  infoBlockLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    marginBottom: 4,
  },
  infoBlockValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  infoBlockEmpty: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    fontStyle: 'italic',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descCard: {
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
  },
  descText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textPrimary,
    lineHeight: 20,
  },
  viewActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 0.4,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
});
