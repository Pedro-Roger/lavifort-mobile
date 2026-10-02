import { OrderPhase, OrderStatus } from '@/types';

/**
 * Config de badges de fase y status de pedidos — alineada con el web
 * (palette neutra + brand, sin decoración).
 */
export const PHASE_CONFIG: Record<
  OrderPhase,
  { bg: string; text: string; border: string; label: string }
> = {
  DRAFT: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Rascunho' },
  ABERTO: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', label: 'Aberto' },
  PENDING: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'Pendente' },
  APROVADO: { bg: '#d1fae5', text: '#047857', border: '#6ee7b7', label: 'Aprovado' },
  FATURADO: { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc', label: 'Faturado' },
  ENTREGUE: { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4', label: 'Entregue' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: 'Cancelado' },
};

export const STATUS_CONFIG: Record<
  OrderStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  ORCAMENTO: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Orçamento' },
  PEDIDO: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', label: 'Pedido' },
};

/** Formato moneda con coma decimal (miles con punto). */
export function formatMoney(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) value = 0;
  return `$${value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Fecha legible (o la cadena cruda si no parsea). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatQuantity(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return String(value).replace('.', ',');
}