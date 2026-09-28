import { activitiesService } from '../activities.service';
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

describe('ActivitiesService', () => {
  const mockTasks = [
    { id: 't-1', titulo: 'Visita viveiro 4', tipo: 'COMPROMISSO', confirmation: null },
    { id: 't-2', titulo: 'Revisar planilha', tipo: 'GERAL', confirmation: null },
    {
      id: 't-3',
      titulo: 'Coleta de amostras',
      tipo: 'COMPROMISSO',
      confirmation: { id: 'c-1', taskId: 't-3', confirmedAt: '2026-09-20T10:00:00Z' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns only COMPROMISSO tasks via GET /tasks', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockTasks } });

    const result = await activitiesService.getActivities();

    expect(apiClient.get).toHaveBeenCalledWith('/tasks');
    expect(result.map((t) => t.id)).toEqual(['t-1', 't-3']);
  });

  it('tolerates a flat array response (no envelope)', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTasks });

    const result = await activitiesService.getActivities();

    expect(result).toHaveLength(2);
  });

  it('confirms activity via POST /tasks/:id/confirm-activity with coords', async () => {
    const mockConfirmation = {
      id: 'c-9',
      taskId: 't-1',
      confirmedById: 'u-1',
      confirmedAt: '2026-09-27T10:00:00Z',
      latitude: -3.7319,
      longitude: -38.5267,
      accuracyMeters: 15,
      createdAt: '2026-09-27T10:00:00Z',
    };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { data: mockConfirmation } });

    const result = await activitiesService.confirmActivity('t-1', {
      latitude: -3.7319,
      longitude: -38.5267,
      accuracyMeters: 15,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/tasks/t-1/confirm-activity', {
      latitude: -3.7319,
      longitude: -38.5267,
      accuracyMeters: 15,
    });
    expect(result).toEqual(mockConfirmation);
  });

  it('propagates 409 conflict when activity is already confirmed', async () => {
    const conflict = { response: { status: 409 } };
    (apiClient.post as jest.Mock).mockRejectedValueOnce(conflict);

    await expect(
      activitiesService.confirmActivity('t-3', {
        latitude: 0,
        longitude: 0,
        accuracyMeters: 0,
      })
    ).rejects.toBe(conflict);
  });
});
