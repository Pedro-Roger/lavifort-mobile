import { ordersService } from '../orders.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data) => {
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    return data;
  }),
}));

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches orders with filters via GET /orders', async () => {
    const mockOrders = [{ id: 'o-1', orderNumber: 'P-0001', clientName: 'Cliente A' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockOrders } });

    const result = await ordersService.getOrders({ page: 1, limit: 25, search: 'A', phase: 'ABERTO' });

    expect(apiClient.get).toHaveBeenCalledWith('/orders', {
      params: { page: 1, limit: 25, search: 'A', phase: 'ABERTO' },
    });
    expect(result).toEqual(mockOrders);
  });

  it('handles a plain array body (no envelope) from GET /orders', async () => {
    const mockOrders = [{ id: 'o-9', orderNumber: 'P-0009' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockOrders });

    const result = await ordersService.getOrders();
    expect(result).toEqual(mockOrders);
  });

  it('fetches order stats via GET /orders/stats', async () => {
    const mockStats = { totalOrders: 5, totalRevenue: 1000, averageTicket: 200 };
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockStats });

    const result = await ordersService.getOrderStats();
    expect(apiClient.get).toHaveBeenCalledWith('/orders/stats');
    expect(result).toEqual(mockStats);
  });

  it('creates an order via POST /orders with the body', async () => {
    const input = {
      clientId: 'c-1',
      items: [
        { productName: 'Camarón', quantity: 2, unitPrice: 150, unit: 'kg' },
      ],
    };
    const created = { id: 'o-2', ...input, status: 'ORCAMENTO', phase: 'DRAFT' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { data: created } });

    const result = await ordersService.createOrder(input);
    expect(apiClient.post).toHaveBeenCalledWith('/orders', input);
    expect(result).toEqual(created);
  });

  it('updates an order via PATCH /orders/:id', async () => {
    const updates = { notes: 'Actualizado' };
    const updated = { id: 'o-1', notes: 'Actualizado' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await ordersService.updateOrder('o-1', updates);
    expect(apiClient.patch).toHaveBeenCalledWith('/orders/o-1', updates);
    expect(result).toEqual(updated);
  });

  it('cancels an order via PUT /orders/:id/cancel with reason', async () => {
    const cancelled = { id: 'o-1', phase: 'CANCELLED' };
    (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: cancelled });

    const result = await ordersService.cancelOrder('o-1', 'Cliente canceló');
    expect(apiClient.put).toHaveBeenCalledWith('/orders/o-1/cancel', { reason: 'Cliente canceló' });
    expect(result).toEqual(cancelled);
  });

  it('deletes an order via DELETE /orders/:id', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({});
    await ordersService.deleteOrder('o-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/orders/o-1');
  });

  it('fetches client candidates via GET /clients?search=', async () => {
    const candidates = [{ id: 'c-1', firstName: 'Pedro', lastName: 'Rog' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: candidates });

    const result = await ordersService.getClients('Pedro');
    expect(apiClient.get).toHaveBeenCalledWith('/clients', { params: { search: 'Pedro' } });
    expect(result).toEqual(candidates);
  });
});