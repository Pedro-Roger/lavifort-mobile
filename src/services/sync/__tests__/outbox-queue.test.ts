import { localStorage } from '../../../core/storage/local-storage';
import { outboxQueue } from '../outbox-queue';
import { OutboxMutation } from '../../../types';

jest.mock('../../../core/storage/local-storage', () => ({
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('OutboxQueue', () => {
  let mockMutations: OutboxMutation[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutations = [
      {
        id: 'mut-1',
        entityId: 'task-1',
        entityType: 'TASK',
        action: 'CREATE',
        payload: { titulo: 'Task 1' },
        createdAt: '2026-09-01T10:00:00.000Z',
        retryCount: 0,
        status: 'PENDING',
      },
      {
        id: 'mut-2',
        entityId: 'task-1',
        entityType: 'TASK',
        action: 'UPDATE_STATUS',
        payload: { status: 'EM_ANDAMENTO' },
        createdAt: '2026-09-01T10:05:00.000Z',
        retryCount: 0,
        status: 'PENDING',
      },
      {
        id: 'mut-3',
        entityId: 'task-2',
        entityType: 'TASK',
        action: 'CREATE',
        payload: { titulo: 'Task 2' },
        createdAt: '2026-09-01T10:10:00.000Z',
        retryCount: 1,
        status: 'ERROR',
        errorMessage: 'Network timeout',
      },
    ];
  });

  describe('enqueue', () => {
    it('enqueues a new mutation with generated UUID and default fields', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const enqueued = await outboxQueue.enqueue({
        entityId: 'task-3',
        entityType: 'TASK',
        action: 'CREATE',
        payload: { titulo: 'Task 3', projetoId: 'proj-1' },
      });

      expect(enqueued.id).toBeDefined();
      expect(enqueued.entityId).toBe('task-3');
      expect(enqueued.entityType).toBe('TASK');
      expect(enqueued.action).toBe('CREATE');
      expect(enqueued.status).toBe('PENDING');
      expect(enqueued.retryCount).toBe(0);
      expect(enqueued.createdAt).toBeDefined();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@larvifort:outbox',
        expect.arrayContaining([
          mockMutations[0],
          mockMutations[1],
          mockMutations[2],
          expect.objectContaining({ entityId: 'task-3', action: 'CREATE' }),
        ])
      );
    });

    it('enqueues with custom id if provided', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([]);

      const enqueued = await outboxQueue.enqueue({
        id: 'custom-id',
        entityId: 'task-4',
        entityType: 'TASK',
        action: 'UPDATE',
        payload: { titulo: 'Task 4' },
      });

      expect(enqueued.id).toBe('custom-id');
    });
  });

  describe('retrieval operations', () => {
    it('returns all mutations', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const all = await outboxQueue.getAll();
      expect(all).toEqual(mockMutations);
      expect(localStorage.getItem).toHaveBeenCalledWith('@larvifort:outbox');
    });

    it('returns empty array when outbox is empty', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const all = await outboxQueue.getAll();
      expect(all).toEqual([]);
    });

    it('returns only pending mutations ordered by FIFO (oldest first)', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([
        mockMutations[1], // 10:05:00
        mockMutations[2], // ERROR
        mockMutations[0], // 10:00:00
      ]);

      const pending = await outboxQueue.getPending();
      expect(pending).toHaveLength(2);
      expect(pending[0].id).toBe('mut-1');
      expect(pending[1].id).toBe('mut-2');
    });

    it('peeks the next pending mutation in FIFO order', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const next = await outboxQueue.peek();
      expect(next?.id).toBe('mut-1');

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);
      const nextPending = await outboxQueue.getNextPending();
      expect(nextPending?.id).toBe('mut-1');

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce([]);
      const emptyNext = await outboxQueue.peek();
      expect(emptyNext).toBeNull();
    });

    it('finds mutations by status via getByStatus', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const errors = await outboxQueue.getByStatus('ERROR');
      expect(errors).toHaveLength(1);
      expect(errors[0].id).toBe('mut-3');
    });

    it('finds mutation by id', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const mut = await outboxQueue.getById('mut-2');
      expect(mut?.id).toBe('mut-2');

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);
      const notFound = await outboxQueue.getById('non-existent');
      expect(notFound).toBeNull();
    });

    it('finds mutations by entityId', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const entityMuts = await outboxQueue.getByEntityId('task-1');
      expect(entityMuts).toHaveLength(2);
      expect(entityMuts.map((m) => m.id)).toEqual(['mut-1', 'mut-2']);
    });
  });

  describe('status updates and retries', () => {
    it('updates status of a mutation to SYNCING', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      await outboxQueue.updateStatus('mut-1', 'SYNCING');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@larvifort:outbox',
        expect.arrayContaining([
          expect.objectContaining({ id: 'mut-1', status: 'SYNCING' }),
        ])
      );
    });

    it('updates status of a mutation to ERROR with errorMessage', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      await outboxQueue.updateStatus('mut-1', 'ERROR', 'Validation 422');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@larvifort:outbox',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'mut-1',
            status: 'ERROR',
            errorMessage: 'Validation 422',
          }),
        ])
      );
    });

    it('increments retry count and sets status to PENDING or ERROR', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const updated = await outboxQueue.incrementRetry('mut-1', 'Network error');
      expect(updated?.retryCount).toBe(1);
      expect(updated?.errorMessage).toBe('Network error');
      expect(updated?.status).toBe('PENDING');
    });
  });

  describe('removal and stats', () => {
    it('removes mutation by id and supports dequeue alias', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const removed = await outboxQueue.remove('mut-1');
      expect(removed).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('@larvifort:outbox', [
        mockMutations[1],
        mockMutations[2],
      ]);

      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);
      const dequeued = await outboxQueue.dequeue('mut-1');
      expect(dequeued).toBe(true);
    });

    it('removes all mutations for a given entityId', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const removedCount = await outboxQueue.removeByEntityId('task-1');
      expect(removedCount).toBe(2);
      expect(localStorage.setItem).toHaveBeenCalledWith('@larvifort:outbox', [
        mockMutations[2],
      ]);
    });

    it('computes queue statistics accurately', async () => {
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMutations);

      const stats = await outboxQueue.getStats();
      expect(stats).toEqual({
        total: 3,
        pending: 2,
        syncing: 0,
        error: 1,
      });
    });

    it('clears all mutations', async () => {
      await outboxQueue.clear();
      expect(localStorage.removeItem).toHaveBeenCalledWith('@larvifort:outbox');
    });
  });
});
