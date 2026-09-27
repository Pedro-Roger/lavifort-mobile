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
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Project, StatusTarefa, PrioridadeTarefa, CreateTaskDTO, Task } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';

export interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  projects?: Project[];
  defaultProjectId?: string | null;
  onCreateTask: (dto: CreateTaskDTO) => Promise<Task | null>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const STATUS_LIST: { id: StatusTarefa; label: string }[] = [
  { id: 'BACKLOG', label: 'Backlog' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { id: 'EM_REVISAO', label: 'Em Revisão' },
  { id: 'CONCLUIDO', label: 'Concluído' },
];

const PRIORITY_LIST: { id: PrioridadeTarefa; label: string }[] = [
  { id: 'BAIXA', label: 'Baixa' },
  { id: 'MEDIA', label: 'Média' },
  { id: 'ALTA', label: 'Alta' },
];

export function CreateTaskModal({
  visible,
  onClose,
  projects = [],
  defaultProjectId,
  onCreateTask,
  style,
  testID = 'create-task-modal',
}: CreateTaskModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [status, setStatus] = useState<StatusTarefa>('BACKLOG');
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA');
  const [progresso, setProgresso] = useState(0);
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitulo('');
      setDescricao('');
      setProjetoId(defaultProjectId || (projects[0]?.id ?? 'comercial'));
      setStatus('BACKLOG');
      setPrioridade('MEDIA');
      setProgresso(0);
      setResponsavel('');
      setPrazo('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible, defaultProjectId, projects]);

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      setError('O título da tarefa é obrigatório');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created = await onCreateTask({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        projetoId: projetoId || 'comercial',
        status,
        prioridade,
        progresso,
        responsavel: responsavel.trim() || undefined,
        prazo: prazo.trim() || undefined,
      });

      if (created) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
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
          testID="create-task-backdrop"
        />

        <View style={[styles.sheetContainer, style]} testID="create-task-sheet">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Nova Tarefa</Text>
              <Text style={styles.sheetSubtitle}>Criação ágil e 100% offline</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              testID="create-task-close-button"
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={styles.errorBanner} testID="create-task-error-banner">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Titulo */}
            <Input
              label="Título *"
              placeholder="Ex: Visita Técnica Viveiro 2"
              value={titulo}
              onChangeText={(text) => {
                setTitulo(text);
                if (error) setError(null);
              }}
              testID="create-task-title-input"
            />

            {/* Projeto / Setor */}
            {projects.length > 0 && (
              <View style={styles.sectionContainer} testID="create-task-project-options">
                <Text style={styles.sectionLabel}>Projeto / Setor</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillsRow}
                >
                  {projects.map((p) => {
                    const isSelected = (projetoId || defaultProjectId) === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        testID={`create-task-project-${p.id}`}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => setProjetoId(p.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar projeto ${p.nome}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[styles.pillText, isSelected && styles.pillTextSelected]}
                        >
                          {p.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Status Inicial */}
            <View style={styles.sectionContainer} testID="create-task-status-options">
              <Text style={styles.sectionLabel}>Status Inicial</Text>
              <View style={styles.gridRow}>
                {STATUS_LIST.map((s) => {
                  const isSelected = status === s.id;
                  const statusConfig = colors.status[s.id];
                  return (
                    <TouchableOpacity
                      key={s.id}
                      testID={`create-task-status-${s.id}`}
                      style={[
                        styles.statusPill,
                        isSelected && {
                          backgroundColor: statusConfig.bg,
                          borderColor: statusConfig.border,
                        },
                      ]}
                      onPress={() => setStatus(s.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar status ${s.label}`}
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
                          styles.statusPillText,
                          isSelected && { color: statusConfig.text, fontWeight: typography.fontWeights.bold },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Prioridade */}
            <View style={styles.sectionContainer} testID="create-task-priority-options">
              <Text style={styles.sectionLabel}>Prioridade</Text>
              <View style={styles.pillsRow}>
                {PRIORITY_LIST.map((p) => {
                  const isSelected = prioridade === p.id;
                  const priorityConfig = colors.priority[p.id];
                  return (
                    <TouchableOpacity
                      key={p.id}
                      testID={`create-task-priority-${p.id}`}
                      style={[
                        styles.pill,
                        isSelected && {
                          backgroundColor: priorityConfig.bg,
                          borderColor: priorityConfig.border,
                        },
                      ]}
                      onPress={() => setPrioridade(p.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar prioridade ${p.label}`}
                      accessibilityState={{ selected: isSelected }}
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

            {/* Progresso com Slider */}
            <View style={styles.sectionContainer}>
              <Slider
                label="Progresso Inicial"
                value={progresso}
                onChange={setProgresso}
                testID="create-task-progress-slider"
              />
            </View>

            {/* Responsável */}
            <Input
              label="Responsável"
              placeholder="Ex: Pedro Silva"
              value={responsavel}
              onChangeText={setResponsavel}
              testID="create-task-responsavel-input"
            />

            {/* Prazo */}
            <Input
              label="Prazo"
              placeholder="Ex: 2026-09-30"
              value={prazo}
              onChangeText={setPrazo}
              testID="create-task-prazo-input"
            />

            {/* Descrição */}
            <Input
              label="Descrição"
              placeholder="Descreva detalhes ou observações..."
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={3}
              testID="create-task-descricao-input"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsFooter}>
            <Button
              title="Cancelar"
              variant="outline"
              size="md"
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.actionButton}
              testID="create-task-cancel-button"
            />
            <Button
              title="Criar Tarefa"
              variant="primary"
              size="md"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              style={styles.actionButton}
              testID="create-task-submit-button"
            />
          </View>
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
  sheetTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  sheetSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: 2,
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
    gap: spacing.xs,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
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
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  pillSelected: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
  },
  pillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  pillTextSelected: {
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
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
  statusPillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  actionsFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
