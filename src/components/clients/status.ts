import { ClienteStatus } from '@/types';

export interface ClientStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

/**
 * Mapa semántico de status de lead. Colores coherentes con la paleta del
 * theme (slate/neutral, amber, sky/brand, emerald) sin gradientes.
 */
export const CLIENT_STATUS_CONFIG: Record<ClienteStatus, ClientStatusConfig> = {
  NOVO: {
    label: 'Nuevo',
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
  },
  SEM_CONTATO: {
    label: 'Sin contacto',
    bg: '#fef3c7',
    text: '#b45309',
    border: '#fcd34d',
  },
  EM_NEGOCIACAO: {
    label: 'En negociación',
    bg: '#e0f2fe',
    text: '#0369a1',
    border: '#7dd3fc',
  },
  CLIENTE_ATIVO: {
    label: 'Cliente activo',
    bg: '#d1fae5',
    text: '#047857',
    border: '#6ee7b7',
  },
};