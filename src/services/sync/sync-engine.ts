import { AxiosError } from 'axios';
import { outboxQueue, OutboxQueue } from './outbox-queue';
import { localDatabase, LocalDatabase } from './local-database';
import { networkMonitor, NetworkMonitor } from './network-monitor';
import { tasksService as defaultTasksService } from '../tasks.service';
import { attachmentService as defaultAttachmentService, AttachmentService } from '../attachment.service';
import {
  CreateTaskDTO,
  OutboxMutation,
  StatusTarefa,
  SyncStatusInfo,
  Task,
  TaskAttachment,
  TransferTaskDTO,
  UpdateTaskDTO,
} from '../../types';

export type SyncEngineListener = (status: SyncStatusInfo) => void;

export interface SyncEngineOptions {
  outboxQueue?: OutboxQueue;
  localDatabase?: LocalDatabase;
  networkMonitor?: NetworkMonitor;
  tasksService?: typeof defaultTasksService;
  attachmentService?: AttachmentService;
}

export class SyncEngine {
  private outboxQueue: OutboxQueue;
  private localDatabase: LocalDatabase;
  private networkMonitor: NetworkMonitor;
  private tasksService: typeof defaultTasksService;
  private attachmentService: AttachmentService;

  private _isSyncing = false;
  private _lastSyncedAt: string | null = null;
  private listeners: Set<SyncEngineListener> = new Set();
  private unsubscribeNetwork: (() => void) | null = null;
  private isInitialized = false;

