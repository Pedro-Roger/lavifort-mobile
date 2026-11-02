import { appointmentsService } from '../appointments.service';
import { apiClient } from '../api';
import { outboxQueue } from '../sync/outbox-queue';
import { networkMonitor } from '../sync/network-monitor';

jest.mock('../api', () => ({
  apiClient: { get: jest.fn(), patch: jest.fn() },
  normalizeApiResponse: jest.fn((d) => (d && typeof d === 'object' && 'data' in d ? d.data : d)),
}));
jest.mock('../sync/outbox-queue', () => ({
  outboxQueue: { enqueue: jest.fn(), getAll: jest.fn() },
}));
jest.mock('../sync/network-monitor', () => ({ networkMonitor: { isConnected: true } }));

const input = { latitude: -4.5, longitude: -37.7, accuracyMeters: 9, clientTimestamp: '2026-11-01T10:00:00.000Z' };
const setOnline = (v: boolean) => ((networkMonitor as { isConnected: boolean }).isConnected = v);

describe('appointmentsService.concludeVisit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOnline(true);
    (outboxQueue.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('online: PATCH /appointments/:id/checkin com o body do contrato', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { id: 'a1', concludedAt: 'x' } });
    const r = await appointmentsService.concludeVisit('a1', input);
    expect(apiClient.patch).toHaveBeenCalledWith('/appointments/a1/checkin', input);
    expect(r).toEqual({ status: 'SYNCED', appointment: { id: 'a1', concludedAt: 'x' } });
    expect(outboxQueue.enqueue).not.toHaveBeenCalled();
  });

  it('offline: enfileira na outbox com coords e clientTimestamp', async () => {
    setOnline(false);
    const r = await appointmentsService.concludeVisit('a1', input);
    expect(r).toEqual({ status: 'QUEUED' });
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(outboxQueue.enqueue).toHaveBeenCalledWith({
      entityId: 'a1',
      entityType: 'APPOINTMENT',
      action: 'CHECKIN',
      payload: input,
    });
  });

  it('falha de rede (sem response) enfileira; não duplica se já pendente', async () => {
    (apiClient.patch as jest.Mock).mockRejectedValue(new Error('Network Error'));
    (outboxQueue.getAll as jest.Mock).mockResolvedValue([
      { entityId: 'a1', entityType: 'APPOINTMENT', action: 'CHECKIN', payload: input, createdAt: 'c' },
    ]);
    expect(await appointmentsService.concludeVisit('a1', input)).toEqual({ status: 'QUEUED' });
    expect(outboxQueue.enqueue).not.toHaveBeenCalled();
  });

  it('409 é idempotente (SYNCED)', async () => {
    (apiClient.patch as jest.Mock).mockRejectedValueOnce({ response: { status: 409 } });
    expect(await appointmentsService.concludeVisit('a1', input)).toEqual({ status: 'SYNCED', appointment: null });
  });

  it('outros erros HTTP propagam', async () => {
    (apiClient.patch as jest.Mock).mockRejectedValueOnce({ response: { status: 403 } });
    await expect(appointmentsService.concludeVisit('a1', input)).rejects.toBeDefined();
  });

  it('getPendingCheckins mapeia id → clientTimestamp', async () => {
    (outboxQueue.getAll as jest.Mock).mockResolvedValue([
      { entityId: 'a1', entityType: 'APPOINTMENT', action: 'CHECKIN', payload: input, createdAt: 'c' },
      { entityId: 't1', entityType: 'TASK', action: 'UPDATE', payload: {}, createdAt: 'c' },
    ]);
    expect(await appointmentsService.getPendingCheckins()).toEqual({ a1: input.clientTimestamp });
  });
});
