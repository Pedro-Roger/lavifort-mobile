import { create } from 'zustand';
import {
  Task,
  Project,
  StatusTarefa,
  PrioridadeTarefa,
  CreateTaskDTO,
  UpdateTaskDTO,
  TransferTaskDTO,
  SubTask,
  TaskAttachment,
} from '../types';
import { localDatabase, LocalDatabase } from '../services/sync/local-database';
import { outboxQueue, OutboxQueue } from '../services/sync/outbox-queue';
import { networkMonitor, NetworkMonitor } from '../services/sync/network-monitor';
import { tasksService as defaultTasksService } from '../services/tasks.service';
import { syncEngine, SyncEngine } from '../services/sync/sync-engine';
import { attachmentService as defaultAttachmentService, AttachmentService } from '../services/attachment.service';
import { generateUUID } from '../utils/uuid';

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'comercial', nome: 'Comercial', setor: 'Comercial', cor: '#0284c7' },
  { id: 'operacoes', nome: 'Operações', setor: 'Operações', cor: '#0ea5e9' },
  { id: 'financeiro', nome: 'Financeiro', setor: 'Financeiro', cor: '#10b981' },
  { id: 'desenvolvimento', nome: 'Desenvolvimento', setor: 'Desenvolvimento', cor: '#6366f1' },
  { id: 'administrativo', nome: 'Administrativo', setor: 'Administrativo', cor: '#8b5cf6' },
];

export type ViewMode = 'kanban' | 'list';

export interface TasksState {
  projects: Project[];
  selectedProjectId: string | null;
  tasks: Task[];
  viewMode: ViewMode;
  searchQuery: string;
  statusFilter: StatusTarefa | 'ALL';
  prioridadeFilter: PrioridadeTarefa | 'ALL';
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<Project[]>;
  selectProject: (projectId: string | null) => Promise<void>;
  loadTasks: (projectId?: string | null) => Promise<Task[]>;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: StatusTarefa | 'ALL') => void;
  setPrioridadeFilter: (prioridade: PrioridadeTarefa | 'ALL') => void;
  refreshTasks: () => Promise<void>;
  getFilteredTasks: () => Task[];

  // Optimistic Data Mutations (Offline-First)
  createTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTaskStatus: (id: string, status: StatusTarefa) => Promise<Task | null>;
  updateTaskProgress: (id: string, progresso: number) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  transferTask: (id: string, targetProjectId: string, parentTaskId?: string) => Promise<Task | null>;
  addSubtask: (taskId: string, titulo: string) => Promise<Task | null>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<Task | null>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<Task | null>;
  addAttachment: (
    taskId: string,
    file: { uri: string; nome?: string; mimeType?: string; tamanho?: number }
  ) => Promise<TaskAttachment | null>;
  deleteAttachment: (taskId: string, attachmentId: string) => Promise<boolean>;
  captureAndAddPhoto: (taskId: string) => Promise<TaskAttachment | null>;
  pickAndAddPhoto: (taskId: string) => Promise<TaskAttachment | null>;
  clearError: () => void;
}

export interface TasksStoreDeps {
  db?: LocalDatabase;
  outbox?: OutboxQueue;
  netMonitor?: NetworkMonitor;
  service?: typeof defaultTasksService;
  sync?: SyncEngine;
  attachmentSvc?: AttachmentService;
}

