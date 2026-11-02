import { groupVisits } from '../visits';
import { Appointment } from '@/types';

const mk = (id: string, data: string, extra: Partial<Appointment> = {}): Appointment =>
  ({ id, tipo: 'VISITA', titulo: id, data, horario: null, ...extra }) as Appointment;

describe('groupVisits', () => {
  const now = new Date(2026, 10, 1, 10, 0); // 01/11/2026 local
  it('separa hoje, próximas e concluídas; ignora reuniões', () => {
    const list = [
      mk('a', '2026-11-01T00:00:00.000Z'),
      mk('b', '2026-11-05T00:00:00.000Z'),
      mk('c', '2026-10-30T00:00:00.000Z', { concludedAt: '2026-10-30T12:00:00Z' }),
      mk('d', '2026-11-02T00:00:00.000Z'),
      { ...mk('r', '2026-11-01T00:00:00.000Z'), tipo: 'REUNIAO' } as Appointment,
      mk('e', '2026-10-31T00:00:00.000Z'),
    ];
    const [hoje, prox, conc] = groupVisits(list, { d: '2026-11-01T09:00:00Z' }, now);
    expect(hoje.data.map((x) => x.id)).toEqual(['e', 'a']);
    expect(prox.data.map((x) => x.id)).toEqual(['b']);
    expect(conc.data.map((x) => x.id).sort()).toEqual(['c', 'd']);
  });
});