  constructor(options?: SyncEngineOptions) {
    this.outboxQueue = options?.outboxQueue || outboxQueue;
    this.localDatabase = options?.localDatabase || localDatabase;
    this.networkMonitor = options?.networkMonitor || networkMonitor;
    this.tasksService = options?.tasksService || defaultTasksService;
    this.attachmentService = options?.attachmentService || defaultAttachmentService;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    await this.networkMonitor.init();

    this.unsubscribeNetwork = this.networkMonitor.addListener((isConnected) => {
      this.notifyListeners();
      if (isConnected && !this._isSyncing) {
        this.syncAll().catch(() => {});
      }
    });
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  get lastSyncedAt(): string | null {
    return this._lastSyncedAt;
  }

  async getSyncStatus(): Promise<SyncStatusInfo> {
    const stats = await this.outboxQueue.getStats();
    return {
      isConnected: this.networkMonitor.isConnected,
      isSyncing: this._isSyncing,
      pendingCount: stats.pending + stats.syncing,
      errorCount: stats.error,
      lastSyncedAt: this._lastSyncedAt,
    };
  }

  addListener(listener: SyncEngineListener): () => void {
    this.listeners.add(listener);
    this.getSyncStatus().then((status) => listener(status)).catch(() => {});
    return () => {
      this.listeners.delete(listener);
    };
  }

  removeListener(listener: SyncEngineListener): void {
    this.listeners.delete(listener);
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch {
        // Ignore listener error
      }
    });
  }

  async processOutbox(): Promise<{ processed: number; errors: number }> {
    if (!this.networkMonitor.isConnected) {
      return { processed: 0, errors: 0 };
    }

    let processed = 0;
    let errors = 0;
    let hasPending = true;

    while (hasPending) {
      const mutation = await this.outboxQueue.getNextPending();
      if (!mutation) {
        hasPending = false;
        break;
      }

      await this.outboxQueue.updateStatus(mutation.id, 'SYNCING');
      await this.notifyListeners();

      try {
        await this.executeMutation(mutation);
        await this.outboxQueue.dequeue(mutation.id);
        await this.markEntitySynced(mutation);
        processed++;
      } catch (err: unknown) {
        errors++;
        const isClientValidationError = this.isValidationError(err);

        if (isClientValidationError) {
          const message = this.extractErrorMessage(err);
          await this.outboxQueue.updateStatus(mutation.id, 'ERROR', message);
          await this.markEntityError(mutation);
        } else {
          const message = this.extractErrorMessage(err);
          await this.outboxQueue.incrementRetry(mutation.id, message);
          if (this.isNetworkAbortError(err)) {
            await this.notifyListeners();
            hasPending = false;
            break;
          }
        }
      }

      await this.notifyListeners();
    }

    return { processed, errors };
  }

  private async executeMutation(mutation: OutboxMutation): Promise<void> {
    const { entityType, action, entityId, payload } = mutation;

    if (entityType === 'TASK') {
      switch (action) {
        case 'CREATE': {
          const createDto: CreateTaskDTO & { id?: string } = {
            id: entityId,
            titulo: String(payload.titulo || ''),
            descricao: payload.descricao ? String(payload.descricao) : undefined,
            projetoId: String(payload.projetoId || ''),
            status: payload.status as StatusTarefa | undefined,
            prioridade: payload.prioridade as CreateTaskDTO['prioridade'],
            progresso: typeof payload.progresso === 'number' ? payload.progresso : undefined,
            responsavel: payload.responsavel ? String(payload.responsavel) : undefined,
            responsavelId: payload.responsavelId ? String(payload.responsavelId) : undefined,
            prazo: payload.prazo ? String(payload.prazo) : undefined,
          };
          const created = await this.tasksService.createTask(createDto);
          if (created && created.id) {
            await this.localDatabase.upsertTask({
              ...created,
              syncStatus: 'SYNCED',
            });
          }
          break;
        }

        case 'UPDATE': {
          const updateDto: UpdateTaskDTO = {
            titulo: payload.titulo ? String(payload.titulo) : undefined,
            descricao: payload.descricao ? String(payload.descricao) : undefined,
            projetoId: payload.projetoId ? String(payload.projetoId) : undefined,
            status: payload.status as StatusTarefa | undefined,
            prioridade: payload.prioridade as UpdateTaskDTO['prioridade'],
            progresso: typeof payload.progresso === 'number' ? payload.progresso : undefined,
            responsavel: payload.responsavel ? String(payload.responsavel) : undefined,
            responsavelId: payload.responsavelId ? String(payload.responsavelId) : undefined,
            prazo: payload.prazo ? String(payload.prazo) : undefined,
          };
          const updated = await this.tasksService.updateTask(entityId, updateDto);
          if (updated) {
            await this.localDatabase.upsertTask({
              ...updated,
              syncStatus: 'SYNCED',
            });
          }
          break;
        }

        case 'UPDATE_STATUS': {
          const status = payload.status as StatusTarefa;
          const updated = await this.tasksService.updateStatus(entityId, status);
          if (updated) {
            await this.localDatabase.upsertTask({
              ...updated,
              syncStatus: 'SYNCED',
            });
          }
          break;
        }

        case 'UPDATE_PROGRESS': {
          const progresso = Number(payload.progresso ?? 0);
          const updated = await this.tasksService.updateProgresso(entityId, progresso);
          if (updated) {
            await this.localDatabase.upsertTask({
              ...updated,
              syncStatus: 'SYNCED',
            });
          }
          break;
        }

        case 'DELETE': {
          try {
            await this.tasksService.deleteTask(entityId);
          } catch (err) {
            if (this.is404Error(err)) {
              return;
            }
            throw err;
          }
          break;
        }

        case 'TRANSFER': {
          const transferDto: TransferTaskDTO = {
            targetProjetoId: String(payload.targetProjetoId || ''),
            parentTaskId: payload.parentTaskId ? String(payload.parentTaskId) : undefined,
          };
          const transferred = await this.tasksService.transferTask(entityId, transferDto);
          if (transferred) {
            await this.localDatabase.upsertTask({
              ...transferred,
              syncStatus: 'SYNCED',
            });
          }
          break;
        }
      }
    } else if (entityType === 'ATTACHMENT') {
      const taskId = String(payload.taskId || '');
      const attachmentId = String(payload.attachmentId || entityId);

      if (action === 'CREATE' || action === 'UPLOAD_ATTACHMENT') {
        const attachment: TaskAttachment = {
          id: attachmentId,
          taskId,
          uri: String(payload.uri || ''),
          nome: String(payload.nome || 'anexo.jpg'),
          tamanho: typeof payload.tamanho === 'number' ? payload.tamanho : undefined,
          mimeType: payload.mimeType ? String(payload.mimeType) : 'image/jpeg',
          createdAt: String(payload.createdAt || new Date().toISOString()),
        };
        const uploaded = await this.attachmentService.uploadAttachment(taskId, attachment);
        if (uploaded) {
          await this.localDatabase.updateAttachmentSyncStatus(taskId, attachmentId, 'SYNCED');
        }
      } else if (action === 'DELETE' || action === 'DELETE_ATTACHMENT') {
        try {
          await this.attachmentService.deleteRemoteAttachment(taskId, attachmentId);
        } catch (err) {
          if (this.is404Error(err)) {
            return;
          }
          throw err;
        }
      }
    }
  }

  private async markEntitySynced(mutation: OutboxMutation): Promise<void> {
    if (mutation.entityType === 'TASK' && mutation.action !== 'DELETE') {
      const task = await this.localDatabase.getTaskById(mutation.entityId);
      if (task) {
        await this.localDatabase.upsertTask({
          ...task,
          syncStatus: 'SYNCED',
        });
      }
    } else if (mutation.entityType === 'ATTACHMENT') {
      const taskId = String(mutation.payload.taskId || '');
      const attachmentId = String(mutation.payload.attachmentId || mutation.entityId);
      if (mutation.action === 'CREATE' || mutation.action === 'UPLOAD_ATTACHMENT') {
        await this.localDatabase.updateAttachmentSyncStatus(taskId, attachmentId, 'SYNCED');
      }
    }
  }

  private async markEntityError(mutation: OutboxMutation): Promise<void> {
    if (mutation.entityType === 'TASK') {
      const task = await this.localDatabase.getTaskById(mutation.entityId);
      if (task) {
        await this.localDatabase.upsertTask({
          ...task,
          syncStatus: 'ERROR',
        });
      }
    } else if (mutation.entityType === 'ATTACHMENT') {
      const taskId = String(mutation.payload.taskId || '');
      const attachmentId = String(mutation.payload.attachmentId || mutation.entityId);
      await this.localDatabase.updateAttachmentSyncStatus(taskId, attachmentId, 'ERROR');
    }
  }

  async pullRemoteData(projetoId?: string): Promise<void> {
    if (!this.networkMonitor.isConnected) return;

    try {
      const [projectsResult, tasksResult] = await Promise.allSettled([
        this.tasksService.getProjects(),
        this.tasksService.getTasks(projetoId ? { projetoId } : undefined),
      ]);

      if (projectsResult.status === 'fulfilled' && Array.isArray(projectsResult.value)) {
        await this.localDatabase.saveProjects(projectsResult.value);
      }

      if (tasksResult.status === 'fulfilled' && Array.isArray(tasksResult.value)) {
        const remoteTasks = tasksResult.value;
        const pendingMutations = await this.outboxQueue.getAll();
        const pendingEntityIds = new Set(
          pendingMutations
            .filter((m: OutboxMutation) => m.status === 'PENDING' || m.status === 'SYNCING')
            .map((m: OutboxMutation) => m.entityId)
        );

        const localTasks = await this.localDatabase.getTasks();
        const localTasksMap = new Map<string, Task>(localTasks.map((t) => [t.id, t]));

        remoteTasks.forEach((remoteTask) => {
          if (!pendingEntityIds.has(remoteTask.id)) {
            localTasksMap.set(remoteTask.id, {
              ...remoteTask,
              syncStatus: 'SYNCED',
            });
          }
        });

        await this.localDatabase.saveTasks(Array.from(localTasksMap.values()));
      }
    } catch {
      // Ignore pull network errors
    }
  }

  async syncAll(projetoId?: string): Promise<void> {
    if (!this.networkMonitor.isConnected || this._isSyncing) {
      return;
    }

    this._isSyncing = true;
    await this.notifyListeners();

    try {
      await this.processOutbox();
      await this.pullRemoteData(projetoId);
      this._lastSyncedAt = new Date().toISOString();
    } finally {
      this._isSyncing = false;
      await this.notifyListeners();
    }
  }

  async retryErrors(): Promise<void> {
    const errorMutations = await this.outboxQueue.getByStatus('ERROR');
    for (const mutation of errorMutations) {
      await this.outboxQueue.updateStatus(mutation.id, 'PENDING');
    }
    await this.notifyListeners();
    if (this.networkMonitor.isConnected) {
      await this.syncAll();
    }
  }

  async retryMutation(id: string): Promise<void> {
    const mutation = await this.outboxQueue.getById(id);
    if (!mutation) return;
    await this.outboxQueue.updateStatus(id, 'PENDING');
    await this.notifyListeners();
    if (this.networkMonitor.isConnected) {
      await this.syncAll();
    }
  }

  async removeMutation(id: string): Promise<void> {
    await this.outboxQueue.dequeue(id);
    await this.notifyListeners();
  }

  private isValidationError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      return status === 400 || status === 422;
    }
    return false;
  }

  private is404Error(err: unknown): boolean {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as AxiosError;
      return axiosErr.response?.status === 404;
    }
    return false;
  }

  private isNetworkAbortError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as AxiosError;
      return !axiosErr.response;
    }
    return true;
  }

  private extractErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosErr.response?.data?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Erro desconhecido na sincronização';
  }

  destroy(): void {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
      this.unsubscribeNetwork = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const syncEngine = new SyncEngine();
