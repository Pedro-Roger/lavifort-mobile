import { Appointment } from '@/types';
import { dayKeyUTC, todayKey } from '@/utils/format';

export interface VisitSection {
  key: 'hoje' | 'proximas' | 'concluidas';
  title: string;
  data: Appointment[];
}

const byDateTime = (a: Appointment, b: Appointment) =>
  `${dayKeyUTC(a.data)} ${a.horario ?? ''}`.localeCompare(`${dayKeyUTC(b.data)} ${b.horario ?? ''}`);

/**
 * Só VISITA. Concluída = backend (concludedAt) ou pendente de envio (outbox).
 * "Hoje"/"próximas" comparam o dia sem fuso do backend (UTC) com o dia local.
 * Atrasadas não concluídas ficam em "Hoje" para não sumirem da vendedora.
 */
export function groupVisits(
  appointments: Appointment[],
  pending: Record<string, string>,
  now: Date = new Date(),
): VisitSection[] {
  const today = todayKey(now);
  const visits = appointments.filter((a) => a.tipo === 'VISITA');
  const isDone = (a: Appointment) => Boolean(a.concludedAt) || Boolean(pending[a.id]);
  const open = visits.filter((a) => !isDone(a));
  return [
    { key: 'hoje' as const, title: 'Hoje', data: open.filter((a) => dayKeyUTC(a.data) <= today).sort(byDateTime) },
    { key: 'proximas' as const, title: 'Próximas', data: open.filter((a) => dayKeyUTC(a.data) > today).sort(byDateTime) },
    { key: 'concluidas' as const, title: 'Concluídas', data: visits.filter(isDone).sort((a, b) => byDateTime(b, a)) },
  ];
}
