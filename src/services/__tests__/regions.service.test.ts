import { regionsService, DEFAULT_REGIONS, normalizeRegions } from '../regions.service';
import { apiClient } from '../api';
import { Region, Cliente } from '../../types';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data: unknown) => {
    if (data && typeof data === 'object' && 'data' in (data as object)) {
      return (data as { data: unknown }).data;
    }
    return data;
  }),
}));

const mockRegion = (overrides: Partial<Region> = {}): Region => ({
  id: 'reg-a',
  nome: 'Polo Vale do Ribeira',
  ufs: ['CE'],
  cidades: [],
  centerLat: -3.0,
  centerLng: -39.2,
  radiusKm: 160,
  ...overrides,
});

const mockClient = (overrides: Partial<Cliente> = {}): Cliente => ({
  id: 'c-1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@example.com',
  phone: null,
  birthdate: null,
  cpfCnpj: null,
  statusLead: 'NOVO',
  origem: null,
  pais: 'Brasil',
  cidade: 'Fortaleza',
  uf: 'CE',
  endereco: null,
  observacoes: null,
  empresaId: null,
  laminaAgua: 1,
  qtdViveiros: 2,
  densidade: 100,
  producaoMedia: 200,
  temBercario: false,
  qtdBercarios: 0,
  volumeBercarios: 0,
  alimentadorAutomatico: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('RegionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRegions', () => {
    it('fetches regions via GET /regions and normalizes the array', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [{ id: 'r1', nome: 'Polo Norte', ufs: ['CE'], limite: 120 }],
      });

      const regions = await regionsService.getRegions();

      expect(apiClient.get).toHaveBeenCalledWith('/regions');
      expect(regions).toHaveLength(1);
      expect(regions[0].id).toBe('r1');
      expect(regions[0].nome).toBe('Polo Norte');
    });

    it('normalizes wrapped { data: [...] } envelope', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: [{ id: 'r2', nome: 'Polo Leste', ufs: ['CE'] }] },
      });

      const regions = await regionsService.getRegions();
      expect(regions).toHaveLength(1);
      expect(regions[0].id).toBe('r2');
    });

    it('falls back to DEFAULT_REGIONS on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('offline'));

      const regions = await regionsService.getRegions();
      expect(regions).toEqual(DEFAULT_REGIONS);
    });

    it('falls back to DEFAULT_REGIONS when the payload is not an array or is empty', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      const regions = await regionsService.getRegions();
      expect(regions).toEqual(DEFAULT_REGIONS);
    });
  });

  describe('clientBelongsToRegion / filterClientsByRegion', () => {
    it('matches a client by UF', () => {
      const region = mockRegion({ ufs: ['CE'] });
      expect(regionsService.clientBelongsToRegion(region, mockClient({ uf: 'CE' }))).toBe(true);
    });

    it('matches a client by regiaoId (vínculo real) with priority over uf/cidade', () => {
      const region = mockRegion({ id: 'region-a', ufs: ['SP'], cidades: ['Curitiba'] });
      const client = mockClient({ regiaoId: 'region-a', uf: 'PR', cidade: 'Curitiba' });
      expect(regionsService.clientBelongsToRegion(region, client)).toBe(true);
    });

    it('matches a client by cidade when UF absent', () => {
      const region = mockRegion({ ufs: [], cidades: ['Aracati'] });
      expect(
        regionsService.clientBelongsToRegion(
          region,
          mockClient({ uf: null, cidade: 'Aracati' })
        )
      ).toBe(true);
    });

    it('returns false for a client outside the region', () => {
      const region = mockRegion({ ufs: ['CE'], cidades: [] });
      expect(
        regionsService.clientBelongsToRegion(region, mockClient({ uf: 'SP', cidade: 'São Paulo' }))
      ).toBe(false);
    });

    it('filters a client list to the region', () => {
      const region = mockRegion({ ufs: ['CE'] });
      const inRegion = mockClient({ id: 'c-in', uf: 'CE' });
      const out = mockClient({ id: 'c-out', uf: 'SP' });

      const filtered = regionsService.filterClientsByRegion(region, [inRegion, out]);
      expect(filtered.map((c) => c.id)).toEqual(['c-in']);
    });
  });

  describe('carteira ativa (status operacional)', () => {
    it('treats a client with undefined status as active (backward-safe)', () => {
      expect(regionsService.isActiveClient(mockClient({}))).toBe(true);
    });

    it('treats an "ativo" client as active', () => {
      expect(regionsService.isActiveClient(mockClient({ status: 'ativo' }))).toBe(true);
    });

    it('treats an "inativo" client as inactive', () => {
      expect(regionsService.isActiveClient(mockClient({ status: 'inativo' }))).toBe(false);
    });

    it('filterCarteira keeps only active clients of the region', () => {
      const region = mockRegion({ id: 'region-a', ufs: ['CE'] });
      const active = mockClient({ id: 'c-ativa', uf: 'CE', status: 'ativo' });
      const inactive = mockClient({ id: 'c-inativa', uf: 'CE', status: 'inativo' });
      const out = mockClient({ id: 'c-out', uf: 'SP', status: 'ativo' });

      const carteira = regionsService.filterCarteira(region, [active, inactive, out]);
      expect(carteira.map((c) => c.id)).toEqual(['c-ativa']);
    });
  });

  describe('getRegionById', () => {
    it('finds a region by id from the list', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [mockRegion({ id: 'reg-a' })],
      });
      const region = await regionsService.getRegionById('reg-a');
      expect(region?.id).toBe('reg-a');
    });
  });

  describe('normalizeRegions', () => {
    it('drops invalid entries and returns defaults when nothing is valid', () => {
      expect(normalizeRegions([{ id: 'x' }])).toEqual(DEFAULT_REGIONS);
    });
  });
});