import { apiClient, normalizeApiResponse } from './api';
import { Delivery } from '../types';

export type DeliveryStatus =
  | 'AGUARDANDO_MOTORISTA'
  | 'MOTORISTA_DEFINIDO'
  | 'SAIU_ENTREGA'
  | 'EM_ROTA'
  | 'ENTREGUE';

export interface AssignDriverDTO {
  driverId: string;
  vehicleId?: string;
}

export interface UpdateDeliveryStatusDTO {
  status: DeliveryStatus;
  problem?: string;
}

export interface ProofDTO {
  [key: string]: unknown;
}

export interface DeliveryRecordDTO {
  [key: string]: unknown;
}

/**
 * Orden de avance táctico del operador. El botón de cada card avanza al
 * siguiente estado (o marca entregue cuando llega a EM_ROTA / ENTREGUE).
 */
export const DELIVERY_STATUS_FLOW: DeliveryStatus[] = [
  'AGUARDANDO_MOTORISTA',
  'MOTORISTA_DEFINIDO',
  'SAIU_ENTREGA',
  'EM_ROTA',
  'ENTREGUE',
];

export const deliveriesService = {
  async getDeliveries(): Promise<Delivery[]> {
    const response = await apiClient.get<Delivery[] | { data: Delivery[] }>('/deliveries');
    const data = normalizeApiResponse<Delivery[]>(response.data);
    return Array.isArray(data) ? data : [];
  },

  async createDelivery(orderId: string, dto: DeliveryRecordDTO): Promise<Delivery> {
    const response = await apiClient.post<Delivery | { data: Delivery }>(
      `/orders/${orderId}/delivery`,
      dto
    );
    return normalizeApiResponse<Delivery>(response.data);
  },

  async assignDriver(id: string, dto: AssignDriverDTO): Promise<Delivery> {
    const response = await apiClient.patch<Delivery | { data: Delivery }>(
      `/deliveries/${id}/assign-driver`,
      dto
    );
    return normalizeApiResponse<Delivery>(response.data);
  },

  async updateDeliveryStatus(id: string, status: DeliveryStatus, problem?: string): Promise<Delivery> {
    const response = await apiClient.patch<Delivery | { data: Delivery }>(
      `/deliveries/${id}/status`,
      { status, problem }
    );
    return normalizeApiResponse<Delivery>(response.data);
  },

  async addProof(id: string, dto: ProofDTO): Promise<Delivery> {
    const response = await apiClient.post<Delivery | { data: Delivery }>(
      `/deliveries/${id}/proof`,
      dto
    );
    return normalizeApiResponse<Delivery>(response.data);
  },
};