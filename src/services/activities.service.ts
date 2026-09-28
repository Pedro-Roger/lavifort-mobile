import { apiClient, normalizeApiResponse } from './api';
import {
  Task,
  TaskActivityConfirmation,
  ConfirmActivityInput,
} from '../types';

/**
 * Atividades de campo (tasks tipo COMPROMISSO).
 *
 * Alinhamento TechLead: fluxo direto, sem seleção de progresso intermediário
 * ('Iniciar' / 'Em andamento'). Estados terminais: Concluir / Não executada.
 * "Não executada" é estado de filtro — o backend só expõe a mutação de
 * confirmação (POST /tasks/:id/confirm-activity).
 */
export const activitiesService = {
  /**
   * Lista atividades de campo. GET /tasks não aceita filtro `tipo`,
   * então filtra COMPROMISSO no cliente (resposta inclui `tipo`).
   */
  async getActivities(): Promise<Task[]> {
    const response = await apiClient.get<Task[] | { data: Task[] }>('/tasks');
    const data = normalizeApiResponse<Task[]>(response.data);
    const list = Array.isArray(data) ? data : [];
    return list.filter((task) => task.tipo === 'COMPROMISSO');
  },

  /**
   * Conclui a atividade (check-in com geolocalização).
   * Backend exige { latitude, longitude, accuracyMeters }.
   * Retorna 409 se já confirmada, 403 sem permissão, 400 se não-COMPROMISSO.
   */
  async confirmActivity(
    id: string,
    coords: ConfirmActivityInput
  ): Promise<TaskActivityConfirmation> {
    const response = await apiClient.post<
      TaskActivityConfirmation | { data: TaskActivityConfirmation }
    >(`/tasks/${id}/confirm-activity`, coords);
    return normalizeApiResponse<TaskActivityConfirmation>(response.data);
  },
};
