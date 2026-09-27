import { stockService } from '../stock.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data: unknown) => {
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as { data: unknown }).data;
    }
    return data;
  }),
}));

describe('StockService', () => {
  const mockStocks = [
    {
      id: 's-1',
      productId: 'p-1',
      unitId: 'u-1',
      productName: 'Camarão 7g',
      unit: 'kg',
      unitName: 'Quilograma',
      locationName: 'Câmara Fria',
      available: 120,
      reserved: 10,
      blocked: 0,
      updatedAt: '2026-09-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes envelope {data} and returns availability via GET /stock/availability', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockStocks } });

    const result = await stockService.getAvailability();

    expect(apiClient.get).toHaveBeenCalledWith('/stock/availability', { params: {} });
    expect(result).toEqual(mockStocks);
  });

  it('passes availability query params to GET /stock/availability', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockStocks });

    const result = await stockService.getAvailability({
      productId: 'p-1',
      unitId: 'u-1',
      locationId: 'l-1',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/stock/availability', {
      params: { productId: 'p-1', unitId: 'u-1', locationId: 'l-1' },
    });
    expect(result).toEqual(mockStocks);
  });

  it('omits undefined query params', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockStocks });

    await stockService.getAvailability({ productId: 'p-1' });

    expect(apiClient.get).toHaveBeenCalledWith('/stock/availability', {
      params: { productId: 'p-1' },
    });
  });

  it('returns an empty array when response is not an array', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: {} } });

    const result = await stockService.getAvailability();
    expect(result).toEqual([]);
  });

  it('creates a movement via POST /stock/movements', async () => {
    const input = {
      productId: 'p-1',
      stockLocationId: 'l-1',
      type: 'ENTRADA' as const,
      quantity: 50,
      reason: 'Reposición',
    };
    const created = { id: 'm-1', ...input };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: created });

    const result = await stockService.createMovement(input);

    expect(apiClient.post).toHaveBeenCalledWith('/stock/movements', input);
    expect(result).toEqual(created);
  });
});
