import {
  formatDateUTC,
  formatDateTimeLocal,
  formatBRL,
  formatRelative,
  dayKeyUTC,
  todayKey,
} from '../format';

describe('format', () => {
  it('formatDateUTC não desloca o dia por fuso', () => {
    expect(formatDateUTC('2026-11-05T00:00:00.000Z')).toBe('05/11/2026');
    expect(formatDateUTC('2026-11-05T23:59:59.000Z')).toBe('05/11/2026');
    expect(formatDateUTC('2026-11-05')).toBe('05/11/2026');
  });

  it('formatDateUTC trata vazio e inválido', () => {
    expect(formatDateUTC(null)).toBe('—');
    expect(formatDateUTC(undefined)).toBe('—');
    expect(formatDateUTC('abc')).toBe('abc');
  });

  it('formatDateTimeLocal formata dd/mm/aaaa HH:mm', () => {
    const d = new Date(2026, 10, 5, 9, 7);
    expect(formatDateTimeLocal(d.toISOString())).toBe('05/11/2026 09:07');
    expect(formatDateTimeLocal(null)).toBe('—');
  });

  it('formatBRL', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50');
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(1234567.891)).toBe('R$ 1.234.567,89');
    expect(formatBRL(NaN)).toBe('R$ 0,00');
  });

  it('formatRelative', () => {
    const now = new Date('2026-11-01T12:00:00Z');
    expect(formatRelative('2026-11-01T11:59:50Z', now)).toBe('agora');
    expect(formatRelative('2026-11-01T11:30:00Z', now)).toBe('há 30 min');
    expect(formatRelative('2026-11-01T09:00:00Z', now)).toBe('há 3 h');
    expect(formatRelative('2026-10-31T11:00:00Z', now)).toBe('há 1 dia');
    expect(formatRelative('2026-10-29T12:00:00Z', now)).toBe('há 3 dias');
    expect(formatRelative(null, now)).toBe('—');
  });

  it('dayKeyUTC / todayKey', () => {
    expect(dayKeyUTC('2026-11-05T00:00:00.000Z')).toBe('2026-11-05');
    expect(todayKey(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
