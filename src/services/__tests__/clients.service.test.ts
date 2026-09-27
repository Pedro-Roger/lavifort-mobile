import { clientsService } from '../clients.service';
import { apiClient } from '../api';
import { Cliente, ClientsPage } from '../../types';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data) => {
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    return data;
  }),
}));

const mockClient = (overrides: Partial<Cliente> = {}): Cliente => ({
  id: 'c-1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@example.com',
  phone: '+598 99 123 456',
  birthdate: null,
  cpfCnpj: '12345678',
  statusLead: 'NOVO',
  origem: null,
  pais: 'Uruguay',
  cidade: 'Montevideo',
  uf: 'MO',
  endereco: null,
  observacoes: null,
  empresaId: null,
  laminaAgua: 1.5,
  qtdViveiros: 4,
  densidade: 120,
  producaoMedia: 300,
  temBercario: false,
  qtdBercarios: 0,
  volumeBercarios: 0,
  alimentadorAutomatico: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makePage = (items: Cliente[], page = 1, pageSize = 20): ClientsPage => ({
  items,
  total: items.length,
  page,
  pageSize,
});

describe('ClientsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches paged clients via GET /clients and normalizes the {data} envelope', async () => {
    const page = makePage([mockClient()]);
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: page } });

    const result = await clientsService.getClients();

    expect(apiClient.get).toHaveBeenCalledWith('/clients', { params: {} });
    expect(result).toEqual(page);
    expect(result.items).toHaveLength(1);
  });

  it('passes query params to GET /clients', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { data: makePage([], 2, 50) },
    });

    const result = await clientsService.getClients({
      page: 2,
      pageSize: 50,
      status: 'NOVO',
      search: 'ana',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/clients', {
      params: { page: 2, pageSize: 50, status: 'NOVO', search: 'ana' },
    });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
  });

  it('fetches single client by ID via GET /clients/:id', async () => {
    const client = mockClient();
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: client });

    const result = await clientsService.getClientById('c-1');
    expect(apiClient.get).toHaveBeenCalledWith('/clients/c-1');
    expect(result).toEqual(client);
  });

  it('updates client via PATCH /clients/:id', async () => {
    const updateDto = { statusLead: 'CLIENTE_ATIVO' as const };
    const updated = mockClient({ statusLead: 'CLIENTE_ATIVO' });
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await clientsService.updateClient('c-1', updateDto);
    expect(apiClient.patch).toHaveBeenCalledWith('/clients/c-1', updateDto);
    expect(result.statusLead).toBe('CLIENTE_ATIVO');
  });

  it('deletes client via DELETE /clients/:id', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({});
    await clientsService.deleteClient('c-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/clients/c-1');
  });
});