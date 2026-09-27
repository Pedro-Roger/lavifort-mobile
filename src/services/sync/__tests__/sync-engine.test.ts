import { SyncEngine } from '../sync-engine';
import { OutboxQueue } from '../outbox-queue';
import { LocalDatabase } from '../local-database';
import { NetworkMonitor } from '../network-monitor';
import { tasksService } from '../../tasks.service';
import { AttachmentService } from '../../attachment.service';
import { OutboxMutation, Task } from '../../../types';

jest.mock('../../tasks.service', () => ({
  tasksService: {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    updateStatus: jest.fn(),
    updateProgresso: jest.fn(),
    deleteTask: jest.fn(),
    getProjects: jest.fn(),
    getTasks: jest.fn(),
    transferTask: jest.fn(),
  },
}));

describe('SyncEngine', () => {
  let mockOutbox: jest.Mocked<OutboxQueue>;
  let mockLocalDb: jest.Mocked<LocalDatabase>;
  let mockNetMonitor: jest.Mocked<NetworkMonitor>;
  let mockAttachmentService: jest.Mocked<AttachmentService>;
  let engine: SyncEngine;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOutbox = {
      enqueue: jest.fn(),
      getAll: jest.fn().mockResolvedValue([]),
      getPending: jest.fn().mockResolvedValue([]),
      peek: jest.fn().mockResolvedValue(null),
      getNextPending: jest.fn().mockResolvedValue(null),
      getById: jest.fn().mockResolvedValue(null),
      getByStatus: jest.fn().mockResolvedValue([]),
      getByEntityId: jest.fn().mockResolvedValue([]),
      dequeue: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
      removeByEntityId: jest.fn().mockResolvedValue(0),
      saveAll: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(null),
      incrementRetry: jest.fn().mockResolvedValue(null),
      getStats: jest.fn().mockResolvedValue({ total: 0, pending: 0, syncing: 0, error: 0 }),
      clear: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxQueue>;

    mockLocalDb = {
      getTasks: jest.fn().mockResolvedValue([]),
      getTaskById: jest.fn().mockResolvedValue(null),
      saveTasks: jest.fn().mockResolvedValue(undefined),
      upsertTask: jest.fn().mockImplementation((task) => Promise.resolve(task)),
      updateAttachmentSyncStatus: jest.fn().mockResolvedValue(null),
      getProjects: jest.fn().mockResolvedValue([]),
      saveProjects: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<LocalDatabase>;

    mockNetMonitor = {
      init: jest.fn().mockResolvedValue(undefined),
      isConnected: true,
      isInternetReachable: true,
      addListener: jest.fn().mockReturnValue(jest.fn()),
      removeListener: jest.fn(),
      checkConnection: jest.fn().mockResolvedValue(true),
      destroy: jest.fn(),
    } as unknown as jest.Mocked<NetworkMonitor>;

    mockAttachmentService = {
      requestCameraPermissions: jest.fn().mockResolvedValue(true),
      requestMediaLibraryPermissions: jest.fn().mockResolvedValue(true),
      pickImageFromCamera: jest.fn().mockResolvedValue(null),
      pickImageFromLibrary: jest.fn().mockResolvedValue(null),
      saveLocalAttachment: jest.fn(),
      deleteLocalAttachment: jest.fn().mockResolvedValue(true),
      uploadAttachment: jest.fn().mockImplementation((_taskId, att) => Promise.resolve(att)),
      deleteRemoteAttachment: jest.fn().mockResolvedValue(undefined),
    };

    engine = new SyncEngine({
      outboxQueue: mockOutbox,
      localDatabase: mockLocalDb,
      networkMonitor: mockNetMonitor,
      tasksService,
      attachmentService: mockAttachmentService,
    });
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('init', () => {
    it('initializes network monitor and subscribes to changes', async () => {
      await engine.init();
      expect(mockNetMonitor.init).toHaveBeenCalled();
      expect(mockNetMonitor.addListener).toHaveBeenCalled();
    });
  });

  describe('processOutbox', () => {
    it('does nothing when offline', async () => {
      Object.defineProperty(mockNetMonitor, 'isConnected', { value: false, configurable: true });
      const result = await engine.processOutbox();
      expect(result).toEqual({ processed: 0, errors: 0 });
      expect(mockOutbox.getNextPending).not.toHaveBeenCalled();
    });

    it('processes CREATE mutation and updates local task as SYNCED', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-1',
        entityId: 'task-1',
        entityType: 'TASK',
        action: 'CREATE',
        payload: { titulo: 'Nova Tarefa', projetoId: 'proj-1' },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      (tasksService.createTask as jest.Mock).mockResolvedValueOnce({
        id: 'task-1',
        titulo: 'Nova Tarefa',
        projetoId: 'proj-1',
        status: 'BACKLOG',
        progresso: 0,
      });

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 1, errors: 0 });
      expect(mockOutbox.updateStatus).toHaveBeenCalledWith('mut-1', 'SYNCING');
      expect(tasksService.createTask).toHaveBeenCalledWith({
        id: 'task-1',
        titulo: 'Nova Tarefa',
        projetoId: 'proj-1',
      });
      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-1');
      expect(mockLocalDb.upsertTask).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task-1', syncStatus: 'SYNCED' })
      );
    });

    it('processes UPDATE_STATUS mutation and updates local task as SYNCED', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-2',
        entityId: 'task-2',
        entityType: 'TASK',
        action: 'UPDATE_STATUS',
        payload: { status: 'EM_ANDAMENTO' },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      (tasksService.updateStatus as jest.Mock).mockResolvedValueOnce({
        id: 'task-2',
        status: 'EM_ANDAMENTO',
      });

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 1, errors: 0 });
      expect(tasksService.updateStatus).toHaveBeenCalledWith('task-2', 'EM_ANDAMENTO');
      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-2');
    });

    it('processes UPDATE_PROGRESS mutation', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-3',
        entityId: 'task-3',
        entityType: 'TASK',
        action: 'UPDATE_PROGRESS',
        payload: { progresso: 80 },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      (tasksService.updateProgresso as jest.Mock).mockResolvedValueOnce({
        id: 'task-3',
        progresso: 80,
      });

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 1, errors: 0 });
      expect(tasksService.updateProgresso).toHaveBeenCalledWith('task-3', 80);
      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-3');
    });

    it('processes DELETE mutation and handles 404 gracefully', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-4',
        entityId: 'task-4',
        entityType: 'TASK',
        action: 'DELETE',
        payload: {},
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      const err404 = { response: { status: 404 } };
      (tasksService.deleteTask as jest.Mock).mockRejectedValueOnce(err404);

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 1, errors: 0 });
      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-4');
    });

    it('handles 422 validation error by marking mutation as ERROR', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-5',
        entityId: 'task-5',
        entityType: 'TASK',
        action: 'CREATE',
        payload: { titulo: '' },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      mockLocalDb.getTaskById.mockResolvedValueOnce({
        id: 'task-5',
        titulo: '',
        projetoId: 'p-1',
        status: 'BACKLOG',
        progresso: 0,
        prioridade: 'MEDIA',
      });

      const err422 = {
        response: {
          status: 422,
          data: { message: 'Título é obrigatório' },
        },
      };
      (tasksService.createTask as jest.Mock).mockRejectedValueOnce(err422);

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 0, errors: 1 });
      expect(mockOutbox.updateStatus).toHaveBeenCalledWith('mut-5', 'ERROR', 'Título é obrigatório');
      expect(mockLocalDb.upsertTask).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task-5', syncStatus: 'ERROR' })
      );
    });

    it('handles network error by incrementing retry and breaking loop', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-6',
        entityId: 'task-6',
        entityType: 'TASK',
        action: 'UPDATE',
        payload: { titulo: 'Offline edit' },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending.mockResolvedValue(mockMutation);

      const networkErr = new Error('Network Error');
      (tasksService.updateTask as jest.Mock).mockRejectedValueOnce(networkErr);

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 0, errors: 1 });
      expect(mockOutbox.incrementRetry).toHaveBeenCalledWith('mut-6', 'Network Error');
    });

    it('processes attachment upload mutation', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-att-1',
        entityId: 'att-1',
        entityType: 'ATTACHMENT',
        action: 'UPLOAD_ATTACHMENT',
        payload: {
          taskId: 'task-1',
          attachmentId: 'att-1',
          uri: 'file:///mock/photo.jpg',
          nome: 'photo.jpg',
          mimeType: 'image/jpeg',
        },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 1, errors: 0 });
      expect(mockAttachmentService.uploadAttachment).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ id: 'att-1', uri: 'file:///mock/photo.jpg' })
      );
      expect(mockLocalDb.updateAttachmentSyncStatus).toHaveBeenCalledWith('task-1', 'att-1', 'SYNCED');
      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-att-1');
    });

    it('processes attachment delete mutation', async () => {
      const mockMutation: OutboxMutation = {
        id: 'mut-att-2',
        entityId: 'att-2',
        entityType: 'ATTACHMENT',
        action: 'DELETE_ATTACHMENT',
        payload: {
          taskId: 'task-1',
          attachmentId: 'att-2',
        },
        createdAt: '2026-09-09T10:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      };

      mockOutbox.getNextPending
        .mockResolvedValueOnce(mockMutation)
        .mockResolvedValueOnce(null);

      const result = await engine.processOutbox();

      expect(result).toEqual({ processed: 1, errors: 0 });
      expect(mockAttachmentService.deleteRemoteAttachment).toHaveBeenCalledWith('task-1', 'att-2');
      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-att-2');
    });
  });

  describe('pullRemoteData', () => {
    it('fetches projects and tasks, preserving pending local mutations', async () => {
      const remoteProjects = [{ id: 'p-1', nome: 'Comercial' }];
      const remoteTasks: Task[] = [
        { id: 't-remote', titulo: 'Servidor', projetoId: 'p-1', status: 'CONCLUIDO', progresso: 100, prioridade: 'BAIXA' },
        { id: 't-local-pending', titulo: 'Local Antigo', projetoId: 'p-1', status: 'BACKLOG', progresso: 0, prioridade: 'ALTA' },
      ];
      const localTasks: Task[] = [
        { id: 't-local-pending', titulo: 'Local Modificado', projetoId: 'p-1', status: 'EM_ANDAMENTO', progresso: 50, prioridade: 'ALTA', syncStatus: 'PENDING' },
      ];

      (tasksService.getProjects as jest.Mock).mockResolvedValueOnce(remoteProjects);
      (tasksService.getTasks as jest.Mock).mockResolvedValueOnce(remoteTasks);
      mockOutbox.getAll.mockResolvedValueOnce([
        {
          id: 'mut-p',
          entityId: 't-local-pending',
          entityType: 'TASK',
          action: 'UPDATE',
          payload: {},
          createdAt: '',
          retryCount: 0,
          status: 'PENDING',
        },
      ]);
      mockLocalDb.getTasks.mockResolvedValueOnce(localTasks);

      await engine.pullRemoteData();

      expect(mockLocalDb.saveProjects).toHaveBeenCalledWith(remoteProjects);
      expect(mockLocalDb.saveTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 't-remote', syncStatus: 'SYNCED' }),
          expect.objectContaining({ id: 't-local-pending', titulo: 'Local Modificado' }),
        ])
      );
    });
  });

  describe('syncAll', () => {
    it('processes outbox, pulls remote data, and updates lastSyncedAt', async () => {
      (tasksService.getProjects as jest.Mock).mockResolvedValueOnce([]);
      (tasksService.getTasks as jest.Mock).mockResolvedValueOnce([]);

      await engine.syncAll();

      expect(engine.lastSyncedAt).not.toBeNull();
      expect(engine.isSyncing).toBe(false);
    });
  });

  describe('retryErrors', () => {
    it('resets error mutations back to PENDING and triggers sync', async () => {
      mockOutbox.getByStatus.mockResolvedValueOnce([
        {
          id: 'mut-err',
          entityId: 't-err',
          entityType: 'TASK',
          action: 'UPDATE',
          payload: {},
          createdAt: '',
          retryCount: 5,
          status: 'ERROR',
        },
      ]);
      (tasksService.getProjects as jest.Mock).mockResolvedValueOnce([]);
      (tasksService.getTasks as jest.Mock).mockResolvedValueOnce([]);

      await engine.retryErrors();

      expect(mockOutbox.updateStatus).toHaveBeenCalledWith('mut-err', 'PENDING');
    });
  });

  describe('retryMutation', () => {
    it('marks mutation as PENDING and triggers sync when connected', async () => {
      mockOutbox.getById.mockResolvedValueOnce({
        id: 'mut-single',
        entityId: 't-1',
        entityType: 'TASK',
        action: 'UPDATE',
        payload: {},
        createdAt: '',
        retryCount: 3,
        status: 'ERROR',
      });
      (tasksService.getProjects as jest.Mock).mockResolvedValueOnce([]);
      (tasksService.getTasks as jest.Mock).mockResolvedValueOnce([]);

      await engine.retryMutation('mut-single');

      expect(mockOutbox.updateStatus).toHaveBeenCalledWith('mut-single', 'PENDING');
    });

    it('does nothing if mutation is not found', async () => {
      mockOutbox.getById.mockResolvedValueOnce(null);

      await engine.retryMutation('mut-missing');

      expect(mockOutbox.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('removeMutation', () => {
    it('dequeues mutation and notifies listeners', async () => {
      await engine.removeMutation('mut-del');

      expect(mockOutbox.dequeue).toHaveBeenCalledWith('mut-del');
    });
  });
});
