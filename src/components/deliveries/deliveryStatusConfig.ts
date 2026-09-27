import { DeliveryStatus } from '@/services/deliveries.service';

export interface DeliveryStatusConfig {
  label: string;
  actionLabel: string;
  bg: string;
  text: string;
  border: string;
}

/**
 * Mapa de estados de entrega. Colores semánticos coherentes con la palette
 * status/neutral del theme (sin gradientes ni decoración).
 */
export const deliveryStatusConfig: Record<DeliveryStatus, DeliveryStatusConfig> = {
  AGUARDANDO_MOTORISTA: {
    label: 'Aguardando Motorista',
    actionLabel: 'Definir Motorista',
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
  },
  MOTORISTA_DEFINIDO: {
    label: 'Motorista Definido',
    actionLabel: 'Iniciar Entrega',
    bg: '#e0f2fe',
    text: '#0369a1',
    border: '#7dd3fc',
  },
  SAIU_ENTREGA: {
    label: 'Saiu para Entrega',
    actionLabel: 'Em Rota',
    bg: '#fef3c7',
    text: '#b45309',
    border: '#fcd34d',
  },
  EM_ROTA: {
    label: 'Em Rota',
    actionLabel: 'Marcar Entregue',
    bg: '#c7d2fe',
    text: '#3730a3',
    border: '#a5b4fc',
  },
  ENTREGUE: {
    label: 'Entregue',
    actionLabel: 'Entregue',
    bg: '#d1fae5',
    text: '#047857',
    border: '#6ee7b7',
  },
};