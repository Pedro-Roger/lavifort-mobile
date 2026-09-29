import { apiClient, normalizeApiResponse } from './api';
import { Region, Cliente } from '../types';

/**
 * Regiões de atuação da vendedora.
 *
 * Endpoint: GET /regions (paridade com o backend). Como a Task 1.1 (backend)
 * ainda pode não expor a rota, o service é resiliente: em falha de rede,
 * resposta vazia ou shape desconhecido, cai para `DEFAULT_REGIONS` — a carteira
 * e o check-in funcionam offline/simplificados mesmo antes do endpoint existir.
 */
export const DEFAULT_REGIONS: Region[] = [
  {
    id: 'reg-vale-do-ribeira',
    nome: 'Polo Vale do Ribeira',
    ufs: ['CE'],
    cidades: [],
    centerLat: -3.0,
    centerLng: -39.2,
    radiusKm: 160,
  },
  {
    id: 'reg-oeste',
    nome: 'Polo Oeste',
    ufs: ['CE'],
    cidades: [],
    centerLat: -4.1,
    centerLng: -40.4,
    radiusKm: 160,
  },
  {
    id: 'reg-litoral-leste',
    nome: 'Litoral Leste',
    ufs: ['CE'],
    cidades: ['Aracati', 'Cascavel', 'Beberibe', 'Fortim', 'Icapuí'],
    centerLat: -4.3,
    centerLng: -37.9,
    radiusKm: 140,
  },
  {
    id: 'reg-morada-nova',
    nome: 'Morada Nova',
    ufs: ['CE'],
    cidades: ['Morada Nova', 'Limoeiro do Norte', 'Russas'],
    centerLat: -5.1,
    centerLng: -38.4,
    radiusKm: 120,
  },
];

function isRegionCandidate(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nullableNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Normaliza uma região bruta da API com fallbacks defensivos. */
function normalizeRegion(raw: unknown): Region | null {
  if (!isRegionCandidate(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const nome = typeof raw.nome === 'string' ? raw.nome : '';
  if (!id || !nome) return null;

  return {
    id,
    nome,
    ufs: strList(raw.ufs ?? raw.uf ?? raw.estados),
    cidades: strList(raw.cidades ?? raw.cities),
    centerLat: nullableNum(raw.centerLat ?? raw.latitude ?? raw.lat),
    centerLng: nullableNum(raw.centerLng ?? raw.longitude ?? raw.lng),
    radiusKm: nullableNum(raw.radiusKm ?? raw.radius) ?? 100,
    salesRepRegionId:
      typeof raw.salesRepRegionId === 'string' ? raw.salesRepRegionId : undefined,
    descricao: raw.descricao == null ? null : String(raw.descricao),
    vendedoraId: raw.vendedoraId == null ? null : String(raw.vendedoraId),
    ativa: typeof raw.ativa === 'boolean' ? raw.ativa : undefined,
  };
}

function normalizeRegions(raw: unknown): Region[] {
  const envelope = normalizeApiResponse<unknown>(raw);
  const source =
    envelope &&
    typeof envelope === 'object' &&
    !Array.isArray(envelope) &&
    'items' in envelope &&
    Array.isArray((envelope as { items: unknown[] }).items)
      ? (envelope as { items: unknown[] }).items
      : envelope;

  const list = Array.isArray(source) ? source : [];
  const regions = list.map(normalizeRegion).filter((r): r is Region => r !== null);
  return regions.length > 0 ? regions : DEFAULT_REGIONS;
}

export const regionsService = {
  /**
   * Lista regiões. Em falha/offline cai para a lista default.
   */
  async getRegions(): Promise<Region[]> {
    try {
      const response = await apiClient.get<unknown[]>('/regions');
      return normalizeRegions(response.data);
    } catch {
      return DEFAULT_REGIONS;
    }
  },

  async getRegionById(id: string): Promise<Region | undefined> {
    const regions = await this.getRegions();
    return regions.find((r) => r.id === id);
  },

  /**
   * Verifica se um cliente pertence à região. Prioriza o vínculo real
   * `client.regiaoId === region.id`; senão, caí para uf/cidade.
   */
  clientBelongsToRegion(region: Region, client: Cliente): boolean {
    if (client.regiaoId && region.id === client.regiaoId) return true;
    const uf = (client.uf ?? '').trim().toUpperCase();
    if (uf && region.ufs.map((r) => r.toUpperCase()).includes(uf)) return true;
    const cidade = (client.cidade ?? '').trim().toLowerCase();
    if (cidade && region.cidades.some((c) => c.toLowerCase() === cidade)) return true;
    return false;
  },

  /**
   * Cliente ativo (status operacional real do backend).
   * Ausência de status (undefined) é tratada como ativo (backward-safe).
   */
  isActiveClient(client: Cliente): boolean {
    return client.status !== 'inativo';
  },

  /**
   * Filtra a carteira pela região da vendedora, mantendo apenas clientes ativos.
   */
  filterClientsByRegion(region: Region, clients: Cliente[]): Cliente[] {
    return clients.filter((client) => this.clientBelongsToRegion(region, client));
  },

  /**
   * Carteira da vendedora = clientes ATIVOS que pertencem à região.
   */
  filterCarteira(region: Region, clients: Cliente[]): Cliente[] {
    return this.filterClientsByRegion(region, clients).filter((c) =>
      this.isActiveClient(c)
    );
  },
};

export { normalizeRegions };