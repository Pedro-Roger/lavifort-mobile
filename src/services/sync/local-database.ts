import { localStorage } from '../../core/storage/local-storage';
import {
  Task,
  Project,
  StatusTarefa,
  PrioridadeTarefa,
  SubTask,
  TaskAttachment,
  TaskSyncStatus,
} from '../../types';

export const STORAGE_KEYS = {
  TASKS: '@larvifort:tasks',
  PROJECTS: '@larvifort:projects',
} as const;

export interface TaskFilter {
  projetoId?: string;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  search?: string;
}

export class LocalDatabase {
  // ==========================================
  // Tasks
  // ==========================================

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const tasks = (await localStorage.getItem<Task[]>(STORAGE_KEYS.TASKS)) || [];

    if (!filter) return tasks;

    return tasks.filter((task) => {
      if (filter.projetoId && task.projetoId !== filter.projetoId) {
        return false;
      }
      if (filter.status && task.status !== filter.status) {
        return false;
      }
      if (filter.prioridade && task.prioridade !== filter.prioridade) {
        return false;
      }
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const titleMatch = task.titulo?.toLowerCase().includes(query);
        const descMatch = task.descricao?.toLowerCase().includes(query);
        const respMatch = task.responsavel?.toLowerCase().includes(query);
        const addrMatch = task.endereco?.toLowerCase().includes(query);
        const clientMatch = task.clienteName?.toLowerCase().includes(query);
        const refMatch = task.referenceCode?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !respMatch && !addrMatch && !clientMatch && !refMatch) {
          return false;
        }
      }
      return true;
    });
  }

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === id) || null;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await localStorage.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  async upsertTask(task: Task): Promise<Task> {
    const tasks = [...(await this.getTasks())];
    const now = new Date().toISOString();
    const index = tasks.findIndex((t) => t.id === task.id);

    const taskWithTimestamps: Task = {
      ...task,
      createdAt: task.createdAt || now,
      updatedAt: now,
    };

    if (index >= 0) {
      tasks[index] = {
        ...tasks[index],
        ...taskWithTimestamps,
      };
    } else {
      tasks.push(taskWithTimestamps);
    }

    await this.saveTasks(tasks);
    return index >= 0 ? tasks[index] : taskWithTimestamps;
  }

  async updateTaskStatus(id: string, status: StatusTarefa): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) return null;

    const updated: Task = {
      ...task,
      status,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async updateTaskProgress(id: string, progresso: number): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) return null;

    const clamped = Math.max(0, Math.min(100, progresso));
    const updated: Task = {
      ...task,
      progresso: clamped,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) return null;

    const updated: Task = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;

    await this.saveTasks(filtered);
    return true;
  }

  async addSubtask(taskId: string, subtask: SubTask): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task) return null;

    const subtarefas = [...(task.subtarefas || []), subtask];
    const updated: Task = {
      ...task,
      subtarefas,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async toggleSubtask(taskId: string, subtaskId: string): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task || !task.subtarefas) return null;

    const subtarefas = task.subtarefas.map((st) =>
      st.id === subtaskId ? { ...st, concluida: !st.concluida } : st
    );
    const updated: Task = {
      ...task,
      subtarefas,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task || !task.subtarefas) return null;

    const subtarefas = task.subtarefas.filter((st) => st.id !== subtaskId);
    const updated: Task = {
      ...task,
      subtarefas,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async addAttachment(taskId: string, attachment: TaskAttachment): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task) return null;

    const anexos = [...(task.anexos || []), attachment];
    const updated: Task = {
      ...task,
      anexos,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async deleteAttachment(taskId: string, attachmentId: string): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task || !task.anexos) return null;

    const anexos = task.anexos.filter((a) => a.id !== attachmentId);
    const updated: Task = {
      ...task,
      anexos,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async updateAttachmentSyncStatus(
    taskId: string,
    attachmentId: string,
    syncStatus: TaskSyncStatus
  ): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task || !task.anexos) return null;

    const anexos = task.anexos.map((a) =>
      a.id === attachmentId ? { ...a, syncStatus } : a
    );
    const updated: Task = {
      ...task,
      anexos,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertTask(updated);
    return updated;
  }

  async clearTasks(): Promise<void> {
    await localStorage.removeItem(STORAGE_KEYS.TASKS);
  }

  // ==========================================
  // Projects
  // ==========================================

  async getProjects(): Promise<Project[]> {
    return (await localStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS)) || [];
  }

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  }

  async saveProjects(projects: Project[]): Promise<void> {
    await localStorage.setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  async upsertProject(project: Project): Promise<Project> {
    const projects = [...(await this.getProjects())];
    const now = new Date().toISOString();
    const index = projects.findIndex((p) => p.id === project.id);

    const projectWithTimestamps: Project = {
      ...project,
      createdAt: project.createdAt || now,
      updatedAt: now,
    };

    if (index >= 0) {
      projects[index] = {
        ...projects[index],
        ...projectWithTimestamps,
      };
    } else {
      projects.push(projectWithTimestamps);
    }

    await this.saveProjects(projects);
    return index >= 0 ? projects[index] : projectWithTimestamps;
  }

  async deleteProject(id: string): Promise<boolean> {
    const projects = await this.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;

    await this.saveProjects(filtered);
    return true;
  }

  async clearProjects(): Promise<void> {
    await localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  }

  // ==========================================
  // Reset / Clear All
  // ==========================================

  async clearAll(): Promise<void> {
    await Promise.all([this.clearTasks(), this.clearProjects()]);
  }
}

export const localDatabase = new LocalDatabase();
