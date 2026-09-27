import { apiClient, normalizeApiResponse } from './api';
import {
  Order,
  OrderStats,
  CreateOrderInput,
  OrderStatus,
  OrderPhase,
  Cliente,
} from '../types';

export interface OrdersQueryFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  phase?: OrderPhase;
}

/**
 * Service de pedidos — paridad absoluta con la integración REST de lavifort-API.
 * Todas las operaciones son network/endpoint iguales a los contratos del web.
 */
export const ordersService = {
  async getOrders(filter?: OrdersQueryFilter): Promise<Order[]> {
    const params: Record<string, string | number> = {};
    if (filter?.page) params.page = filter.page;
    if (filter?.limit) params.limit = filter.limit;
    if (filter?.search) params.search = filter.search;
    if (filter?.status) params.status = filter.status;
    if (filter?.phase) params.phase = filter.phase;

    const response = await apiClient.get<Order[] | { data: Order[] }>('/orders', { params });
    const data = normalizeApiResponse<Order[]>(response.data);
    return Array.isArray(data) ? data : [];
  },

  async getOrderStats(): Promise<OrderStats> {
    const response = await apiClient.get<OrderStats | { data: OrderStats }>('/orders/stats');
    return normalizeApiResponse<OrderStats>(response.data);
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<Order | { data: Order }>('/orders', input);
    return normalizeApiResponse<Order>(response.data);
  },

  async updateOrder(id: string, updates: Partial<CreateOrderInput>): Promise<Order> {
    const response = await apiClient.patch<Order | { data: Order }>(`/orders/${id}`, updates);
    return normalizeApiResponse<Order>(response.data);
  },

  async cancelOrder(id: string, reason: string): Promise<Order> {
    const response = await apiClient.put<Order | { data: Order }>(`/orders/${id}/cancel`, {
      reason,
    });
    return normalizeApiResponse<Order>(response.data);
  },

  async deleteOrder(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  },

  /** Búsqueda de clientes candidatos para el formulario de pedido. */
  async getClients(search?: string): Promise<Cliente[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const response = await apiClient.get<
      Cliente[] | { data: Cliente[] } | { items: Cliente[] }
    >('/clients', { params });

    const data = normalizeApiResponse<Cliente[] | { items: Cliente[] }>(response.data);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  },
};