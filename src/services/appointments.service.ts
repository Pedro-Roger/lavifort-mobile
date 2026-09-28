import { apiClient, normalizeApiResponse } from './api';
import {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../types';

/**
 * Serviço de Agenda — compromissos/agendamentos.
 *
 * Endpoints:
 * - GET /appointments (lista paginada com filtros)
 * - GET /appointments/calendario?mes=YYYY-MM (visão calendário)
 * - GET /appointments/:id (detalhe)
 * - POST /appointments (criar)
 * - PATCH /appointments/:id (atualizar)
 * - DELETE /appointments/:id (excluir)
 *
 * Paridade com o backend: a API aceita prefixo /appointments e /compromissos.
 */
export const appointmentsService = {
  /**
   * Lista compromissos com filtros opcionais.
   */
  async getAppointments(params?: {
    tipo?: string;
    de?: string;
    ate?: string;
    clienteId?: string;
    empresaId?: string;
    page?: number;
    limit?: number;
  }): Promise<Appointment[]> {
    const query: Record<string, string | number> = {};
    if (params?.tipo) query.tipo = params.tipo;
    if (params?.de) query.de = params.de;
    if (params?.ate) query.ate = params.ate;
    if (params?.clienteId) query.clienteId = params.clienteId;
    if (params?.empresaId) query.empresaId = params.empresaId;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;

    const response = await apiClient.get<
      Appointment[] | { data: Appointment[] }
    >('/appointments', { params: query });
    const data = normalizeApiResponse<Appointment[]>(response.data);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Retorna a contagem de compromissos por dia no mês informado.
   */
  async getCalendar(mes: string): Promise<{ date: string; count: number }[]> {
    const response = await apiClient.get<
      { date: string; count: number }[] | { data: { date: string; count: number }[] }
    >('/appointments/calendario', { params: { mes } });
    const data = normalizeApiResponse<{ date: string; count: number }[]>(
      response.data,
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * Retorna um compromisso pelo ID.
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await apiClient.get<
      Appointment | { data: Appointment }
    >(`/appointments/${id}`);
    return normalizeApiResponse<Appointment>(response.data);
  },

  /**
   * Cria um novo compromisso.
   */
  async createAppointment(
    input: CreateAppointmentInput,
  ): Promise<Appointment> {
    const response = await apiClient.post<
      Appointment | { data: Appointment }
    >('/appointments', input);
    return normalizeApiResponse<Appointment>(response.data);
  },

  /**
   * Atualiza um compromisso existente.
   */
  async updateAppointment(
    id: string,
    input: UpdateAppointmentInput,
  ): Promise<Appointment> {
    const response = await apiClient.patch<
      Appointment | { data: Appointment }
    >(`/appointments/${id}`, input);
    return normalizeApiResponse<Appointment>(response.data);
  },

  /**
   * Exclui um compromisso.
   */
  async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  },
};