import { localStorage } from '../core/storage/local-storage';

/**
 * Fila offline genérica (offline-first para entidades fora do sync engine de
 * tarefas: clientes e pedidos criados em campo sem conexão).
 *
 * Padrão igual ao checkin.service: gravação local imediata e síncrona com a UI,
 * drenagem FIFO contra a API quando a conexão volta.
 */
export class OfflineQueue<T extends { id: string }> {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  async getAll(): Promise<T[]> {
    return (await localStorage.getItem<T[]>(this.storageKey)) || [];
  }

  async enqueue(item: T): Promise<T> {
    const all = await this.getAll();
    all.push(item);
    await localStorage.setItem(this.storageKey, all);
    return item;
  }

  async remove(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter((item) => item.id !== id);
    if (filtered.length === all.length) return false;
    await localStorage.setItem(this.storageKey, filtered);
    return true;
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  async clear(): Promise<void> {
    await localStorage.removeItem(this.storageKey);
  }
}