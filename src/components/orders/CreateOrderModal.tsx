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
import { Order, OrderStatus, OrderPhase, CreateOrderInput, Cliente } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatMoney } from './orderMeta';

export interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSearchClients: (search: string) => Promise<Cliente[]>;
  onCreateOrder: (input: CreateOrderInput) => Promise<Order | null>;
  testID?: string;
}

interface DraftItem {
  productName: string;
  quantity: string;
  unitPrice: string;
}

const STATUS_LIST: { id: OrderStatus; label: string }[] = [
  { id: 'ORCAMENTO', label: 'Orçamento' },
  { id: 'PEDIDO', label: 'Pedido' },
];

export function CreateOrderModal({
  visible,
  onClose,
  onSearchClients,
  onCreateOrder,
  testID = 'create-order-modal',
}: CreateOrderModalProps) {
  const [clientQuery, setClientQuery] = useState('');
  const [candidates, setCandidates] = useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [status, setStatus] = useState<OrderStatus>('PEDIDO');
  const [phase, setPhase] = useState<OrderPhase>('ABERTO');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ productName: '', quantity: '1', unitPrice: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      setClientQuery('');
      setCandidates([]);
      setSelectedClient(null);
      setStatus('PEDIDO');
      setPhase('ABERTO');
      setDeliveryDate('');
      setNotes('');
      setItems([{ productName: '', quantity: '1', unitPrice: '' }]);
      setError(null);
      setIsSubmitting(false);
      setIsSearching(false);
    }
  }, [visible]);

  const handleSearch = async (query: string) => {
    setClientQuery(query);
    if (query.trim().length < 2) {
      setCandidates([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const found = await onSearchClients(query.trim());
      setCandidates(found);
    } catch {
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectClient = (client: Cliente) => {
    setSelectedClient(client);
    setCandidates([]);
    setClientQuery(`${client.firstName} ${client.lastName}`.trim());
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    setItems(next);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { productName: '', quantity: '1', unitPrice: '' }]);
  };

  const computeSubtotal = () =>
    items.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return acc + qty * price;
    }, 0);

  const handleSubmit = async () => {
    if (!selectedClient) {
      setError('Selecione um cliente para o pedido');
      return;
    }
    const validItems = items.filter((item) => item.productName.trim().length > 0);
    if (validItems.length === 0) {
      setError('Adicione ao menos um item com nome do produto');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const created = await onCreateOrder({
        clientId: selectedClient.id,
        status,
        phase,
        deliveryDate: deliveryDate.trim() || null,
        notes: notes.trim() || null,
        items: validItems.map((item) => ({
          productName: item.productName.trim(),
          unit: 'und',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
        })),
      });
      if (created) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar o pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = computeSubtotal();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} testID={testID}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} testID="create-order-backdrop" />

        <View style={styles.sheetContainer} testID="create-order-sheet">
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Novo Pedido</Text>
              <Text style={styles.sheetSubtitle}>Novo pedido sincronizado com a API</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="create-order-close-button" accessibilityRole="button" accessibilityLabel="Fechar modal">
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={styles.errorBanner} testID="create-order-error-banner">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Cliente */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Cliente *</Text>
              {selectedClient ? (
                <View style={styles.selectedClientRow} testID="create-order-selected-client">
                  <Text style={styles.selectedClientText}>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedClient(null);
                      setClientQuery('');
                    }}
                    style={styles.selectedClientClear}
                    accessibilityRole="button"
                    accessibilityLabel="Trocar cliente"
                    testID="create-order-clear-client"
                  >
                    <Text style={styles.selectedClientClearText}>Trocar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Input
                    placeholder="Buscar cliente por nome ou CPF..."
                    value={clientQuery}
                    onChangeText={handleSearch}
                    testID="create-order-client-search"
                  />
                  {isSearching && <Text style={styles.searchingText}>Buscando...</Text>}
                </View>
              )}

              {!selectedClient && candidates.length > 0 && (
                <View style={styles.candidateList} testID="create-order-candidates">
                  {candidates.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.candidateRow}
                      onPress={() => handleSelectClient(c)}
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

            {/* Status */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Tipo</Text>
              <View style={styles.pillsRow}>
                {STATUS_LIST.map((s) => {
                  const isSelected = status === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      testID={`create-order-status-${s.id}`}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setStatus(s.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ${s.label}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Items */}
            <View style={styles.sectionContainer} testID="create-order-items">
              <Text style={styles.sectionLabel}>Items</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.itemCard} testID={`create-order-item-${index}`}>
                  <Text style={styles.itemIndex}>Item {index + 1}</Text>
                  <Input
                    placeholder="Nome do produto *"
                    value={item.productName}
                    onChangeText={(text) => updateItem(index, 'productName', text)}
                    testID={`create-order-item-${index}-name`}
                  />
                  <View style={styles.itemNumberRow}>
                    <View style={styles.itemNumberField}>
                      <Input
                        label="Quantidade"
                        keyboardType="number-pad"
                        value={item.quantity}
                        onChangeText={(text) => updateItem(index, 'quantity', text)}
                        testID={`create-order-item-${index}-qty`}
                      />
                    </View>
                    <View style={styles.itemNumberField}>
                      <Input
                        label="Preço unit."
                        keyboardType="decimal-pad"
                        value={item.unitPrice}
                        onChangeText={(text) => updateItem(index, 'unitPrice', text)}
                        testID={`create-order-item-${index}-price`}
                      />
                    </View>
                  </View>
                  {items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItem(index)}
                      style={styles.removeItem}
                      accessibilityRole="button"
                      testID={`create-order-item-${index}-remove`}
                    >
                      <Text style={styles.removeItemText}>Remover item</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addItem} style={styles.addItem} accessibilityRole="button" testID="create-order-add-item">
                <Text style={styles.addItemText}>+ Adicionar item</Text>
              </TouchableOpacity>
            </View>

            {/* Totales parciales */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>{formatMoney(subtotal)}</Text>
            </View>

            {/* Datos opcionales */}
            <Input
              label="Data de entrega"
              placeholder="Ex: 2026-10-15"
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              testID="create-order-delivery-date"
            />
            <Input
              label="Notas"
              placeholder="Instruções ou observações..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              testID="create-order-notes"
            />
          </ScrollView>

          <View style={styles.actionsFooter}>
            <Button title="Cancelar" variant="outline" size="md" onPress={onClose} disabled={isSubmitting} style={styles.actionButton} testID="create-order-cancel-button" />
            <Button title="Criar Pedido" variant="primary" size="md" onPress={handleSubmit} isLoading={isSubmitting} style={styles.actionButton} testID="create-order-submit-button" />
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
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
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
  sheetTitle: { fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.neutral.textPrimary },
  sheetSubtitle: { fontSize: typography.fontSizes.xs, color: colors.neutral.textSecondary, marginTop: 2 },
  closeButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  closeButtonText: { fontSize: typography.fontSizes.base, color: colors.neutral.textSecondary, fontWeight: typography.fontWeights.bold },
  scrollContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.xs },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorBannerText: { color: '#b91c1c', fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.medium },
  sectionContainer: { marginVertical: spacing.xs },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  selectedClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  selectedClientText: { flex: 1, fontSize: typography.fontSizes.base, color: colors.neutral.textPrimary },
  selectedClientClear: { minHeight: minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm },
  selectedClientClearText: { fontSize: typography.fontSizes.xs, color: colors.brand[700], fontWeight: typography.fontWeights.semibold },
  searchingText: { fontSize: typography.fontSizes.xs, color: colors.neutral.textMuted, marginTop: 4 },
  candidateList: { marginTop: spacing.xs },
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
  pillsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: { backgroundColor: colors.brand[50], borderColor: colors.brand[600] },
  pillText: { fontSize: typography.fontSizes.xs, color: colors.neutral.textSecondary, fontWeight: typography.fontWeights.medium },
  pillTextSelected: { color: colors.brand[700], fontWeight: typography.fontWeights.bold },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.neutral.surface,
    marginBottom: spacing.sm,
  },
  itemIndex: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.neutral.textMuted, marginBottom: spacing.xs },
  itemNumberRow: { flexDirection: 'row', gap: spacing.sm },
  itemNumberField: { flex: 1 },
  removeItem: { minHeight: minTouchTarget, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs },
  removeItemText: { fontSize: typography.fontSizes.xs, color: '#dc2626', fontWeight: typography.fontWeights.medium },
  addItem: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand[300],
    borderRadius: radii.md,
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  addItemText: { fontSize: typography.fontSizes.sm, color: colors.brand[700], fontWeight: typography.fontWeights.semibold },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  subtotalLabel: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.neutral.textSecondary },
  subtotalValue: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.neutral.textPrimary },
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