import React, { useState, useEffect } from 'react';
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
import { Order, CreateOrderInput, Cliente } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatBRL } from '@/utils/format';
import {
  OrderDraft,
  DraftItem,
  PAYMENT_METHODS,
  UNITS,
  STEP_TITLES,
  emptyDraft,
  emptyItem,
  maskDate,
  maskTime,
  orderTotal,
  clientAddress,
  validateStep,
  buildOrderInput,
} from './orderForm';

export interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSearchClients: (search: string) => Promise<Cliente[]>;
  onCreateOrder: (input: CreateOrderInput) => Promise<Order | null>;
  testID?: string;
}

const LAST_STEP = STEP_TITLES.length - 1;

/** Pedido em 4 passos curtos: Cliente → Produtos → Entrega → Pagamento. */
export function CreateOrderModal({
  visible,
  onClose,
  onSearchClients,
  onCreateOrder,
  testID = 'create-order-modal',
}: CreateOrderModalProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft());
  const [clientQuery, setClientQuery] = useState('');
  const [candidates, setCandidates] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setDraft(emptyDraft());
      setClientQuery('');
      setCandidates([]);
      setError(null);
      setIsSubmitting(false);
      setIsSearching(false);
    }
  }, [visible]);

  const patch = (p: Partial<OrderDraft>) => setDraft((d) => ({ ...d, ...p }));

  const handleSearch = async (query: string) => {
    setClientQuery(query);
    if (query.trim().length < 2) {
      setCandidates([]);
      return;
    }
    setIsSearching(true);
    try {
      setCandidates(await onSearchClients(query.trim()));
    } catch {
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectClient = (client: Cliente) => {
    // Endereço do cadastro pré-preenche a entrega (editável no passo 3).
    patch({ client, endereco: clientAddress(client) });
    setCandidates([]);
    setClientQuery('');
    setError(null);
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    }));

  const removeItem = (index: number) =>
    setDraft((d) => ({
      ...d,
      items: d.items.length === 1 ? d.items : d.items.filter((_, i) => i !== index),
    }));

  const goNext = () => {
    const msg = validateStep(step, draft);
    setError(msg);
    if (!msg) setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    for (let s = 0; s <= LAST_STEP; s++) {
      const msg = validateStep(s, draft);
      if (msg) {
        setStep(s);
        setError(msg);
        return;
      }
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await onCreateOrder(buildOrderInput(draft));
      if (created) onClose();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === undefined
          ? 'Sem conexão. Conecte-se à internet para salvar o pedido.'
          : err instanceof Error
            ? err.message
            : 'Erro ao criar o pedido',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const chip = (label: string, selected: boolean, onPress: () => void, id: string) => (
    <TouchableOpacity
      key={label}
      testID={id}
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const clientName = draft.client
    ? `${draft.client.firstName} ${draft.client.lastName}`.trim()
    : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} testID={testID}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} testID="create-order-backdrop" />

        <View style={styles.sheetContainer} testID="create-order-sheet">
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Novo pedido</Text>
              <Text style={styles.sheetSubtitle}>
                Passo {step + 1} de {STEP_TITLES.length} · {STEP_TITLES[step]}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="create-order-close-button" accessibilityRole="button" accessibilityLabel="Fechar modal">
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow} testID="create-order-progress">
            {STEP_TITLES.map((t, i) => (
              <View key={t} style={[styles.progressBar, i <= step && styles.progressBarOn]} />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={styles.errorBanner} testID="create-order-error-banner">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {step === 0 && (
              <View style={styles.section} testID="create-order-step-client">
                <Text style={styles.sectionLabel}>Cliente *</Text>
                {draft.client ? (
                  <View style={styles.selectedClientRow} testID="create-order-selected-client">
                    <View style={styles.flex1}>
                      <Text style={styles.selectedClientText}>{clientName}</Text>
                      {clientAddress(draft.client) ? (
                        <Text style={styles.muted} numberOfLines={2}>
                          {clientAddress(draft.client)}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => patch({ client: null, endereco: '' })}
                      style={styles.linkButton}
                      accessibilityRole="button"
                      accessibilityLabel="Trocar cliente"
                      testID="create-order-clear-client"
                    >
                      <Text style={styles.linkText}>Trocar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Input
                      placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                      value={clientQuery}
                      onChangeText={handleSearch}
                      testID="create-order-client-search"
                    />
                    {isSearching && <Text style={styles.muted}>Buscando...</Text>}
                  </View>
                )}
                {!draft.client && candidates.length > 0 && (
                  <View style={styles.candidateList} testID="create-order-candidates">
                    {candidates.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.candidateRow}
                        onPress={() => selectClient(c)}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar ${c.firstName} ${c.lastName}`}
                        testID={`create-order-client-${c.id}`}
                      >
                        <Text style={styles.candidateText} numberOfLines={1}>
                          {c.firstName} {c.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {step === 1 && (
              <View style={styles.section} testID="create-order-items">
                {draft.items.map((item, index) => (
                  <View key={index} style={styles.itemCard} testID={`create-order-item-${index}`}>
                    <Text style={styles.itemIndex}>Produto {index + 1}</Text>
                    <Input
                      label="Nome do produto"
                      placeholder="Ex.: Pós-larva PL12"
                      value={item.productName}
                      onChangeText={(v) => updateItem(index, 'productName', v)}
                      testID={`create-order-item-${index}-name`}
                    />
                    <View style={styles.row}>
                      <View style={styles.flex1}>
                        <Input
                          label="Quantidade"
                          keyboardType="decimal-pad"
                          value={item.quantity}
                          onChangeText={(v) => updateItem(index, 'quantity', v)}
                          testID={`create-order-item-${index}-qty`}
                        />
                      </View>
                      <View style={styles.flex1}>
                        <Input
                          label="Valor unit. (R$)"
                          keyboardType="decimal-pad"
                          placeholder="0,00"
                          value={item.unitPrice}
                          onChangeText={(v) => updateItem(index, 'unitPrice', v)}
                          testID={`create-order-item-${index}-price`}
                        />
                      </View>
                    </View>
                    <View style={styles.pillsRow}>
                      {UNITS.map((u) =>
                        chip(u, item.unit === u, () => updateItem(index, 'unit', u), `create-order-item-${index}-unit-${u}`),
                      )}
                    </View>
                    {draft.items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(index)} accessibilityRole="button" accessibilityLabel="Remover produto" testID={`create-order-item-${index}-remove`}>
                        <Text style={styles.removeText}>Remover produto</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <Button
                  title="+ Adicionar produto"
                  variant="outline"
                  size="sm"
                  onPress={() => setDraft((d) => ({ ...d, items: [...d.items, emptyItem()] }))}
                  testID="create-order-add-item"
                />
                <Text style={styles.total} testID="create-order-subtotal">
                  Total: {formatBRL(orderTotal(draft))}
                </Text>
              </View>
            )}

            {step === 2 && (
              <View style={styles.section} testID="create-order-step-delivery">
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Data de entrega *"
                      placeholder="dd/mm/aaaa"
                      keyboardType="number-pad"
                      value={draft.deliveryDate}
                      onChangeText={(v) => patch({ deliveryDate: maskDate(v) })}
                      testID="create-order-delivery-date"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Input
                      label="Hora"
                      placeholder="HH:mm"
                      keyboardType="number-pad"
                      value={draft.horaEntrega}
                      onChangeText={(v) => patch({ horaEntrega: maskTime(v) })}
                      testID="create-order-delivery-time"
                    />
                  </View>
                </View>
                <Input
                  label="Local de entrega"
                  placeholder="Fazenda ou ponto de entrega"
                  value={draft.localEntrega}
                  onChangeText={(v) => patch({ localEntrega: v })}
                  testID="create-order-delivery-place"
                />
                <Input
                  label="Endereço de entrega *"
                  placeholder="Rua, número, cidade/UF"
                  value={draft.endereco}
                  onChangeText={(v) => patch({ endereco: v })}
                  multiline
                  helperText="Obrigatório para fechar o pedido."
                  testID="create-order-delivery-address"
                />
              </View>
            )}

            {step === 3 && (
              <View style={styles.section} testID="create-order-step-payment">
                <Text style={styles.sectionLabel}>Forma de pagamento *</Text>
                <View style={styles.pillsRow}>
                  {PAYMENT_METHODS.map((m) =>
                    chip(m, draft.paymentMethod === m, () => patch({ paymentMethod: m }), `create-order-payment-${m}`),
                  )}
                </View>
                <Input
                  label="Observação"
                  placeholder="Opcional"
                  value={draft.notes}
                  onChangeText={(v) => patch({ notes: v })}
                  multiline
                  testID="create-order-notes"
                />
                <View style={styles.summary} testID="create-order-summary">
                  <Text style={styles.summaryTitle}>Resumo</Text>
                  <Text style={styles.summaryLine}>{clientName}</Text>
                  <Text style={styles.summaryLine}>
                    {draft.items.filter((i) => i.productName.trim()).length} produto(s) · {formatBRL(orderTotal(draft))}
                  </Text>
                  <Text style={styles.summaryLine}>
                    Entrega {draft.deliveryDate}
                    {draft.horaEntrega ? ` às ${draft.horaEntrega}` : ''}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <Button title="Voltar" variant="outline" onPress={goBack} style={styles.flex1} testID="create-order-back" />
            ) : (
              <Button title="Cancelar" variant="outline" onPress={onClose} style={styles.flex1} testID="create-order-cancel" />
            )}
            {step < LAST_STEP ? (
              <Button title="Continuar" onPress={goNext} style={styles.flex1} testID="create-order-next" />
            ) : (
              <Button
                title="Salvar pedido"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                disabled={isSubmitting}
                style={styles.flex1}
                testID="create-order-submit"
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  backdropDismiss: { flex: 1 },
  sheetContainer: {
    maxHeight: '92%',
    backgroundColor: colors.neutral.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  sheetTitle: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.neutral.textPrimary },
  sheetSubtitle: { marginTop: 2, fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
  closeButton: { minHeight: minTouchTarget, minWidth: minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: typography.fontSizes.lg, color: colors.neutral.textSecondary },
  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  progressBar: { flex: 1, height: 4, borderRadius: radii.sm, backgroundColor: colors.neutral.border },
  progressBarOn: { backgroundColor: colors.brand[600] },
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.md },
  errorBanner: { backgroundColor: '#fee2e2', borderRadius: radii.md, padding: spacing.md },
  errorBannerText: { color: '#b91c1c', fontSize: typography.fontSizes.sm },
  section: { gap: spacing.md },
  sectionLabel: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  muted: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  selectedClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  selectedClientText: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textPrimary },
  linkButton: { minHeight: minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm },
  linkText: { color: colors.brand[700], fontWeight: typography.fontWeights.semibold, fontSize: typography.fontSizes.sm },
  candidateList: { borderWidth: 1, borderColor: colors.neutral.border, borderRadius: radii.md, overflow: 'hidden' },
  candidateRow: { minHeight: minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.neutral.borderSubtle },
  candidateText: { fontSize: typography.fontSizes.base, color: colors.neutral.textPrimary },
  itemCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.neutral.border, backgroundColor: colors.neutral.surfaceSubtle },
  itemIndex: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textMuted, textTransform: 'uppercase' },
  removeText: { color: '#b91c1c', fontSize: typography.fontSizes.sm, paddingVertical: spacing.xs },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.surface,
  },
  pillSelected: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  pillText: { fontSize: typography.fontSizes.sm, color: colors.neutral.textSecondary, fontWeight: typography.fontWeights.medium },
  pillTextSelected: { color: colors.neutral.white, fontWeight: typography.fontWeights.semibold },
  total: { textAlign: 'right', fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.neutral.textPrimary },
  summary: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.brand[50], gap: 2 },
  summaryTitle: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold, color: colors.brand[700], textTransform: 'uppercase' },
  summaryLine: { fontSize: typography.fontSizes.sm, color: colors.neutral.textPrimary },
  footer: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
});
