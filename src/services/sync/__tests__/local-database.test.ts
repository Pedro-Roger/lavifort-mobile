import { localStorage } from '../../../core/storage/local-storage';
import { localDatabase } from '../local-database';
import { Task, Project } from '../../../types';

jest.mock('../../../core/storage/local-storage', () => ({
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('LocalDatabase', () => {
  let mockTasks: Task[];
  let mockProjects: Project[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTasks = [
      {
        id: 'task-1',
        titulo: 'Vistoria Viveiro 01',
        descricao: 'Checar salinidade e oxigênio',
        projetoId: 'proj-op',
        status: 'EM_ANDAMENTO',
        prioridade: 'ALTA',
        progresso: 50,
        responsavel: 'João Silva',
        syncStatus: 'SYNCED',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      },
      {
        id: 'task-2',
        titulo: 'Contrato Fornecedor Rações',
        descricao: 'Aprovar minuta jurídica',
        projetoId: 'proj-com',
        status: 'BACKLOG',
        prioridade: 'MEDIA',
        progresso: 0,
        responsavel: 'Maria Souza',
        syncStatus: 'SYNCED',
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z',
      },
    ];

    mockProjects = [
      {
        id: 'proj-op',
        nome: 'Operações de Campo',
        setor: 'Operações',
        descricao: 'Rotina de viveiros e manejo',
      },
      {
        id: 'proj-com',
        nome: 'Comercial e Vendas',
        setor: 'Comercial',
        descricao: 'Captação e contratos de clientes',
      },
    ];
  });

  describe('Tasks operations', () => {
    it('returns all tasks from local storage', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const tasks = await localDatabase.getTasks();
      expect(tasks).toEqual(mockTasks);
      expect(localStorage.getItem).toHaveBeenCalledWith('@larvifort:tasks');
    });

    it('returns empty array when no tasks stored', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const tasks = await localDatabase.getTasks();
      expect(tasks).toEqual([]);
    });

    it('filters tasks by projetoId and status', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const opTasks = await localDatabase.getTasks({ projetoId: 'proj-op' });
      expect(opTasks).toHaveLength(1);
      expect(opTasks[0].id).toBe('task-1');

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);
      const backlogTasks = await localDatabase.getTasks({ status: 'BACKLOG' });
      expect(backlogTasks).toHaveLength(1);
      expect(backlogTasks[0].id).toBe('task-2');
    });

    it('finds a task by id', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const task = await localDatabase.getTaskById('task-1');
      expect(task).toEqual(mockTasks[0]);

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);
      const notFound = await localDatabase.getTaskById('task-non-existent');
      expect(notFound).toBeNull();
    });

    it('upserts a new task when not existing', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const newTask: Task = {
        id: 'task-3',
        titulo: 'Nova Tarefa',
        projetoId: 'proj-op',
        status: 'BACKLOG',
        prioridade: 'BAIXA',
        progresso: 0,
        syncStatus: 'PENDING',
      };

      const saved = await localDatabase.upsertTask(newTask);
      expect(saved.id).toBe('task-3');
      expect(localStorage.setItem).toHaveBeenCalledWith('@larvifort:tasks', [
        ...mockTasks,
        expect.objectContaining({ id: 'task-3', titulo: 'Nova Tarefa' }),
      ]);
    });

    it('updates an existing task on upsert', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const updatedTask: Task = {
        ...mockTasks[0],
        titulo: 'Vistoria Viveiro 01 - Atualizado',
        progresso: 80,
      };

      await localDatabase.upsertTask(updatedTask);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@larvifort:tasks',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'task-1',
            titulo: 'Vistoria Viveiro 01 - Atualizado',
            progresso: 80,
          }),
        ])
      );
    });

    it('updates task status', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const updated = await localDatabase.updateTaskStatus('task-1', 'CONCLUIDO');
      expect(updated?.status).toBe('CONCLUIDO');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@larvifort:tasks',
        expect.arrayContaining([
          expect.objectContaining({ id: 'task-1', status: 'CONCLUIDO' }),
        ])
      );
    });

    it('updates task progress', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const updated = await localDatabase.updateTaskProgress('task-1', 100);
      expect(updated?.progresso).toBe(100);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@larvifort:tasks',
        expect.arrayContaining([
          expect.objectContaining({ id: 'task-1', progresso: 100 }),
        ])
      );
    });

    it('deletes a task by id', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const deleted = await localDatabase.deleteTask('task-1');
      expect(deleted).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('@larvifort:tasks', [mockTasks[1]]);
    });

    it('adds a subtask to existing task', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const updated = await localDatabase.addSubtask('task-1', {
        id: 'sub-1',
        taskId: 'task-1',
        titulo: 'Coletar amostra de água',
        concluida: false,
      });

      expect(updated?.subtarefas).toHaveLength(1);
      expect(updated?.subtarefas?.[0].titulo).toBe('Coletar amostra de água');
    });

    it('toggles subtask completion', async () => {
      const taskWithSubtask: Task = {
        ...mockTasks[0],
        subtarefas: [
          {
            id: 'sub-1',
            taskId: 'task-1',
            titulo: 'Coletar amostra',
            concluida: false,
          },
        ],
      };
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([taskWithSubtask, mockTasks[1]]);

      const updated = await localDatabase.toggleSubtask('task-1', 'sub-1');
      expect(updated?.subtarefas?.[0].concluida).toBe(true);
    });

    it('deletes a subtask from a task', async () => {
      const taskWithSubtask: Task = {
        ...mockTasks[0],
        subtarefas: [
          {
            id: 'sub-1',
            taskId: 'task-1',
            titulo: 'Coletar amostra',
            concluida: true,
          },
        ],
      };
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([taskWithSubtask, mockTasks[1]]);

      const updated = await localDatabase.deleteSubtask('task-1', 'sub-1');
      expect(updated?.subtarefas).toHaveLength(0);
    });

    it('adds an attachment to a task', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTasks);

      const updated = await localDatabase.addAttachment('task-1', {
        id: 'att-1',
        taskId: 'task-1',
        uri: 'file:///mock/attachments/foto.jpg',
        nome: 'foto.jpg',
        syncStatus: 'PENDING',
        createdAt: '2026-09-09T12:00:00.000Z',
      });

      expect(updated?.anexos).toHaveLength(1);
      expect(updated?.anexos?.[0].nome).toBe('foto.jpg');
    });

    it('deletes an attachment from a task', async () => {
      const taskWithAttachment: Task = {
        ...mockTasks[0],
        anexos: [
          {
            id: 'att-1',
            taskId: 'task-1',
            uri: 'file:///mock/attachments/foto.jpg',
            nome: 'foto.jpg',
            createdAt: '2026-09-09T12:00:00.000Z',
          },
        ],
      };
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([taskWithAttachment, mockTasks[1]]);

      const updated = await localDatabase.deleteAttachment('task-1', 'att-1');
      expect(updated?.anexos).toHaveLength(0);
    });

    it('updates attachment sync status', async () => {
      const taskWithAttachment: Task = {
        ...mockTasks[0],
        anexos: [
          {
            id: 'att-1',
            taskId: 'task-1',
            uri: 'file:///mock/attachments/foto.jpg',
            nome: 'foto.jpg',
            syncStatus: 'PENDING',
            createdAt: '2026-09-09T12:00:00.000Z',
          },
        ],
      };
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([taskWithAttachment, mockTasks[1]]);

      const updated = await localDatabase.updateAttachmentSyncStatus('task-1', 'att-1', 'SYNCED');
      expect(updated?.anexos?.[0].syncStatus).toBe('SYNCED');
    });

    it('filters tasks by search query matching title, description, responsible, address, or reference', async () => {
      const taskWithAddress: Task = {
        id: 'task-3',
        titulo: 'Visita Fazenda Camarão Real',
        descricao: 'Coleta de parâmetros de água',
        projetoId: 'proj-op',
        status: 'EM_ANDAMENTO',
        prioridade: 'ALTA',
        progresso: 10,
        responsavel: 'Carlos Lima',
        endereco: 'Rodovia CE-040, Km 42, Aquiraz - CE',
        referenceCode: 'OP-042',
        syncStatus: 'SYNCED',
        createdAt: '2026-09-03T10:00:00.000Z',
        updatedAt: '2026-09-03T10:00:00.000Z',
      };

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([...mockTasks, taskWithAddress]);
      const results = await localDatabase.getTasks({ search: 'Aquiraz' });

      expect(results).toHaveLength(1);
      expect(results[0].endereco).toBe('Rodovia CE-040, Km 42, Aquiraz - CE');

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([...mockTasks, taskWithAddress]);
      const resultsRef = await localDatabase.getTasks({ search: 'OP-042' });
      expect(resultsRef).toHaveLength(1);
    });

    it('clears all tasks', async () => {
      await localDatabase.clearTasks();
      expect(localStorage.removeItem).toHaveBeenCalledWith('@larvifort:tasks');
    });
  });

  describe('Projects operations', () => {
    it('returns all projects from local storage', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockProjects);

      const projects = await localDatabase.getProjects();
      expect(projects).toEqual(mockProjects);
      expect(localStorage.getItem).toHaveBeenCalledWith('@larvifort:projects');
    });

    it('returns project by id', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockProjects);

      const project = await localDatabase.getProjectById('proj-op');
      expect(project).toEqual(mockProjects[0]);
    });

    it('upserts projects', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockProjects);

      const newProject: Project = {
        id: 'proj-fin',
        nome: 'Financeiro',
        setor: 'Financeiro',
      };

      await localDatabase.upsertProject(newProject);
      expect(localStorage.setItem).toHaveBeenCalledWith('@larvifort:projects', [
        mockProjects[0],
        mockProjects[1],
        expect.objectContaining(newProject),
      ]);
    });

    it('deletes project by id', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockProjects);

      const deleted = await localDatabase.deleteProject('proj-op');
      expect(deleted).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('@larvifort:projects', [mockProjects[1]]);
    });

    it('clears all projects', async () => {
      await localDatabase.clearProjects();
      expect(localStorage.removeItem).toHaveBeenCalledWith('@larvifort:projects');
    });
  });

  describe('Clear all', () => {
    it('removes both tasks and projects', async () => {
      await localDatabase.clearAll();
      expect(localStorage.removeItem).toHaveBeenCalledWith('@larvifort:tasks');
      expect(localStorage.removeItem).toHaveBeenCalledWith('@larvifort:projects');
    });
  });
});
