import { createTasksStore, DEFAULT_PROJECTS } from '../tasks.store';
import { Project, Task, OutboxMutation } from '../../types';

describe('TasksStore', () => {
  let mockDb: any;
  let mockOutbox: any;
  let mockNetMonitor: any;
  let mockService: any;
  let mockSync: any;
  let mockAttachmentSvc: any;
  let store: ReturnType<typeof createTasksStore>;

  const sampleProjects: Project[] = [
    { id: 'comercial', nome: 'Comercial', setor: 'Comercial' },
    { id: 'operacoes', nome: 'Operações', setor: 'Operações' },
  ];

  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      titulo: 'Visita Técnica Fazenda Sol',
      descricao: 'Verificar qualidade da água',
      projetoId: 'comercial',
      status: 'BACKLOG',
      prioridade: 'ALTA',
      progresso: 0,
      responsavel: 'Pedro Silva',
      prazo: '2026-09-15',
      syncStatus: 'SYNCED',
    },
    {
      id: 'task-2',
      titulo: 'Coleta de Amostras Viveiro 4',
      descricao: 'Medir salinidade',
      projetoId: 'operacoes',
      status: 'EM_ANDAMENTO',
      prioridade: 'MEDIA',
      progresso: 50,
      responsavel: 'Carlos Lima',
      prazo: '2026-09-18',
      syncStatus: 'PENDING',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getProjects: jest.fn().mockResolvedValue([]),
      saveProjects: jest.fn().mockResolvedValue(undefined),
      getTasks: jest.fn().mockResolvedValue([]),
      saveTasks: jest.fn().mockResolvedValue(undefined),
      getTaskById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(sampleTasks.find((t) => t.id === id) || null)
      ),
      upsertTask: jest.fn().mockImplementation((task: Task) => Promise.resolve(task)),
      updateTaskStatus: jest.fn().mockImplementation((id: string, status: string) => {
        const found = sampleTasks.find((t) => t.id === id);
        return Promise.resolve(found ? { ...found, status } : null);
      }),
      updateTaskProgress: jest.fn().mockImplementation((id: string, progresso: number) => {
        const found = sampleTasks.find((t) => t.id === id);
        return Promise.resolve(found ? { ...found, progresso } : null);
      }),
      updateTask: jest.fn().mockImplementation((id: string, updates: Partial<Task>) => {
        const found = sampleTasks.find((t) => t.id === id);
        return Promise.resolve(found ? { ...found, ...updates } : null);
      }),
      deleteTask: jest.fn().mockResolvedValue(true),
      addSubtask: jest.fn().mockImplementation((taskId: string, subtask: any) => {
        const found = sampleTasks.find((t) => t.id === taskId);
        return Promise.resolve(
          found ? { ...found, subtarefas: [...(found.subtarefas || []), subtask] } : null
        );
      }),
      toggleSubtask: jest.fn().mockImplementation((taskId: string, subtaskId: string) => {
        const found = sampleTasks.find((t) => t.id === taskId);
        return Promise.resolve(
          found
            ? {
                ...found,
                subtarefas: (found.subtarefas || []).map((s: any) =>
                  s.id === subtaskId ? { ...s, concluida: !s.concluida } : s
                ),
              }
            : null
        );
      }),
      deleteSubtask: jest.fn().mockImplementation((taskId: string, subtaskId: string) => {
        const found = sampleTasks.find((t) => t.id === taskId);
        return Promise.resolve(
          found
            ? {
                ...found,
                subtarefas: (found.subtarefas || []).filter((s: any) => s.id !== subtaskId),
              }
            : null
        );
      }),
      addAttachment: jest.fn().mockImplementation((taskId: string, attachment: any) => {
        const found = sampleTasks.find((t) => t.id === taskId);
        return Promise.resolve(
          found
            ? {
                ...found,
                anexos: [...(found.anexos || []), attachment],
              }
            : null
        );
      }),
      deleteAttachment: jest.fn().mockImplementation((taskId: string, attachmentId: string) => {
        const found = sampleTasks.find((t) => t.id === taskId);
        return Promise.resolve(
          found
            ? {
                ...found,
                anexos: (found.anexos || []).filter((a: any) => a.id !== attachmentId),
              }
            : null
        );
      }),
    };

    mockOutbox = {
      getPending: jest.fn().mockResolvedValue([]),
      enqueue: jest.fn().mockResolvedValue({ id: 'mutation-1' } as OutboxMutation),
    };

    mockNetMonitor = {
      isConnected: false,
    };

    mockService = {
      getProjects: jest.fn().mockResolvedValue(sampleProjects),
      getTasks: jest.fn().mockResolvedValue(sampleTasks),
      createTask: jest.fn().mockResolvedValue(sampleTasks[0]),
    };

    mockSync = {
      syncAll: jest.fn().mockResolvedValue(undefined),
    };

    mockAttachmentSvc = {
      requestCameraPermissions: jest.fn().mockResolvedValue(true),
      requestMediaLibraryPermissions: jest.fn().mockResolvedValue(true),
      pickImageFromCamera: jest.fn().mockResolvedValue({
        uri: 'file:///mock/cam/photo.jpg',
        nome: 'photo.jpg',
        tamanho: 45000,
        mimeType: 'image/jpeg',
      }),
      pickImageFromLibrary: jest.fn().mockResolvedValue({
        uri: 'file:///mock/lib/evidence.jpg',
        nome: 'evidence.jpg',
        tamanho: 60000,
        mimeType: 'image/jpeg',
      }),
      saveLocalAttachment: jest.fn().mockImplementation((uri, nome, mimeType, tamanho) =>
        Promise.resolve({
          uri: `file:///mock/saved/${nome || 'photo.jpg'}`,
          nome: nome || 'photo.jpg',
          tamanho: tamanho || 45000,
          mimeType: mimeType || 'image/jpeg',
        })
      ),
      deleteLocalAttachment: jest.fn().mockResolvedValue(true),
      uploadAttachment: jest.fn().mockImplementation((_taskId, att) => Promise.resolve(att)),
      deleteRemoteAttachment: jest.fn().mockResolvedValue(undefined),
    };

    store = createTasksStore({
      db: mockDb,
      outbox: mockOutbox,
      netMonitor: mockNetMonitor,
      service: mockService,
      sync: mockSync,
      attachmentSvc: mockAttachmentSvc,
    });
  });

  describe('loadProjects', () => {
    it('initializes default projects when local database is empty', async () => {
      mockDb.getProjects.mockResolvedValueOnce([]);

      const result = await store.getState().loadProjects();

      expect(mockDb.saveProjects).toHaveBeenCalledWith(DEFAULT_PROJECTS);
      expect(result).toEqual(DEFAULT_PROJECTS);
      expect(store.getState().projects).toEqual(DEFAULT_PROJECTS);
      expect(store.getState().selectedProjectId).toBe(DEFAULT_PROJECTS[0].id);
    });

    it('loads stored projects when available locally', async () => {
      mockDb.getProjects.mockResolvedValueOnce(sampleProjects);

      const result = await store.getState().loadProjects();

      expect(result).toEqual(sampleProjects);
      expect(store.getState().projects).toEqual(sampleProjects);
      expect(store.getState().selectedProjectId).toBe(sampleProjects[0].id);
    });

    it('fetches remote projects in background when online', async () => {
      mockNetMonitor.isConnected = true;
      mockDb.getProjects.mockResolvedValueOnce(sampleProjects);
      const remoteProjects = [
        ...sampleProjects,
        { id: 'novo-setor', nome: 'Novo Setor', setor: 'Novo' },
      ];
      mockService.getProjects.mockResolvedValueOnce(remoteProjects);

      await store.getState().loadProjects();

      expect(mockService.getProjects).toHaveBeenCalled();
    });
  });

  describe('loadTasks & selectProject', () => {
    it('loads tasks from local database matching project filter', async () => {
      mockDb.getTasks.mockResolvedValueOnce([sampleTasks[0]]);

      await store.getState().selectProject('comercial');

      expect(store.getState().selectedProjectId).toBe('comercial');
      expect(mockDb.getTasks).toHaveBeenCalledWith({ projetoId: 'comercial' });
      expect(store.getState().tasks).toEqual([sampleTasks[0]]);
      expect(store.getState().isLoading).toBe(false);
    });

    it('fetches remote tasks in background when online and merges non-pending', async () => {
      mockNetMonitor.isConnected = true;
      mockDb.getTasks.mockResolvedValueOnce([sampleTasks[0]]);
      mockOutbox.getPending.mockResolvedValueOnce([
        { entityId: 'task-2', entityType: 'TASK' },
      ]);
      mockService.getTasks.mockResolvedValueOnce(sampleTasks);

      await store.getState().loadTasks('comercial');

      expect(mockService.getTasks).toHaveBeenCalledWith({ projetoId: 'comercial' });
    });
  });

  describe('filtering and searching (getFilteredTasks)', () => {
    beforeEach(() => {
      store.setState({
        tasks: sampleTasks,
        selectedProjectId: null,
        searchQuery: '',
        statusFilter: 'ALL',
        prioridadeFilter: 'ALL',
      });
    });

    it('returns all tasks when no filters are set', () => {
      const filtered = store.getState().getFilteredTasks();
      expect(filtered.length).toBe(2);
    });

    it('filters by selected project', () => {
      store.setState({ selectedProjectId: 'operacoes' });
      const filtered = store.getState().getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('task-2');
    });

    it('filters by status', () => {
      store.getState().setStatusFilter('BACKLOG');
      const filtered = store.getState().getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('BACKLOG');
    });

    it('filters by priority', () => {
      store.getState().setPrioridadeFilter('ALTA');
      const filtered = store.getState().getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].prioridade).toBe('ALTA');
    });

    it('filters by search query matching title or responsible', () => {
      store.getState().setSearchQuery('Fazenda Sol');
      let filtered = store.getState().getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].titulo).toContain('Fazenda Sol');

      store.getState().setSearchQuery('Carlos');
      filtered = store.getState().getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].responsavel).toBe('Carlos Lima');
    });
  });

  describe('viewMode management', () => {
    it('initializes with kanban mode by default and allows switching to list', () => {
      expect(store.getState().viewMode).toBe('kanban');

      store.getState().setViewMode('list');
      expect(store.getState().viewMode).toBe('list');

      store.getState().setViewMode('kanban');
      expect(store.getState().viewMode).toBe('kanban');
    });
  });

  describe('optimistic mutations (Offline-First)', () => {
    it('creates a task locally, marks PENDING, enqueues mutation, and updates state', async () => {
      store.setState({ selectedProjectId: 'comercial', tasks: [] });

      const created = await store.getState().createTask({
        titulo: 'Nova Tarefa Criada Offline',
        descricao: 'Teste offline',
        projetoId: 'comercial',
        prioridade: 'ALTA',
      });

      expect(created.id).toBeDefined();
      expect(created.syncStatus).toBe('PENDING');
      expect(mockDb.upsertTask).toHaveBeenCalled();
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'TASK',
          action: 'CREATE',
          entityId: created.id,
        })
      );
      expect(store.getState().tasks[0].id).toBe(created.id);
    });

    it('updates task status optimistically and enqueues UPDATE_STATUS', async () => {
      store.setState({ tasks: sampleTasks });

      const updated = await store.getState().updateTaskStatus('task-1', 'CONCLUIDO');

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('CONCLUIDO');
      expect(updated?.syncStatus).toBe('PENDING');
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'UPDATE_STATUS',
          payload: { status: 'CONCLUIDO' },
        })
      );
      expect(store.getState().tasks.find((t) => t.id === 'task-1')?.status).toBe('CONCLUIDO');
    });

    it('updates task progress optimistically and enqueues UPDATE_PROGRESS', async () => {
      store.setState({ tasks: sampleTasks });

      const updated = await store.getState().updateTaskProgress('task-1', 75);

      expect(updated).not.toBeNull();
      expect(updated?.progresso).toBe(75);
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'UPDATE_PROGRESS',
          payload: { progresso: 75 },
        })
      );
    });

    it('deletes task optimistically and enqueues DELETE', async () => {
      store.setState({ tasks: sampleTasks });

      const deleted = await store.getState().deleteTask('task-1');

      expect(deleted).toBe(true);
      expect(mockDb.deleteTask).toHaveBeenCalledWith('task-1');
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'DELETE',
        })
      );
      expect(store.getState().tasks.some((t) => t.id === 'task-1')).toBe(false);
    });

    it('transfers task optimistically and enqueues TRANSFER', async () => {
      store.setState({ tasks: sampleTasks });

      const transferred = await store.getState().transferTask('task-1', 'operacoes');

      expect(transferred).not.toBeNull();
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'TRANSFER',
          payload: expect.objectContaining({ targetProjetoId: 'operacoes' }),
        })
      );
    });

    it('transfers task as a subtask of another task', async () => {
      store.setState({ tasks: sampleTasks });

      const transferred = await store.getState().transferTask('task-1', 'operacoes', 'task-2');

      expect(transferred).not.toBeNull();
      expect(mockDb.addSubtask).toHaveBeenCalledWith(
        'task-2',
        expect.objectContaining({
          taskId: 'task-2',
          titulo: sampleTasks[0].titulo,
        })
      );
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'TRANSFER',
          payload: {
            targetProjetoId: 'operacoes',
            parentTaskId: 'task-2',
          },
        })
      );
    });

    it('adds subtask optimistically and enqueues UPDATE', async () => {
      store.setState({ tasks: sampleTasks });

      const updated = await store.getState().addSubtask('task-1', 'Nova Subtarefa Teste');

      expect(updated).not.toBeNull();
      expect(mockDb.addSubtask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          taskId: 'task-1',
          titulo: 'Nova Subtarefa Teste',
          concluida: false,
        })
      );
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'UPDATE',
        })
      );
    });

    it('toggles subtask completion and enqueues UPDATE', async () => {
      store.setState({ tasks: sampleTasks });

      const updated = await store.getState().toggleSubtask('task-1', 'sub-1');

      expect(mockDb.toggleSubtask).toHaveBeenCalledWith('task-1', 'sub-1');
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'UPDATE',
        })
      );
    });

    it('deletes subtask and enqueues UPDATE', async () => {
      store.setState({ tasks: sampleTasks });

      const updated = await store.getState().deleteSubtask('task-1', 'sub-1');

      expect(mockDb.deleteSubtask).toHaveBeenCalledWith('task-1', 'sub-1');
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          action: 'UPDATE',
        })
      );
    });
  });

  describe('Attachments', () => {
    it('adds attachment to task and enqueues UPLOAD_ATTACHMENT mutation', async () => {
      store.setState({ tasks: sampleTasks });

      const result = await store.getState().addAttachment('task-1', {
        uri: 'file:///temp/camera.jpg',
        nome: 'foto_tanque.jpg',
        mimeType: 'image/jpeg',
        tamanho: 50000,
      });

      expect(mockAttachmentSvc.saveLocalAttachment).toHaveBeenCalledWith(
        'file:///temp/camera.jpg',
        'foto_tanque.jpg',
        'image/jpeg',
        50000
      );
      expect(mockDb.addAttachment).toHaveBeenCalled();
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'ATTACHMENT',
          action: 'UPLOAD_ATTACHMENT',
          payload: expect.objectContaining({
            taskId: 'task-1',
            nome: 'foto_tanque.jpg',
          }),
        })
      );
      expect(result).not.toBeNull();
      expect(result?.syncStatus).toBe('PENDING');
    });

    it('captures photo with camera and adds attachment', async () => {
      store.setState({ tasks: sampleTasks });

      const result = await store.getState().captureAndAddPhoto('task-1');

      expect(mockAttachmentSvc.pickImageFromCamera).toHaveBeenCalled();
      expect(mockDb.addAttachment).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('picks photo from gallery and adds attachment', async () => {
      store.setState({ tasks: sampleTasks });

      const result = await store.getState().pickAndAddPhoto('task-1');

      expect(mockAttachmentSvc.pickImageFromLibrary).toHaveBeenCalled();
      expect(mockDb.addAttachment).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('deletes attachment and enqueues DELETE_ATTACHMENT mutation', async () => {
      const taskWithAttachment: Task = {
        ...sampleTasks[0],
        anexos: [
          {
            id: 'att-1',
            taskId: 'task-1',
            uri: 'file:///mock/saved/foto.jpg',
            nome: 'foto.jpg',
            createdAt: '2026-09-09T10:00:00Z',
          },
        ],
      };
      store.setState({ tasks: [taskWithAttachment, sampleTasks[1]] });
      mockDb.getTaskById.mockResolvedValueOnce(taskWithAttachment);

      const success = await store.getState().deleteAttachment('task-1', 'att-1');

      expect(mockAttachmentSvc.deleteLocalAttachment).toHaveBeenCalledWith(
        'file:///mock/saved/foto.jpg'
      );
      expect(mockDb.deleteAttachment).toHaveBeenCalledWith('task-1', 'att-1');
      expect(mockOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'att-1',
          entityType: 'ATTACHMENT',
          action: 'DELETE_ATTACHMENT',
          payload: {
            taskId: 'task-1',
            attachmentId: 'att-1',
          },
        })
      );
      expect(success).toBe(true);
    });
  });

  describe('refreshTasks', () => {
    it('triggers syncAll when online and updates local state', async () => {
      mockNetMonitor.isConnected = true;
      mockDb.getProjects.mockResolvedValueOnce(sampleProjects);
      mockDb.getTasks.mockResolvedValueOnce(sampleTasks);

      await store.getState().refreshTasks();

      expect(mockSync.syncAll).toHaveBeenCalled();
      expect(store.getState().isRefreshing).toBe(false);
      expect(store.getState().tasks).toEqual(sampleTasks);
    });
  });
});
