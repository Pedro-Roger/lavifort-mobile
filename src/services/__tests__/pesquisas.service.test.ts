import { pesquisasService, normalizeFieldSearch } from '../pesquisas.service';
import { localStorage } from '../../core/storage/local-storage';
import { apiClient } from '../api';
import { FieldSearchInput } from '../../types';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data: unknown) => {
    if (data && typeof data === 'object' && 'data' in (data as object)) {
      return (data as { data: unknown }).data;
    }
    return data;
  }),
}));

jest.mock('../../core/storage/local-storage', () => ({
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../utils/uuid', () => ({
  generateUUID: jest.fn(() => 'search-uuid-1'),
}));

const validInput: FieldSearchInput = {
  clienteId: 'c-1',
  dataPesquisa: '2026-10-01',
  larvas: ['Larvifort Gold'],
  maioriaLarvifort: true,
  parouLarvifort: false,
  motivosSaida: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
});

describe('pesquisasService — GET /pesquisas', () => {
  it('fetches and normalizes the paginated list (items envelope)', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 's1',
            clienteId: 'c-1',
            cliente: { firstName: 'Ana', lastName: 'Pérez' },
            dataPesquisa: '2026-10-01',
            larvas: ['Larvifort Gold'],
            maioriaLarvifort: true,
            uniformidadeBercario: 'OTIMA',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });

    const list = await pesquisasService.getSearches();

    expect(apiClient.get).toHaveBeenCalledWith('/pesquisas', { params: {} });
    expect(list).toHaveLength(1);
    expect(list[0].clienteNome).toBe('Ana Pérez');
    expect(list[0].uniformidadeBercario).toBe('OTIMA');
  });

  it('passes filters as query params', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { items: [] } });

    await pesquisasService.getSearches({ clienteId: 'c-9', startDate: '2026-09-01' });

    expect(apiClient.get).toHaveBeenCalledWith('/pesquisas', {
      params: { clienteId: 'c-9', startDate: '2026-09-01' },
    });
  });

  it('returns [] on network failure (getSearchesWithPending keeps UI alive)', async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce([]);

    const result = await pesquisasService.getSearchesWithPending();
    expect(result.remote).toEqual([]);
    expect(result.pending).toEqual([]);
  });
});

describe('pesquisasService — criação online vs offline', () => {
  it('creates via POST /pesquisas', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { data: { id: 's-1', larvas: ['Larvifort Gold'], maioriaLarvifort: true } },
    });

    const created = await pesquisasService.createSearch(validInput);

    expect(apiClient.post).toHaveBeenCalledWith('/pesquisas', validInput);
    expect(created.id).toBe('s-1');
  });

  it('saves a pending search locally when offline', async () => {
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce([]);

    const record = await pesquisasService.savePendingSearch(validInput, 'Ana Pérez');

    expect(record).toMatchObject({
      id: 'search-uuid-1',
      clientName: 'Ana Pérez',
      input: validInput,
    });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'larvifort_pending_searches',
      expect.arrayContaining([record])
    );
  });

  it('syncs pending searches: success removes from queue', async () => {
    (localStorage.getItem as jest.Mock).mockResolvedValue([
      {
        id: 'p1',
        clientName: 'Ana Pérez',
        createdAt: '2026-10-01T10:00:00.000Z',
        input: validInput,
      },
    ]);
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 's-9' } });

    const result = await pesquisasService.syncPendingSearches();

    expect(apiClient.post).toHaveBeenCalledWith('/pesquisas', validInput);
    expect(result).toEqual({ synced: 1, failed: 0 });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'larvifort_pending_searches',
      []
    );
  });

  it('sync: validation error (400) discards the record; network error keeps it', async () => {
    (localStorage.getItem as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'p-bad', clientName: 'X', createdAt: '2026-10-01', input: validInput },
        { id: 'p-net', clientName: 'Y', createdAt: '2026-10-01', input: validInput },
      ])
      .mockResolvedValueOnce([
        { id: 'p-bad', clientName: 'X', createdAt: '2026-10-01', input: validInput },
        { id: 'p-net', clientName: 'Y', createdAt: '2026-10-01', input: validInput },
      ]);

    (apiClient.post as jest.Mock)
      .mockRejectedValueOnce({ response: { status: 400 } })
      .mockRejectedValueOnce(new Error('network'));

    const result = await pesquisasService.syncPendingSearches();

    expect(result).toEqual({ synced: 0, failed: 2 });
    // p-bad descartado (só p-net permanece na segunda escrita da fila).
    const writes = (localStorage.setItem as jest.Mock).mock.calls.filter(
      (c) => c[0] === 'larvifort_pending_searches'
    );
    const lastWrite = writes[writes.length - 1]?.[1] as Array<{ id: string }>;
    expect(lastWrite.map((r) => r.id)).toEqual(['p-net']);
  });
});

describe('normalizeFieldSearch', () => {
  it('normalizes flat fields and drops invalid uniformidade', () => {
    const s = normalizeFieldSearch({
      id: 's2',
      clienteId: 'c2',
      clienteNome: 'Fazenda Boa Esperança',
      larvas: ['Speed PL'],
      maioriaLarvifort: false,
      parouLarvifort: true,
      motivosSaida: ['Preço'],
      uniformidadeBercario: 'MAROTa',
      sobrevCultivo: '71.5',
    });

    expect(s.clienteNome).toBe('Fazenda Boa Esperança');
    expect(s.parouLarvifort).toBe(true);
    expect(s.uniformidadeBercario).toBeNull();
    expect(s.sobrevCultivo).toBe(71.5);
  });
});