export const createTasksStore = (deps: TasksStoreDeps = {}) => {
  const db = deps.db ?? localDatabase;
  const outbox = deps.outbox ?? outboxQueue;
  const netMonitor = deps.netMonitor ?? networkMonitor;
  const service = deps.service ?? defaultTasksService;
  const sync = deps.sync ?? syncEngine;
  const attachmentSvc = deps.attachmentSvc ?? defaultAttachmentService;

  return create<TasksState>((set, get) => ({
    projects: [],
    selectedProjectId: null,
    tasks: [],
    viewMode: 'kanban',
    searchQuery: '',
    statusFilter: 'ALL',
    prioridadeFilter: 'ALL',
    isLoading: false,
    isRefreshing: false,
    error: null,

    loadProjects: async () => {
      try {
        let storedProjects = await db.getProjects();

        if (storedProjects.length === 0) {
          await db.saveProjects(DEFAULT_PROJECTS);
          storedProjects = DEFAULT_PROJECTS;
        }

        const currentSelected = get().selectedProjectId;
        const initialSelected =
          currentSelected && storedProjects.some((p) => p.id === currentSelected)
            ? currentSelected
            : storedProjects[0]?.id || null;

        set({
          projects: storedProjects,
          selectedProjectId: initialSelected,
        });

        if (netMonitor.isConnected) {
          service
            .getProjects()
            .then(async (remoteProjects) => {
              if (Array.isArray(remoteProjects) && remoteProjects.length > 0) {
                await db.saveProjects(remoteProjects);
                const updatedSelected =
                  get().selectedProjectId && remoteProjects.some((p) => p.id === get().selectedProjectId)
                    ? get().selectedProjectId
                    : remoteProjects[0]?.id || null;

                set({
                  projects: remoteProjects,
                  selectedProjectId: updatedSelected,
                });
              }
            })
            .catch(() => {
              // Ignore network errors in background
            });
        }

        return storedProjects;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar projetos';
        set({ error: message });
        return [];
      }
    },

    selectProject: async (projectId: string | null) => {
      set({ selectedProjectId: projectId });
      await get().loadTasks(projectId);
    },

    loadTasks: async (projetoId?: string | null) => {
      const activeProjectId =
        projetoId !== undefined ? projetoId : get().selectedProjectId;

      set({ isLoading: true, error: null });

      try {
        const filter = activeProjectId ? { projetoId: activeProjectId } : undefined;
        const localTasks = await db.getTasks(filter);

        set({
          tasks: localTasks,
          isLoading: false,
        });

        if (netMonitor.isConnected) {
          service
            .getTasks(activeProjectId ? { projetoId: activeProjectId } : undefined)
            .then(async (remoteTasks) => {
              if (Array.isArray(remoteTasks)) {
                const pendingMutations = await outbox.getPending();
                const pendingTaskIds = new Set(
                  pendingMutations.filter((m) => m.entityType === 'TASK').map((m) => m.entityId)
                );

                for (const remoteTask of remoteTasks) {
                  if (!pendingTaskIds.has(remoteTask.id)) {
                    await db.upsertTask({
                      ...remoteTask,
                      syncStatus: 'SYNCED',
                    });
                  }
                }

                const updatedTasks = await db.getTasks(filter);
                set({ tasks: updatedTasks });
              }
            })
            .catch(() => {
              // Ignore background fetch error
            });
        }

        return localTasks;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar tarefas locais';
        set({ isLoading: false, error: message });
        return [];
      }
    },

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setStatusFilter: (status: StatusTarefa | 'ALL') => {
      set({ statusFilter: status });
    },

    setPrioridadeFilter: (prioridade: PrioridadeTarefa | 'ALL') => {
      set({ prioridadeFilter: prioridade });
    },

    getFilteredTasks: () => {
      const { tasks, selectedProjectId, searchQuery, statusFilter, prioridadeFilter } = get();

      return tasks.filter((task) => {
        if (selectedProjectId && task.projetoId !== selectedProjectId) {
          return false;
        }

        if (statusFilter !== 'ALL' && task.status !== statusFilter) {
          return false;
        }

        if (prioridadeFilter !== 'ALL' && task.prioridade !== prioridadeFilter) {
          return false;
        }

        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase().trim();
          const titleMatch = task.titulo?.toLowerCase().includes(query);
          const descMatch = task.descricao?.toLowerCase().includes(query);
          const respMatch = task.responsavel?.toLowerCase().includes(query);

          if (!titleMatch && !descMatch && !respMatch) {
            return false;
          }
        }

        return true;
      });
    },

    refreshTasks: async () => {
      const { selectedProjectId } = get();
      set({ isRefreshing: true, error: null });

      try {
        if (netMonitor.isConnected) {
          await sync.syncAll(selectedProjectId || undefined);
        }

        const projects = await db.getProjects();
        const filter = selectedProjectId ? { projetoId: selectedProjectId } : undefined;
        const tasks = await db.getTasks(filter);

        set({
          projects: projects.length > 0 ? projects : get().projects,
          tasks,
          isRefreshing: false,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao atualizar dados';
        set({ isRefreshing: false, error: message });
      }
    },

    createTask: async (dto: CreateTaskDTO) => {
      const now = new Date().toISOString();
      const taskId = dto.id || generateUUID();
      const currentSelected = get().selectedProjectId;

      const newTask: Task = {
        id: taskId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        projetoId: dto.projetoId || currentSelected || 'comercial',
        status: dto.status || 'BACKLOG',
        prioridade: dto.prioridade || 'MEDIA',
        progresso: typeof dto.progresso === 'number' ? dto.progresso : 0,
        responsavel: dto.responsavel,
        responsavelId: dto.responsavelId,
        prazo: dto.prazo,
        syncStatus: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      await db.upsertTask(newTask);

      await outbox.enqueue({
        entityId: taskId,
        entityType: 'TASK',
        action: 'CREATE',
        payload: {
          titulo: newTask.titulo,
          descricao: newTask.descricao,
          projetoId: newTask.projetoId,
          status: newTask.status,
          prioridade: newTask.prioridade,
          progresso: newTask.progresso,
          responsavel: newTask.responsavel,
          responsavelId: newTask.responsavelId,
          prazo: newTask.prazo,
        },
      });

      const currentTasks = get().tasks;
      set({ tasks: [newTask, ...currentTasks.filter((t) => t.id !== taskId)] });

      if (netMonitor.isConnected) {
        sync.syncAll(newTask.projetoId).catch(() => {});
      }

      return newTask;
    },

    updateTaskStatus: async (id: string, status: StatusTarefa) => {
      const updated = await db.updateTaskStatus(id, status);
      if (!updated) return null;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: id,
        entityType: 'TASK',
        action: 'UPDATE_STATUS',
        payload: { status },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === id ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return optimisticTask;
    },

    updateTaskProgress: async (id: string, progresso: number) => {
      const updated = await db.updateTaskProgress(id, progresso);
      if (!updated) return null;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: id,
        entityType: 'TASK',
        action: 'UPDATE_PROGRESS',
        payload: { progresso: optimisticTask.progresso },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === id ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return optimisticTask;
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
      const updated = await db.updateTask(id, { ...updates, syncStatus: 'PENDING' });
      if (!updated) return null;

      const updateDto: UpdateTaskDTO = {
        titulo: updates.titulo,
        descricao: updates.descricao,
        projetoId: updates.projetoId,
        status: updates.status,
        prioridade: updates.prioridade,
        progresso: updates.progresso,
        responsavel: updates.responsavel,
        responsavelId: updates.responsavelId,
        prazo: updates.prazo,
      };

      await outbox.enqueue({
        entityId: id,
        entityType: 'TASK',
        action: 'UPDATE',
        payload: updateDto as Record<string, unknown>,
      });

      set({
        tasks: get().tasks.map((t) => (t.id === id ? updated : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(updated.projetoId).catch(() => {});
      }

      return updated;
    },

    deleteTask: async (id: string) => {
      const task = await db.getTaskById(id);
      const deleted = await db.deleteTask(id);
      if (!deleted) return false;

      await outbox.enqueue({
        entityId: id,
        entityType: 'TASK',
        action: 'DELETE',
        payload: { id },
      });

      set({
        tasks: get().tasks.filter((t) => t.id !== id),
      });

      if (netMonitor.isConnected && task) {
        sync.syncAll(task.projetoId).catch(() => {});
      }

      return true;
    },

    transferTask: async (id: string, targetProjectId: string, parentTaskId?: string) => {
      const currentTask = await db.getTaskById(id);
      const updated = await db.updateTask(id, {
        projetoId: targetProjectId,
        syncStatus: 'PENDING',
      });
      if (!updated) return null;

      if (parentTaskId && currentTask) {
        const parentTask = await db.getTaskById(parentTaskId);
        if (parentTask) {
          const subtask: SubTask = {
            id: generateUUID(),
            taskId: parentTaskId,
            titulo: currentTask.titulo,
            concluida: currentTask.status === 'CONCLUIDO',
          };
          await db.addSubtask(parentTaskId, subtask);
        }
      }

      const transferDto: TransferTaskDTO = {
        targetProjetoId: targetProjectId,
        parentTaskId,
      };

      await outbox.enqueue({
        entityId: id,
        entityType: 'TASK',
        action: 'TRANSFER',
        payload: {
          targetProjetoId: transferDto.targetProjetoId,
          parentTaskId: transferDto.parentTaskId,
        },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === id ? updated : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(targetProjectId).catch(() => {});
      }

      return updated;
    },

    addSubtask: async (taskId: string, titulo: string) => {
      const task = await db.getTaskById(taskId);
      if (!task) return null;

      const newSubtask: SubTask = {
        id: generateUUID(),
        taskId,
        titulo: titulo.trim(),
        concluida: false,
        ordem: (task.subtarefas?.length || 0) + 1,
      };

      const updated = await db.addSubtask(taskId, newSubtask);
      if (!updated) return null;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: taskId,
        entityType: 'TASK',
        action: 'UPDATE',
        payload: {
          subtarefas: optimisticTask.subtarefas,
        },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === taskId ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return optimisticTask;
    },

    toggleSubtask: async (taskId: string, subtaskId: string) => {
      const updated = await db.toggleSubtask(taskId, subtaskId);
      if (!updated) return null;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: taskId,
        entityType: 'TASK',
        action: 'UPDATE',
        payload: {
          subtarefas: optimisticTask.subtarefas,
        },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === taskId ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return optimisticTask;
    },

    deleteSubtask: async (taskId: string, subtaskId: string) => {
      const updated = await db.deleteSubtask(taskId, subtaskId);
      if (!updated) return null;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: taskId,
        entityType: 'TASK',
        action: 'UPDATE',
        payload: {
          subtarefas: optimisticTask.subtarefas,
        },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === taskId ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return optimisticTask;
    },

    addAttachment: async (
      taskId: string,
      file: { uri: string; nome?: string; mimeType?: string; tamanho?: number }
    ) => {
      const task = await db.getTaskById(taskId);
      if (!task) return null;

      const saved = await attachmentSvc.saveLocalAttachment(
        file.uri,
        file.nome,
        file.mimeType,
        file.tamanho
      );

      const newAttachment: TaskAttachment = {
        id: generateUUID(),
        taskId,
        uri: saved.uri,
        nome: saved.nome,
        tamanho: saved.tamanho,
        mimeType: saved.mimeType,
        syncStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      const updated = await db.addAttachment(taskId, newAttachment);
      if (!updated) return null;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: newAttachment.id,
        entityType: 'ATTACHMENT',
        action: 'UPLOAD_ATTACHMENT',
        payload: {
          taskId,
          attachmentId: newAttachment.id,
          uri: newAttachment.uri,
          nome: newAttachment.nome,
          tamanho: newAttachment.tamanho,
          mimeType: newAttachment.mimeType,
          createdAt: newAttachment.createdAt,
        },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === taskId ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return newAttachment;
    },

    deleteAttachment: async (taskId: string, attachmentId: string) => {
      const task = await db.getTaskById(taskId);
      if (!task) return false;

      const attachment = task.anexos?.find((a) => a.id === attachmentId);
      if (attachment) {
        await attachmentSvc.deleteLocalAttachment(attachment.uri).catch(() => {});
      }

      const updated = await db.deleteAttachment(taskId, attachmentId);
      if (!updated) return false;

      const optimisticTask: Task = {
        ...updated,
        syncStatus: 'PENDING',
      };
      await db.upsertTask(optimisticTask);

      await outbox.enqueue({
        entityId: attachmentId,
        entityType: 'ATTACHMENT',
        action: 'DELETE_ATTACHMENT',
        payload: {
          taskId,
          attachmentId,
        },
      });

      set({
        tasks: get().tasks.map((t) => (t.id === taskId ? optimisticTask : t)),
      });

      if (netMonitor.isConnected) {
        sync.syncAll(optimisticTask.projetoId).catch(() => {});
      }

      return true;
    },

    captureAndAddPhoto: async (taskId: string) => {
      const picked = await attachmentSvc.pickImageFromCamera();
      if (!picked) return null;

      return get().addAttachment(taskId, picked);
    },

    pickAndAddPhoto: async (taskId: string) => {
      const picked = await attachmentSvc.pickImageFromLibrary();
      if (!picked) return null;

      return get().addAttachment(taskId, picked);
    },

    clearError: () => set({ error: null }),
  }));
};

export const useTasksStore = createTasksStore();
