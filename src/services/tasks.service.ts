import { apiClient, normalizeApiResponse } from './api';
import {
  Task,
  Project,
  CreateTaskDTO,
  UpdateTaskDTO,
  TransferTaskDTO,
  StatusTarefa,
} from '../types';

export interface TasksQueryFilter {
  projetoId?: string;
  status?: StatusTarefa;
  search?: string;
}

export const tasksService = {
  async getTasks(filter?: TasksQueryFilter): Promise<Task[]> {
    const params: Record<string, string> = {};
    if (filter?.projetoId) params.projetoId = filter.projetoId;
    if (filter?.status) params.status = filter.status;
    if (filter?.search) params.search = filter.search;

    const response = await apiClient.get<Task[] | { data: Task[] }>('/tasks', { params });
    const data = normalizeApiResponse<Task[]>(response.data);
    return Array.isArray(data) ? data : [];
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<Task | { data: Task }>(`/tasks/${id}`);
    return normalizeApiResponse<Task>(response.data);
  },

  async createTask(dto: CreateTaskDTO & { id?: string }): Promise<Task> {
    const response = await apiClient.post<Task | { data: Task }>('/tasks', dto);
    return normalizeApiResponse<Task>(response.data);
  },

  async updateTask(id: string, dto: UpdateTaskDTO): Promise<Task> {
    const response = await apiClient.patch<Task | { data: Task }>(`/tasks/${id}`, dto);
    return normalizeApiResponse<Task>(response.data);
  },

  async updateStatus(id: string, status: StatusTarefa): Promise<Task> {
    const response = await apiClient.patch<Task | { data: Task }>(`/tasks/${id}/status`, {
      status,
    });
    return normalizeApiResponse<Task>(response.data);
  },

  async updateProgresso(id: string, progresso: number): Promise<Task> {
    const response = await apiClient.patch<Task | { data: Task }>(`/tasks/${id}/progresso`, {
      progresso,
    });
    return normalizeApiResponse<Task>(response.data);
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[] | { data: Project[] }>('/tasks/projects');
    const data = normalizeApiResponse<Project[]>(response.data);
    return Array.isArray(data) ? data : [];
  },

  async transferTask(id: string, dto: TransferTaskDTO): Promise<Task> {
    const response = await apiClient.post<Task | { data: Task }>(`/tasks/${id}/transfer`, dto);
    return normalizeApiResponse<Task>(response.data);
  },
};
