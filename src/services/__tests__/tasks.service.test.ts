import { tasksService } from '../tasks.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
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

describe('TasksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches tasks with filters via GET /tasks', async () => {
    const mockTasks = [{ id: 't-1', titulo: 'Tarefa 1', status: 'BACKLOG', projetoId: 'p-1' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTasks });

    const result = await tasksService.getTasks({ projetoId: 'p-1', status: 'BACKLOG' });

    expect(apiClient.get).toHaveBeenCalledWith('/tasks', {
      params: { projetoId: 'p-1', status: 'BACKLOG' },
    });
    expect(result).toEqual(mockTasks);
  });

  it('fetches single task by ID via GET /tasks/:id', async () => {
    const mockTask = { id: 't-1', titulo: 'Tarefa 1' };
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTask });

    const result = await tasksService.getTaskById('t-1');
    expect(apiClient.get).toHaveBeenCalledWith('/tasks/t-1');
    expect(result).toEqual(mockTask);
  });

  it('creates task via POST /tasks', async () => {
    const createDto = { titulo: 'Nova Tarefa', projetoId: 'p-1' };
    const created = { id: 't-2', ...createDto, status: 'BACKLOG', progresso: 0 };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: created });

    const result = await tasksService.createTask(createDto);
    expect(apiClient.post).toHaveBeenCalledWith('/tasks', createDto);
    expect(result).toEqual(created);
  });

  it('updates task via PATCH /tasks/:id', async () => {
    const updateDto = { titulo: 'Atualizado' };
    const updated = { id: 't-1', titulo: 'Atualizado' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await tasksService.updateTask('t-1', updateDto);
    expect(apiClient.patch).toHaveBeenCalledWith('/tasks/t-1', updateDto);
    expect(result).toEqual(updated);
  });

  it('updates status via PATCH /tasks/:id/status', async () => {
    const updated = { id: 't-1', status: 'EM_ANDAMENTO' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await tasksService.updateStatus('t-1', 'EM_ANDAMENTO');
    expect(apiClient.patch).toHaveBeenCalledWith('/tasks/t-1/status', { status: 'EM_ANDAMENTO' });
    expect(result).toEqual(updated);
  });

  it('updates progress via PATCH /tasks/:id/progresso', async () => {
    const updated = { id: 't-1', progresso: 75 };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: updated });

    const result = await tasksService.updateProgresso('t-1', 75);
    expect(apiClient.patch).toHaveBeenCalledWith('/tasks/t-1/progresso', { progresso: 75 });
    expect(result).toEqual(updated);
  });

  it('deletes task via DELETE /tasks/:id', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({});
    await tasksService.deleteTask('t-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/tasks/t-1');
  });

  it('fetches projects via GET /tasks/projects', async () => {
    const mockProjects = [{ id: 'p-1', nome: 'Comercial' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockProjects });

    const result = await tasksService.getProjects();
    expect(apiClient.get).toHaveBeenCalledWith('/tasks/projects');
    expect(result).toEqual(mockProjects);
  });

  it('transfers task via POST /tasks/:id/transfer', async () => {
    const transferDto = { targetProjetoId: 'p-2' };
    const transferred = { id: 't-1', projetoId: 'p-2' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: transferred });

    const result = await tasksService.transferTask('t-1', transferDto);
    expect(apiClient.post).toHaveBeenCalledWith('/tasks/t-1/transfer', transferDto);
    expect(result).toEqual(transferred);
  });
});
