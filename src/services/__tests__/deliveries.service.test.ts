import { deliveriesService } from '../deliveries.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data) => {
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    return data;
  }),
}));

describe('DeliveriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes envelope {data} when fetching deliveries via GET /deliveries', async () => {
    const mockDeliveries = [
      {
        id: 'd-1',
        orderId: 'o-1',
        orderNumber: 'PED-001',
        clientName: 'Cliente A',
        driverName: 'João',
        vehiclePlate: 'ABC-1234',
        route: 'Rota 1',
        estimatedAt: '2026-09-27T10:00:00Z',
        status: 'AGUARDANDO_MOTORISTA',
        problem: null,
      },
    ];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockDeliveries } });

    const result = await deliveriesService.getDeliveries();

    expect(apiClient.get).toHaveBeenCalledWith('/deliveries');
    expect(result).toEqual(mockDeliveries);
  });

  it('returns empty array when response is not an array', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: null } });

    const result = await deliveriesService.getDeliveries();

    expect(result).toEqual([]);
  });

  it('calls PATCH /deliveries/:id/status with { status } on updateDeliveryStatus', async () => {
    const updated = { id: 'd-1', status: 'MOTORISTA_DEFINIDO' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await deliveriesService.updateDeliveryStatus('d-1', 'MOTORISTA_DEFINIDO');

    expect(apiClient.patch).toHaveBeenCalledWith('/deliveries/d-1/status', {
      status: 'MOTORISTA_DEFINIDO',
      problem: undefined,
    });
    expect(result).toEqual(updated);
  });

  it('sends problem when advancing to a problem state', async () => {
    const updated = { id: 'd-1', status: 'EM_ROTA', problem: 'Tráfico' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await deliveriesService.updateDeliveryStatus('d-1', 'EM_ROTA', 'Tráfico');

    expect(apiClient.patch).toHaveBeenCalledWith('/deliveries/d-1/status', {
      status: 'EM_ROTA',
      problem: 'Tráfico',
    });
    expect(result).toEqual(updated);
  });
});