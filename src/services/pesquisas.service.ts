import { apiClient, normalizeApiResponse } from './api';
import {
  FieldSearch,
  FieldSearchInput,
  Uniformidade,
  PendingFieldSearchRecord,
} from '../types';
import { OfflineQueue } from './offline-queue';
import { generateUUID } from '../utils/uuid';

/**
 * Pesquisa de Campo (questionário de pós-larvas) — paridade com lavifort-API:
 * - GET  /pesquisas (alias /searches) — lista paginada
 * - POST /pesquisas — cria pesquisa (clienteId + larvas + maioriaLarvifort
 *   obrigatórios; uniformidades/sobrevivência opcionais)
 *
 * Offline-first: em campo sem rede, a pesquisa é gravada na fila local
 * (`savePendingSearch`) e enviada por `syncPendingSearches` quando a conexão
 * volta — mesmo padrão dos clientes (pendingClientsQueue).
 */
export const pendingSearchesQueue = new OfflineQueue<PendingFieldSearchRecord>(
  'larvifort_pending_searches'
);

export const UNIFORMIDADE_VALUES = ['OTIMA', 'BOA', 'REGULAR', 'RUIM'] as const;

const UNIFORMIDADE_LABELS: Record<Uniformidade, string> = {
  OTIMA: 'Ótima',
  BOA: 'Boa',
  REGULAR: 'Regular',
  RUIM: 'Ruim',
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function bool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  return false;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];
}

function asUniformidade(value: unknown): Uniformidade | null {
  const raw = typeof value === 'string' ? value.toUpperCase() : '';
  return UNIFORMIDADE_VALUES.includes(raw as Uniformidade)
    ? (raw as Uniformidade)
    : null;
}

/** Normaliza uma pesquisa bruta da API. Tolerante a shape aninhado/parcial. */
export function normalizeFieldSearch(raw: unknown): FieldSearch {
  const s = asObject(raw);
  const cliente = asObject(s.cliente);
  const responsavel = asObject(s.responsavel);

  return {
    id: str(s.id) ?? '',
    clienteId: str(s.clienteId) ?? '',
    clienteNome:
      str(cliente.nome) ??
      ([str(cliente.firstName), str(cliente.lastName)].filter(Boolean).join(' ') ||
        str(s.clienteNome) ||
        ''),
    dataPesquisa: str(s.dataPesquisa) ?? '',
    responsavelId: str(s.responsavelId),
    responsavelNome: str(responsavel.nome) ?? str(responsavel.firstName) ?? null,
    larvas: strArray(s.larvas),
    maioriaLarvifort: bool(s.maioriaLarvifort),
    parouLarvifort: bool(s.parouLarvifort),
    motivosSaida: strArray(s.motivosSaida),
    outroMotivo: str(s.outroMotivo),
    uniformidadeBercario: asUniformidade(s.uniformidadeBercario),
    uniformidadeCultivo: asUniformidade(s.uniformidadeCultivo),
    sobrevBercario: num(s.sobrevBercario),
    sobrevCultivo: num(s.sobrevCultivo),
    resultadosUltimoCiclo: str(s.resultadosUltimoCiclo),
    observacoes: str(s.observacoes),
    createdAt: str(s.createdAt) ?? '',
    updatedAt: str(s.updatedAt) ?? '',
  };
}

function normalizeSearchList(raw: unknown): FieldSearch[] {
  const envelope = asObject(raw);
  const source =
    'data' in envelope && envelope.data ? asObject(envelope.data) : envelope;

  const items = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source)
      ? source
      : [];
  return items.map(normalizeFieldSearch);
}

export const pesquisasService = {
  /** Lista pesquisas (com filtros opcionais do FindPesquisasQueryDto). */
  async getSearches(params?: {
    clienteId?: string;
    responsavelId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FieldSearch[]> {
    const query: Record<string, string> = {};
    if (params?.clienteId) query.clienteId = params.clienteId;
    if (params?.responsavelId) query.responsavelId = params.responsavelId;
    if (params?.startDate) query.startDate = params.startDate;
    if (params?.endDate) query.endDate = params.endDate;

    const response = await apiClient.get<unknown>('/pesquisas', { params: query });
    return normalizeSearchList(response.data);
  },

  /** Cria a pesquisa na API (POST /pesquisas). Chame quando houver conexão. */
  async createSearch(input: FieldSearchInput): Promise<FieldSearch> {
    const response = await apiClient.post<unknown>('/pesquisas', input);
    return normalizeFieldSearch(normalizeApiResponse(response.data));
  },

  /**
   * Offline-first: grava a pesquisa na fila local imediatamente.
   */
  async savePendingSearch(
    input: FieldSearchInput,
    clientName: string
  ): Promise<PendingFieldSearchRecord> {
    const record: PendingFieldSearchRecord = {
      id: generateUUID(),
      input,
      clientName,
      createdAt: new Date().toISOString(),
    };
    await pendingSearchesQueue.enqueue(record);
    return record;
  },

  /** Pesquisas aguardando envio (exibidas com badge "pendente"). */
  async getPendingSearches(): Promise<PendingFieldSearchRecord[]> {
    const all = await pendingSearchesQueue.getAll();
    return all.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  /**
   * Drena a fila local: POST /pesquisas para cada registro pendente.
   * 400/422 (payload definitivamente inválido) descarta o registro.
   */
  async syncPendingSearches(): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingSearches();
    let synced = 0;
    let failed = 0;

    for (const record of pending) {
      try {
        await this.createSearch(record.input);
        await pendingSearchesQueue.remove(record.id);
        synced += 1;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 422) {
          await pendingSearchesQueue.remove(record.id);
        }
        failed += 1;
      }
    }

    return { synced, failed };
  },

  /**
   * Lista combinada (remotas + pendentes locais) para a UI — a lista nunca
   * bloqueia por rede; pendentes aparecem com badge.
   */
  async getSearchesWithPending(params?: {
    clienteId?: string;
    responsavelId?: string;
  }): Promise<{ remote: FieldSearch[]; pending: PendingFieldSearchRecord[] }> {
    const [remote, pending] = await Promise.all([
      this.getSearches(params).catch(() => [] as FieldSearch[]),
      this.getPendingSearches(),
    ]);
    return { remote, pending };
  },
};

export { UNIFORMIDADE_LABELS };
