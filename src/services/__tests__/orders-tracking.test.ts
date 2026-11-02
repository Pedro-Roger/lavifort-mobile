import { ordersService, extractApiError } from '../orders.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
  normalizeApiResponse: jest.fn((d) => (d && typeof d === 'object' && 'data' in d ? d.data : d)),
}));

describe('ordersService tracking/close', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getOrderTracking chama GET /orders/:id/tracking e garante setores array', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { orderId: 'o1', orderNumber: '10', setores: [{ setor: 'Financeiro', coluna: 'Aprovado' }] },
    });
    const r = await ordersService.getOrderTracking('o1');
    expect(apiClient.get).toHaveBeenCalledWith('/orders/o1/tracking');
    expect(r.setores[0].coluna).toBe('Aprovado');

    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { orderId: 'o2' } });
    expect((await ordersService.getOrderTracking('o2')).setores).toEqual([]);
  });

  it('closeOrder chama POST /orders/:id/close', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'o1', operationalStatus: 'FECHADO' } });
    const r = await ordersService.closeOrder('o1');
    expect(apiClient.post).toHaveBeenCalledWith('/orders/o1/close', {});
    expect(r.operationalStatus).toBe('FECHADO');
  });

  it('createOrder envia o payload completo', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'o1' } });
    const input = { clientId: 'c', horaEntrega: '08:00', paymentMethod: 'PIX', items: [] };
    await ordersService.createOrder(input);
    expect(apiClient.post).toHaveBeenCalledWith('/orders', input);
  });

  it('extractApiError usa a mensagem do servidor', () => {
    expect(extractApiError({ response: { data: { message: 'faltam dados (endereço)' } } }, 'x')).toBe('faltam dados (endereço)');
    expect(extractApiError({ response: { data: { message: ['a', 'b'] } } }, 'x')).toBe('a, b');
    expect(extractApiError(new Error('n'), 'fallback')).toBe('fallback');
  });
});
