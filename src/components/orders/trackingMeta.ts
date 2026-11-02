import { OrderTrackingSetor, TrackingSetor } from '@/types';

export const SETOR_ORDER: TrackingSetor[] = ['Comercial', 'Financeiro', 'Logística'];

export interface TrackingTone {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const TONES: Record<string, TrackingTone> = {
  done: { bg: '#d1fae5', text: '#047857', border: '#6ee7b7', dot: '#10b981' },
  progress: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', dot: '#0284c7' },
  wait: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', dot: '#f59e0b' },
  idle: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', dot: '#94a3b8' },
};

/** Cor por etapa a partir do nome da coluna (heurística; coluna vem livre do kanban). */
export function toneForColumn(coluna: string | null): TrackingTone {
  if (!coluna) return TONES.idle;
  const c = coluna.toLowerCase();
  if (/(entreg|conclu|aprovad|pago|finaliz|faturad)/.test(c)) return TONES.done;
  if (/(rota|andamento|separa|carreg|an[aá]lise|process)/.test(c)) return TONES.progress;
  if (/(pend|aguard|novo|abert|fila|backlog)/.test(c)) return TONES.wait;
  return TONES.progress;
}

/** Garante os 3 setores na ordem, mesmo se o backend omitir algum. */
export function orderedSetores(setores: OrderTrackingSetor[]): OrderTrackingSetor[] {
  return SETOR_ORDER.map(
    (s) =>
      setores.find((x) => x.setor === s) ?? {
        setor: s,
        projetoId: null,
        coluna: null,
        columnId: null,
        taskId: null,
        desde: null,
      },
  );
}
