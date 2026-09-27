import { localStorage } from '../../core/storage/local-storage';
import { OutboxMutation } from '../../types';
import { generateUUID } from '../../utils/uuid';

export const OUTBOX_STORAGE_KEY = '@larvifort:outbox';

export interface EnqueueMutationParams {
  id?: string;
  entityId: string;
  entityType: OutboxMutation['entityType'];
  action: OutboxMutation['action'];
  payload: Record<string, unknown>;
  createdAt?: string;
}

export class OutboxQueue {
  async getAll(): Promise<OutboxMutation[]> {
    return (await localStorage.getItem<OutboxMutation[]>(OUTBOX_STORAGE_KEY)) || [];
  }

  async saveAll(mutations: OutboxMutation[]): Promise<void> {
    await localStorage.setItem(OUTBOX_STORAGE_KEY, mutations);
  }

  async enqueue(params: EnqueueMutationParams): Promise<OutboxMutation> {
    const mutations = [...(await this.getAll())];
    const mutation: OutboxMutation = {
      id: params.id || generateUUID(),
      entityId: params.entityId,
      entityType: params.entityType,
      action: params.action,
      payload: params.payload,
      createdAt: params.createdAt || new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
    };

    mutations.push(mutation);
    await this.saveAll(mutations);
    return mutation;
  }

  async getPending(): Promise<OutboxMutation[]> {
    const mutations = await this.getAll();
    return mutations
      .filter((m) => m.status === 'PENDING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async peek(): Promise<OutboxMutation | null> {
    const pending = await this.getPending();
    return pending.length > 0 ? pending[0] : null;
  }

  async getNextPending(): Promise<OutboxMutation | null> {
    return this.peek();
  }

  async getById(id: string): Promise<OutboxMutation | null> {
    const mutations = await this.getAll();
    return mutations.find((m) => m.id === id) || null;
  }

  async getByStatus(status: OutboxMutation['status']): Promise<OutboxMutation[]> {
    const mutations = await this.getAll();
    return mutations.filter((m) => m.status === status);
  }

  async getByEntityId(entityId: string): Promise<OutboxMutation[]> {
    const mutations = await this.getAll();
    return mutations.filter((m) => m.entityId === entityId);
  }

  async updateStatus(
    id: string,
    status: OutboxMutation['status'],
    errorMessage?: string
  ): Promise<OutboxMutation | null> {
    const mutations = [...(await this.getAll())];
    const index = mutations.findIndex((m) => m.id === id);
    if (index === -1) return null;

    mutations[index] = {
      ...mutations[index],
      status,
      errorMessage: errorMessage ?? mutations[index].errorMessage,
    };

    await this.saveAll(mutations);
    return mutations[index];
  }

  async incrementRetry(id: string, errorMessage?: string, maxRetries = 5): Promise<OutboxMutation | null> {
    const mutations = [...(await this.getAll())];
    const index = mutations.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const nextRetry = (mutations[index].retryCount || 0) + 1;
    const isError = nextRetry >= maxRetries;

    mutations[index] = {
      ...mutations[index],
      retryCount: nextRetry,
      errorMessage: errorMessage ?? mutations[index].errorMessage,
      status: isError ? 'ERROR' : 'PENDING',
    };

    await this.saveAll(mutations);
    return mutations[index];
  }

  async remove(id: string): Promise<boolean> {
    const mutations = await this.getAll();
    const filtered = mutations.filter((m) => m.id !== id);
    if (filtered.length === mutations.length) return false;

    await this.saveAll(filtered);
    return true;
  }

  async dequeue(id: string): Promise<boolean> {
    return this.remove(id);
  }

  async removeByEntityId(entityId: string): Promise<number> {
    const mutations = await this.getAll();
    const filtered = mutations.filter((m) => m.entityId !== entityId);
    const removedCount = mutations.length - filtered.length;
    if (removedCount > 0) {
      await this.saveAll(filtered);
    }
    return removedCount;
  }

  async getStats(): Promise<{ total: number; pending: number; syncing: number; error: number }> {
    const mutations = await this.getAll();
    return {
      total: mutations.length,
      pending: mutations.filter((m) => m.status === 'PENDING').length,
      syncing: mutations.filter((m) => m.status === 'SYNCING').length,
      error: mutations.filter((m) => m.status === 'ERROR').length,
    };
  }

  async clear(): Promise<void> {
    await localStorage.removeItem(OUTBOX_STORAGE_KEY);
  }
}

export const outboxQueue = new OutboxQueue();
