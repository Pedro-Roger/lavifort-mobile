import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import {
  Cliente,
  FieldSearchInput,
  Uniformidade,
} from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface FieldSearchFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Lista de clientes disponível (da tela). */
  clients: Cliente[];
  /** Cria na API; se a rede falhar, a tela grava na fila offline. */
  onSubmit: (input: FieldSearchInput) => Promise<boolean>;
  /** id da vendedora logada (responsavelId). */
  responsavelId?: string | null;
  testID?: string;
}

const LARVAS_SUGGESTIONS = ['Larvifort Gold', 'Speed PL', 'PL Bio', 'Outro'];
const MOTIVOS_SUGGESTIONS = ['Preço', 'Disponibilidade', 'Distância', 'Atendimento', 'Outro'];
const UNIFORMIDADES: Uniformidade[] = ['OTIMA', 'BOA', 'REGULAR', 'RUIM'];
const UNIFORMIDADE_LABELS: Record<Uniformidade, string> = {
  OTIMA: 'Ótima',
  BOA: 'Boa',
  REGULAR: 'Regular',
  RUIM: 'Ruim',
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Questionário de pesquisa de campo. Campos obrigatórios do contrato:
 * clienteId, larvas (≥1) e maioriaLarvifort. O restante é opcional.
 */
export function FieldSearchFormModal({
  visible,
  onClose,
  clients,
  onSubmit,
  responsavelId,
  testID = 'field-search-form-modal',
}: FieldSearchFormModalProps) {
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [dataPesquisa, setDataPesquisa] = useState(todayISO());
  const [larvas, setLarvas] = useState<string[]>([]);
  const [outraLarva, setOutraLarva] = useState('');
  const [maioriaLarvifort, setMaioriaLarvifort] = useState<boolean | null>(null);
  const [parouLarvifort, setParouLarvifort] = useState<boolean | null>(null);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [outroMotivo, setOutroMotivo] = useState('');
  const [uniformidadeBercario, setUniformidadeBercario] = useState<Uniformidade | null>(null);
  const [uniformidadeCultivo, setUniformidadeCultivo] = useState<Uniformidade | null>(null);
  const [sobrevBercario, setSobrevBercario] = useState('');
  const [sobrevCultivo, setSobrevCultivo] = useState('');
  const [resultados, setResultados] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setClientQuery('');
      setSelectedClient(null);
      setDataPesquisa(todayISO());
      setLarvas([]);
      setOutraLarva('');
      setMaioriaLarvifort(null);
      setParouLarvifort(null);
      setMotivos([]);
      setOutroMotivo('');
      setUniformidadeBercario(null);
      setUniformidadeCultivo(null);
      setSobrevBercario('');
      setSobrevCultivo('');
      setResultados('');
      setObservacoes('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  const candidates = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return clients
      .filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          (c.cidade ?? '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [clientQuery, clients]);

  const toggleArrayItem = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleToggleLarva = (label: string) => {
    if (label === 'Outro') {
      setLarvas(larvas.filter((l) => l !== 'Outro'));
      setOutraLarva('');
      return;
    }
    toggleArrayItem(larvas, setLarvas, label);
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      setError('Selecione o cliente pesquisado.');
      return;
    }

    const larvasFinal = [...larvas];
    if (outraLarva.trim()) larvasFinal.push(outraLarva.trim());
    if (larvasFinal.length === 0) {
      setError('Informe pelo menos uma pós-larva utilizada.');
      return;
    }
    if (maioriaLarvifort === null) {
      setError('Responda se a maioria das pós-larvas é da Larvifort.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const motivosFinal = [...motivos];
      const input: FieldSearchInput = {
        clienteId: selectedClient.id,
        dataPesquisa: dataPesquisa.trim() || todayISO(),
        responsavelId: responsavelId ?? null,
        larvas: larvasFinal,
        maioriaLarvifort,
        parouLarvifort: parouLarvifort ?? false,
        motivosSaida: motivosFinal,
        outroMotivo: outroMotivo.trim() || null,
        uniformidadeBercario,
        uniformidadeCultivo,
        sobrevBercario: sobrevBercario.trim() ? Number(sobrevBercario) : null,
        sobrevCultivo: sobrevCultivo.trim() ? Number(sobrevCultivo) : null,
        resultadosUltimoCiclo: resultados.trim() || null,
        observacoes: observacoes.trim() || null,
      };
      const ok = await onSubmit(input);
      if (ok) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const chip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    testId: string
  ) => (
    <TouchableOpacity
      key={testId}
      testID={testId}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const boolChips = (
    value: boolean | null,
    onChange: (v: boolean) => void,
    baseTestId: string
  ) => (
    <View style={styles.chipsRow}>
      {chip('Sim', value === true, () => onChange(true), `${baseTestId}-sim`)}
      {chip('Não', value === false, () => onChange(false), `${baseTestId}-nao`)}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} testID={testID}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} testID="field-search-form-backdrop" />

        <View style={styles.sheetContainer} testID="field-search-form-sheet">
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Nova Pesquisa de Campo</Text>
              <Text style={styles.sheetSubtitle}>Questionário de pós-larvas</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              testID="field-search-form-close-button"
              accessibilityRole="button"
              accessibilityLabel="Fechar formulário"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View style={styles.errorBanner} testID="field-search-form-error-banner">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Cliente (obrigatório) */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Cliente *</Text>
              {selectedClient ? (
                <View style={styles.selectedRow} testID="field-search-form-selected-client">
                  <Text style={styles.selectedText}>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedClient(null);
                      setClientQuery('');
                    }}
                    style={styles.selectedClear}
                    accessibilityRole="button"
                    accessibilityLabel="Trocar cliente"
                    testID="field-search-form-clear-client"
                  >
                    <Text style={styles.selectedClearText}>Trocar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Input
                    placeholder="Buscar cliente por nome ou cidade..."
                    value={clientQuery}
                    onChangeText={setClientQuery}
                    testID="field-search-form-client-search"
                  />
                  {candidates.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.candidateRow}
                      onPress={() => {
                        setSelectedClient(c);
                        setClientQuery('');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ${c.firstName} ${c.lastName}`}
                      testID={`field-search-form-client-${c.id}`}
                    >
                      <Text style={styles.candidateText} numberOfLines={1}>
                        {c.firstName} {c.lastName}
                        {c.cidade ? ` · ${c.cidade}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Data */}
            <Input
              label="Data da pesquisa"
              placeholder="AAAA-MM-DD"
              value={dataPesquisa}
              onChangeText={setDataPesquisa}
              testID="field-search-form-date"
            />

            {/* Larvas (obrigatório ≥1) */}
            <View style={styles.sectionContainer} testID="field-search-form-larvas">
              <Text style={styles.sectionLabel}>Pós-larvas utilizadas *</Text>
              <View style={styles.chipsRow}>
                {LARVAS_SUGGESTIONS.map((label) =>
                  chip(label, larvas.includes(label), () => handleToggleLarva(label), `field-search-form-larva-${label.replace(/\s/g, '-').toLowerCase()}`)
                )}
              </View>
              {larvas.includes('Outro') ? null : (
                <Input
                  placeholder="Outra marca (opcional)"
                  value={outraLarva}
                  onChangeText={setOutraLarva}
                  testID="field-search-form-larva-outro"
                />
              )}
            </View>

            {/* Maioria Larvifort (obrigatório) */}
            <View style={styles.sectionContainer} testID="field-search-form-maioria">
              <Text style={styles.sectionLabel}>A maioria das pós-larvas é da Larvifort? *</Text>
              {boolChips(maioriaLarvifort, setMaioriaLarvifort, 'field-search-form-maioria')}
            </View>

            {/* Parou Larvifort */}
            <View style={styles.sectionContainer} testID="field-search-form-parou">
              <Text style={styles.sectionLabel}>Parou de comprar Larvifort?</Text>
              {boolChips(parouLarvifort, setParouLarvifort, 'field-search-form-parou')}
            </View>

            {/* Motivos de saída */}
            <View style={styles.sectionContainer} testID="field-search-form-motivos">
              <Text style={styles.sectionLabel}>Motivos de saída (se aplicável)</Text>
              <View style={styles.chipsRow}>
                {MOTIVOS_SUGGESTIONS.map((label) =>
                  chip(label, motivos.includes(label), () => toggleArrayItem(motivos, setMotivos, label), `field-search-form-motivo-${label.toLowerCase()}`)
                )}
              </View>
              {motivos.length > 0 ? (
                <Input
                  placeholder="Detalhe o motivo (opcional)"
                  value={outroMotivo}
                  onChangeText={setOutroMotivo}
                  testID="field-search-form-outro-motivo"
                />
              ) : null}
            </View>

            {/* Uniformidade */}
            <View style={styles.sectionContainer} testID="field-search-form-uniformidades">
              <Text style={styles.sectionLabel}>Uniformidade</Text>
              <Text style={styles.subLabel}>Berçário</Text>
              <View style={styles.chipsRow}>
                {UNIFORMIDADES.map((u) =>
                  chip(UNIFORMIDADE_LABELS[u], uniformidadeBercario === u, () => setUniformidadeBercario(uniformidadeBercario === u ? null : u), `field-search-form-bercario-${u.toLowerCase()}`)
                )}
              </View>
              <Text style={styles.subLabel}>Cultivo</Text>
              <View style={styles.chipsRow}>
                {UNIFORMIDADES.map((u) =>
                  chip(UNIFORMIDADE_LABELS[u], uniformidadeCultivo === u, () => setUniformidadeCultivo(uniformidadeCultivo === u ? null : u), `field-search-form-cultivo-${u.toLowerCase()}`)
                )}
              </View>
            </View>

            {/* Sobrevivência */}
            <View style={styles.sectionContainer} testID="field-search-form-sobrev">
              <Text style={styles.sectionLabel}>Sobrevivência (%)</Text>
              <View style={styles.numberRow}>
                <View style={styles.numberField}>
                  <Input
                    label="Berçário"
                    keyboardType="decimal-pad"
                    value={sobrevBercario}
                    onChangeText={setSobrevBercario}
                    testID="field-search-form-sobrev-bercario"
                  />
                </View>
                <View style={styles.numberField}>
                  <Input
                    label="Cultivo"
                    keyboardType="decimal-pad"
                    value={sobrevCultivo}
                    onChangeText={setSobrevCultivo}
                    testID="field-search-form-sobrev-cultivo"
                  />
                </View>
              </View>
            </View>

            {/* Textos livres */}
            <Input
              label="Resultados do último ciclo"
              placeholder="Ex: ciclo fechado em 85 dias, 12g médio"
              value={resultados}
              onChangeText={setResultados}
              multiline
              numberOfLines={2}
              testID="field-search-form-resultados"
            />
            <Input
              label="Observações"
              placeholder="Anotações gerais..."
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
              numberOfLines={3}
              testID="field-search-form-observacoes"
            />
          </ScrollView>

          <View style={styles.actionsFooter}>
            <Button
              title="Cancelar"
              variant="outline"
              size="md"
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.actionButton}
              testID="field-search-form-cancel-button"
            />
            <Button
              title="Salvar Pesquisa"
              variant="primary"
              size="md"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              style={styles.actionButton}
              testID="field-search-form-submit-button"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  sheetContainer: {
    backgroundColor: colors.neutral.surface,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    maxHeight: '92%',
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
  scrollContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.xs },
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
  sectionContainer: { marginVertical: spacing.xs },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  subLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  selectedText: { flex: 1, fontSize: typography.fontSizes.base, color: colors.neutral.textPrimary },
  selectedClear: { minHeight: minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm },
  selectedClearText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[700],
    fontWeight: typography.fontWeights.semibold,
  },
  candidateRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    minHeight: minTouchTarget,
    marginBottom: spacing.xs,
  },
  candidateText: { fontSize: typography.fontSizes.sm, color: colors.neutral.textPrimary },
  chipsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.xs },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.brand[50], borderColor: colors.brand[600] },
  chipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  chipTextActive: { color: colors.brand[700], fontWeight: typography.fontWeights.bold },
  numberRow: { flexDirection: 'row', gap: spacing.sm },
  numberField: { flex: 1 },
  actionsFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: spacing.sm,
  },
  actionButton: { flex: 1 },
});
