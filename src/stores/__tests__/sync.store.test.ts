import { createSyncStore } from '../sync.store';
import { SyncEngine } from '../../services/sync/sync-engine';
import { outboxQueue } from '../../services/sync/outbox-queue';
import { OutboxMutation } from '../../types';

jest.mock('../../services/sync/outbox-queue', () => ({
  outboxQueue: {
    clear: jest.fn(),
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

describe('SyncStore', () => {
  let mockEngine: jest.Mocked<SyncEngine>;
  let listenerCb: any = null;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEngine = {
      init: jest.fn().mockResolvedValue(undefined),
      addListener: jest.fn().mockImplementation((cb) => {
        listenerCb = cb;
        return () => {
          listenerCb = null;
        };
      }),
      removeListener: jest.fn(),
      getSyncStatus: jest.fn().mockResolvedValue({
        isConnected: true,
        isSyncing: false,
        pendingCount: 2,
        errorCount: 1,
        lastSyncedAt: '2026-09-09T12:00:00Z',
      }),
      syncAll: jest.fn().mockResolvedValue(undefined),
      retryErrors: jest.fn().mockResolvedValue(undefined),
      retryMutation: jest.fn().mockResolvedValue(undefined),
      removeMutation: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SyncEngine>;
  });

  it('initializes and subscribes to engine updates', async () => {
    const mockMutations: OutboxMutation[] = [
      {
        id: 'mut-1',
        entityId: 'task-1',
        entityType: 'TASK',
        action: 'CREATE',
        payload: { titulo: 'Test' },
        createdAt: '2026-09-09T12:00:00Z',
        retryCount: 0,
        status: 'PENDING',
      },
    ];
    (outboxQueue.getAll as jest.Mock).mockResolvedValue(mockMutations);

    const useStore = createSyncStore(mockEngine);
    const store = useStore.getState();

    await store.init();

    expect(mockEngine.init).toHaveBeenCalled();
    expect(mockEngine.addListener).toHaveBeenCalled();

    const state = useStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.pendingCount).toBe(2);
    expect(state.errorCount).toBe(1);
    expect(state.lastSyncedAt).toBe('2026-09-09T12:00:00Z');
    expect(state.mutations).toHaveLength(1);

    if (listenerCb) {
      listenerCb({
        isConnected: false,
        isSyncing: true,
        pendingCount: 5,
        errorCount: 2,
        lastSyncedAt: '2026-09-09T13:00:00Z',
      });
      const updatedState = useStore.getState();
      expect(updatedState.isConnected).toBe(false);
      expect(updatedState.isSyncing).toBe(true);
      expect(updatedState.pendingCount).toBe(5);
    }
  });

  it('triggers syncNow and updates status', async () => {
    const useStore = createSyncStore(mockEngine);
    const store = useStore.getState();

    await store.syncNow('proj-1');

    expect(mockEngine.syncAll).toHaveBeenCalledWith('proj-1');
    expect(mockEngine.getSyncStatus).toHaveBeenCalled();
  });

  it('retries errors and refreshes status', async () => {
    const useStore = createSyncStore(mockEngine);
    const store = useStore.getState();

    await store.retryErrors();

    expect(mockEngine.retryErrors).toHaveBeenCalled();
    expect(mockEngine.getSyncStatus).toHaveBeenCalled();
  });

  it('retries a single mutation and refreshes status', async () => {
    const useStore = createSyncStore(mockEngine);
    const store = useStore.getState();

    await store.retryMutation('mut-1');

    expect(mockEngine.retryMutation).toHaveBeenCalledWith('mut-1');
    expect(mockEngine.getSyncStatus).toHaveBeenCalled();
  });

  it('removes a single mutation and refreshes status', async () => {
    const useStore = createSyncStore(mockEngine);
    const store = useStore.getState();

    await store.removeMutation('mut-1');

    expect(mockEngine.removeMutation).toHaveBeenCalledWith('mut-1');
    expect(mockEngine.getSyncStatus).toHaveBeenCalled();
  });

  it('clears outbox and refreshes status', async () => {
    const useStore = createSyncStore(mockEngine);
    const store = useStore.getState();

    await store.clearOutbox();

    expect(outboxQueue.clear).toHaveBeenCalled();
    expect(mockEngine.getSyncStatus).toHaveBeenCalled();
    expect(useStore.getState().mutations).toEqual([]);
  });
});
