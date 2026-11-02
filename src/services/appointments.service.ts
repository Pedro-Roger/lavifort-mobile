import { apiClient, normalizeApiResponse } from './api';
import { outboxQueue } from './sync/outbox-queue';
import { networkMonitor } from './sync/network-monitor';
import {
  Appointment,
  AppointmentCheckinInput,
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
 * - PATCH /appointments/:id/checkin (concluir visita com localização)
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
   * Conclui a visita com a localização capturada no toque.
   * Sem rede (ou falha de rede), grava na outbox com as coordenadas e o
   * clientTimestamp originais; o sync-engine reenvia depois.
   * 409 = já concluída (idempotente) → trata como sincronizado.
   */
  async concludeVisit(
    id: string,
    input: AppointmentCheckinInput,
  ): Promise<{ status: 'SYNCED'; appointment: Appointment | null } | { status: 'QUEUED' }> {
    const enqueue = async () => {
      const already = await this.getPendingCheckins();
      if (!already[id]) {
        await outboxQueue.enqueue({
          entityId: id,
          entityType: 'APPOINTMENT',
          action: 'CHECKIN',
          payload: { ...input },
        });
      }
      return { status: 'QUEUED' as const };
    };

    if (!networkMonitor.isConnected) return enqueue();
    try {
      return { status: 'SYNCED', appointment: await this.sendCheckin(id, input) };
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) return { status: 'SYNCED', appointment: null };
      if (status === undefined) return enqueue(); // sem resposta = rede
      throw err;
    }
  },

  /** PATCH cru, usado também pelo sync-engine. */
  async sendCheckin(id: string, input: AppointmentCheckinInput): Promise<Appointment> {
    const response = await apiClient.patch<Appointment | { data: Appointment }>(
      `/appointments/${id}/checkin`,
      input,
    );
    return normalizeApiResponse<Appointment>(response.data);
  },

  /** Conclusões aguardando envio: appointmentId → clientTimestamp do toque. */
  async getPendingCheckins(): Promise<Record<string, string>> {
    const all = await outboxQueue.getAll();
    const map: Record<string, string> = {};
    all
      .filter((m) => m.entityType === 'APPOINTMENT' && m.action === 'CHECKIN')
      .forEach((m) => {
        map[m.entityId] = String(m.payload.clientTimestamp ?? m.createdAt);
      });
    return map;
  },

  /**
   * Exclui um compromisso.
   */
  async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  },
};