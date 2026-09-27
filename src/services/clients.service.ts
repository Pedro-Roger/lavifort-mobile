import { apiClient, normalizeApiResponse } from './api';
import { Cliente, ClientsPage, ClienteStatus } from '../types';

export interface ClientsQueryFilter {
  page?: number;
  pageSize?: number;
  status?: ClienteStatus;
  search?: string;
}

export const clientsService = {
  async getClients(filter?: ClientsQueryFilter): Promise<ClientsPage> {
    const params: Record<string, string | number> = {};
    if (filter?.page !== undefined) params.page = filter.page;
    if (filter?.pageSize !== undefined) params.pageSize = filter.pageSize;
    if (filter?.status) params.status = filter.status;
    if (filter?.search) params.search = filter.search;

    const response = await apiClient.get<ClientsPage | { data: ClientsPage }>('/clients', {
      params,
    });
    return normalizeApiResponse<ClientsPage>(response.data);
  },

  async getClientById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente | { data: Cliente }>(`/clients/${id}`);
    return normalizeApiResponse<Cliente>(response.data);
  },

  async updateClient(id: string, dto: Partial<Cliente>): Promise<Cliente> {
    const response = await apiClient.patch<Cliente | { data: Cliente }>(`/clients/${id}`, dto);
    return normalizeApiResponse<Cliente>(response.data);
  },

  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },
};