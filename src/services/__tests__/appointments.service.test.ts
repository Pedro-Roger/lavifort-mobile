import { appointmentsService } from '../appointments.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data: unknown) => {
    if (data && typeof data === 'object' && 'data' in data && !Array.isArray(data)) {
      const inner = (data as { data: unknown }).data;
      // Only unwrap if .data looks like an API envelope (array, object without string fields that match domain types)
      if (Array.isArray(inner) || (inner && typeof inner === 'object' && !('data' in inner))) {
        return inner;
      }
    }
    return data;
  }),
}));

const mockAppointments = [
  {
    id: 'a-1',
    tipo: 'REUNIAO',
    titulo: 'Reunião com cliente X',
    data: '2026-10-01',
    horario: '09:00',
    endereco: 'Fazenda São João',
    observacoes: 'Tratar do projeto de viveiro',
    clienteId: 'c-1',
    clienteName: 'Cliente X',
    empresaId: null,
    ownerId: 'u-1',
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'a-2',
    tipo: 'VISITA',
    titulo: 'Visita técnica viveiro 3',
    data: '2026-10-02',
    horario: '14:00',
    endereco: 'Viveiro 3 - Camarão',
    observacoes: null,
    clienteId: 'c-2',
    clienteName: 'Cliente Y',
    empresaId: null,
    ownerId: 'u-1',
    createdAt: '2026-09-21T10:00:00Z',
    updatedAt: '2026-09-21T10:00:00Z',
  },
];

describe('AppointmentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches appointments via GET /appointments', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAppointments });

    const result = await appointmentsService.getAppointments();

    expect(apiClient.get).toHaveBeenCalledWith('/appointments', { params: {} });
    expect(result).toHaveLength(2);
  });

  it('passes filters to GET /appointments', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAppointments });

    const result = await appointmentsService.getAppointments({
      tipo: 'REUNIAO',
      de: '2026-10-01',
      ate: '2026-10-31',
      page: 1,
      limit: 20,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/appointments', {
      params: { tipo: 'REUNIAO', de: '2026-10-01', ate: '2026-10-31', page: 1, limit: 20 },
    });
    expect(result).toHaveLength(2);
  });

  it('tolerates a flat array response (no envelope)', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAppointments });

    const result = await appointmentsService.getAppointments();

    expect(result).toHaveLength(2);
  });

  it('fetches calendar data via GET /appointments/calendario', async () => {
    const mockCalendar = [{ date: '2026-10-01', count: 3 }, { date: '2026-10-02', count: 1 }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCalendar });

    const result = await appointmentsService.getCalendar('2026-10');

    expect(apiClient.get).toHaveBeenCalledWith('/appointments/calendario', {
      params: { mes: '2026-10' },
    });
    expect(result).toHaveLength(2);
  });

  it('fetches a single appointment by ID', async () => {
    const mockAppt = mockAppointments[0];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAppt });

    const result = await appointmentsService.getAppointmentById('a-1');

    expect(apiClient.get).toHaveBeenCalledWith('/appointments/a-1');
    expect(result).toEqual(mockAppt);
  });

  it('creates an appointment via POST /appointments', async () => {
    const input = {
      tipo: 'REUNIAO' as const,
      titulo: 'Nova reunião',
      data: '2026-10-05',
      horario: '11:00',
      clienteId: 'c-1',
    };
    const mockCreated = { ...mockAppointments[0], id: 'a-new', titulo: 'Nova reunião' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCreated });

    const result = await appointmentsService.createAppointment(input);

    expect(apiClient.post).toHaveBeenCalledWith('/appointments', input);
    expect(result.titulo).toBe('Nova reunião');
  });

  it('updates an appointment via PATCH /appointments/:id', async () => {
    const input = { titulo: 'Reunião atualizada', horario: '10:30' };
    const mockUpdated = { ...mockAppointments[0], titulo: 'Reunião atualizada', horario: '10:30' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: mockUpdated });

    const result = await appointmentsService.updateAppointment('a-1', input);

    expect(apiClient.patch).toHaveBeenCalledWith('/appointments/a-1', input);
    expect(result.titulo).toBe('Reunião atualizada');
  });

  it('deletes an appointment via DELETE /appointments/:id', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

    await appointmentsService.deleteAppointment('a-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/appointments/a-1');
  });
});