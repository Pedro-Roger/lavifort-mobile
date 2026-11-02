import { Cliente, CreateOrderInput } from '@/types';

/** CRM: PIX, Boleto, Cartão, Transferência, A prazo + Dinheiro/Depósito (pedido da comercial). */
export const PAYMENT_METHODS = [
  'PIX',
  'A prazo',
  'Boleto',
  'Cartão',
  'Transferência',
  'Dinheiro/Depósito',
] as const;

export const UNITS = ['MILHEIRO', 'UN', 'KG'] as const;
export const DEFAULT_UNIT = 'MILHEIRO';

export interface DraftItem {
  productName: string;
  quantity: string;
  unitPrice: string;
  unit: string;
}

export interface OrderDraft {
  client: Cliente | null;
  items: DraftItem[];
  /** dd/mm/aaaa */
  deliveryDate: string;
  /** HH:mm */
  horaEntrega: string;
  localEntrega: string;
  endereco: string;
  paymentMethod: string;
  notes: string;
}

export const emptyItem = (): DraftItem => ({
  productName: '',
  quantity: '1',
  unitPrice: '',
  unit: DEFAULT_UNIT,
});

export const emptyDraft = (): OrderDraft => ({
  client: null,
  items: [emptyItem()],
  deliveryDate: '',
  horaEntrega: '',
  localEntrega: '',
  endereco: '',
  paymentMethod: 'PIX',
  notes: '',
});

export const STEP_TITLES = ['Cliente', 'Produtos', 'Entrega', 'Pagamento'] as const;

export function parseDecimal(value: string): number {
  const n = Number(value.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** "05/11/2026" → "2026-11-05T12:00:00.000Z" (mesmo formato do CRM) ou null se inválida. */
export function parseBRDateToISO(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12));
  if (
    d.getUTCFullYear() !== Number(yyyy) ||
    d.getUTCMonth() !== Number(mm) - 1 ||
    d.getUTCDate() !== Number(dd)
  ) {
    return null;
  }
  return d.toISOString();
}

export const isValidTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v.trim());

/** Máscara progressiva dd/mm/aaaa. */
export function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Máscara progressiva HH:mm. */
export function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function filledItems(draft: OrderDraft): DraftItem[] {
  return draft.items.filter((i) => i.productName.trim().length > 0);
}

export function orderTotal(draft: OrderDraft): number {
  return filledItems(draft).reduce(
    (acc, i) => acc + parseDecimal(i.quantity) * parseDecimal(i.unitPrice),
    0,
  );
}

/** Endereço do cadastro do cliente, para pré-preencher a entrega. */
export function clientAddress(client: Cliente | null): string {
  if (!client) return '';
  return [client.endereco, client.cidade && client.uf ? `${client.cidade}/${client.uf}` : client.cidade]
    .filter(Boolean)
    .join(', ');
}

/** Retorna a mensagem de erro do passo ou null se válido. */
export function validateStep(step: number, draft: OrderDraft): string | null {
  if (step === 0 && !draft.client) return 'Selecione o cliente.';
  if (step === 1) {
    const items = filledItems(draft);
    if (items.length === 0) return 'Adicione ao menos um produto.';
    const bad = items.find(
      (i) => parseDecimal(i.quantity) <= 0 || parseDecimal(i.unitPrice) <= 0,
    );
    if (bad) return `Informe quantidade e valor de "${bad.productName.trim()}".`;
  }
  if (step === 2) {
    if (!parseBRDateToISO(draft.deliveryDate)) return 'Informe a data de entrega (dd/mm/aaaa).';
    if (draft.horaEntrega && !isValidTime(draft.horaEntrega)) return 'Hora inválida (use HH:mm).';
    if (!draft.endereco.trim()) return 'O endereço de entrega é obrigatório para fechar o pedido.';
  }
  if (step === 3 && !draft.paymentMethod) return 'Escolha a forma de pagamento.';
  return null;
}

export function buildOrderInput(draft: OrderDraft): CreateOrderInput {
  const client = draft.client as Cliente;
  const endereco = draft.endereco.trim();
  return {
    clientId: client.id,
    // Mesmo contrato do CRM: pedido nasce como PEDIDO (visível p/ Financeiro e Logística).
    ciclo: 'PEDIDO',
    deliveryDate: parseBRDateToISO(draft.deliveryDate),
    horaEntrega: draft.horaEntrega.trim() || null,
    localEntrega: draft.localEntrega.trim() || null,
    paymentMethod: draft.paymentMethod,
    deliveryInstructions: endereco,
    shippingAddress: {
      endereco,
      cidade: client.cidade ?? null,
      uf: client.uf ?? null,
      pais: client.pais ?? 'Brasil',
    },
    notes: draft.notes.trim() || null,
    items: filledItems(draft).map((i) => ({
      productName: i.productName.trim(),
      unit: i.unit || DEFAULT_UNIT,
      quantity: parseDecimal(i.quantity),
      unitPrice: parseDecimal(i.unitPrice),
    })),
  };
}
