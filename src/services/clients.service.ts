import { apiClient, normalizeApiResponse } from './api';
import { Cliente, ClientsPage, ClienteStatus, CreateClientInput, PendingClientRecord } from '../types';
import { OfflineQueue } from './offline-queue';
import { generateUUID } from '../utils/uuid';

export interface ClientsQueryFilter {
  page?: number;
  pageSize?: number;
  status?: ClienteStatus;
  search?: string;
}

/** Fila local de clientes criados offline, aguardando POST /clients. */
export const pendingClientsQueue = new OfflineQueue<PendingClientRecord>(
  'larvifort_pending_clients'
);

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function bool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  return false;
}

/**
 * Normaliza um cliente bruto (resposta da API ou registro local) para o tipo
 * `Cliente`. Tolerante a campos ausentes — o app nunca quebra por shape.
 */
export function normalizeClient(raw: unknown): Cliente {
  const c = asObject(raw);
  const status = c.status === 'inativo' ? 'inativo' : c.status === 'ativo' ? 'ativo' : undefined;
  const statusLead = typeof c.statusLead === 'string' ? c.statusLead : 'NOVO';
  return {
    id: str(c.id) ?? '',
    firstName: str(c.firstName) ?? '',
    lastName: str(c.lastName) ?? '',
    email: str(c.email),
    phone: str(c.phone),
    birthdate: str(c.birthdate),
    cpfCnpj: str(c.cpfCnpj),
    statusLead: statusLead as Cliente['statusLead'],
    status,
    regiaoId: str(c.regiaoId),
    origem: str(c.origem),
    pais: str(c.pais),
    cidade: str(c.cidade),
    uf: str(c.uf),
    endereco: str(c.endereco),
    observacoes: str(c.observacoes),
    empresaId: str(c.empresaId),
    laminaAgua: num(c.laminaAgua),
    qtdViveiros: num(c.qtdViveiros),
    densidade: num(c.densidade),
    producaoMedia: num(c.producaoMedia),
    temBercario: bool(c.temBercario),
    qtdBercarios: num(c.qtdBercarios),
    volumeBercarios: num(c.volumeBercarios),
    alimentadorAutomatico: bool(c.alimentadorAutomatico),
    createdAt: str(c.createdAt) ?? '',
    updatedAt: str(c.updatedAt) ?? '',
  };
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
    const page = normalizeApiResponse<ClientsPage>(response.data);
    return {
      ...page,
      items: (Array.isArray(page.items) ? page.items : []).map(normalizeClient),
    };
  },

  async getClientById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente | { data: Cliente }>(`/clients/${id}`);
    return normalizeClient(normalizeApiResponse(response.data));
  },

  async updateClient(id: string, dto: Partial<Cliente>): Promise<Cliente> {
    const response = await apiClient.patch<Cliente | { data: Cliente }>(`/clients/${id}`, dto);
    return normalizeClient(normalizeApiResponse(response.data));
  },

  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },

  /**
   * Cria um cliente na API (POST /clients). Chame quando houver conexão.
   */
  async createClient(input: CreateClientInput): Promise<Cliente> {
    const response = await apiClient.post<Cliente | { data: Cliente }>('/clients', input);
    return normalizeClient(normalizeApiResponse(response.data));
  },

  /**
   * Offline-first: registra o cliente na fila local imediatamente.
   * O envio acontece em `syncPendingClients` quando a conexão voltar.
   */
  async savePendingClient(input: CreateClientInput): Promise<PendingClientRecord> {
    const record: PendingClientRecord = {
      id: generateUUID(),
      input,
      clientName: `${input.firstName} ${input.lastName}`.trim(),
      createdAt: new Date().toISOString(),
    };
    await pendingClientsQueue.enqueue(record);
    return record;
  },

  /** Clientes aguardando envio (exibidos na carteira com badge "pendente"). */
  async getPendingClients(): Promise<PendingClientRecord[]> {
    const all = await pendingClientsQueue.getAll();
    return all.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  /**
   * Drena a fila local: POST /clients para cada registro pendente.
   * Sucesso remove da fila (o cliente passa a vir do GET normal).
   */
  async syncPendingClients(): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingClients();
    let synced = 0;
    let failed = 0;

    for (const record of pending) {
      try {
        await this.createClient(record.input);
        await pendingClientsQueue.remove(record.id);
        synced += 1;
      } catch (err: unknown) {
        // Erro de validação (400/422): o payload é definitivamente inválido —
        // descartar para não travar a fila para sempre.
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 422) {
          await pendingClientsQueue.remove(record.id);
          failed += 1;
          continue;
        }
        failed += 1;
      }
    }

    return { synced, failed };
  },
};
