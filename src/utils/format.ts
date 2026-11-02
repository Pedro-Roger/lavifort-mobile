const pad = (n: number) => String(n).padStart(2, '0');

/**
 * dd/mm/aaaa em UTC. O backend guarda o dia sem fuso (meia-noite/12h UTC),
 * então ler em fuso local deslocaria o dia.
 */
export function formatDateUTC(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '—';
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** dd/mm/aaaa HH:mm no fuso do aparelho — para instantes reais (ex.: visita concluída). */
export function formatDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** R$ 1.234,56 sem depender de ICU do Hermes. */
export function formatBRL(value: number | null | undefined): string {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${n < 0 ? '-' : ''}R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}

/** "agora", "há 5 min", "há 3 h", "há 2 dias". */
export function formatRelative(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return '—';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return '—';
  const min = Math.floor((now.getTime() - t) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

/** Chave yyyy-mm-dd UTC (comparação de "hoje" com datas sem fuso do backend). */
export function dayKeyUTC(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Chave yyyy-mm-dd do "hoje" no fuso do aparelho (o dia que a vendedora vê). */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
