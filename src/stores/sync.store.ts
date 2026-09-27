import { create } from 'zustand';
import { SyncStatusInfo, OutboxMutation } from '../types';
import { syncEngine, SyncEngine } from '../services/sync/sync-engine';
import { outboxQueue } from '../services/sync/outbox-queue';

export interface SyncState extends SyncStatusInfo {
  isInitialized: boolean;
  mutations: OutboxMutation[];
  init: () => Promise<void>;
  loadMutations: () => Promise<void>;
  syncNow: (projetoId?: string) => Promise<void>;
  retryErrors: () => Promise<void>;
  retryMutation: (id: string) => Promise<void>;
  removeMutation: (id: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  clearOutbox: () => Promise<void>;
}

export const createSyncStore = (engine: SyncEngine = syncEngine) =>
  create<SyncState>((set, get) => ({
    isConnected: true,
    isSyncing: false,
    pendingCount: 0,
    errorCount: 0,
    lastSyncedAt: null,
    isInitialized: false,
    mutations: [],

    loadMutations: async () => {
      const mutations = await outboxQueue.getAll();
      set({ mutations });
    },

    init: async () => {
      if (get().isInitialized) return;

      await engine.init();

      engine.addListener((status) => {
        set({
          isConnected: status.isConnected,
          isSyncing: status.isSyncing,
          pendingCount: status.pendingCount,
          errorCount: status.errorCount,
          lastSyncedAt: status.lastSyncedAt,
        });
        get().loadMutations();
      });

      const initialStatus = await engine.getSyncStatus();
      const initialMutations = await outboxQueue.getAll();
      set({
        isConnected: initialStatus.isConnected,
        isSyncing: initialStatus.isSyncing,
        pendingCount: initialStatus.pendingCount,
        errorCount: initialStatus.errorCount,
        lastSyncedAt: initialStatus.lastSyncedAt,
        isInitialized: true,
        mutations: initialMutations,
      });
    },

    syncNow: async (projetoId?: string) => {
      await engine.syncAll(projetoId);
      const status = await engine.getSyncStatus();
      const mutations = await outboxQueue.getAll();
      set({
        isConnected: status.isConnected,
        isSyncing: status.isSyncing,
        pendingCount: status.pendingCount,
        errorCount: status.errorCount,
        lastSyncedAt: status.lastSyncedAt,
        mutations,
      });
    },

    retryErrors: async () => {
      await engine.retryErrors();
      const status = await engine.getSyncStatus();
      const mutations = await outboxQueue.getAll();
      set({
        pendingCount: status.pendingCount,
        errorCount: status.errorCount,
        mutations,
      });
    },

    retryMutation: async (id: string) => {
      await engine.retryMutation(id);
      const status = await engine.getSyncStatus();
      const mutations = await outboxQueue.getAll();
      set({
        pendingCount: status.pendingCount,
        errorCount: status.errorCount,
        mutations,
      });
    },

    removeMutation: async (id: string) => {
      await engine.removeMutation(id);
      const status = await engine.getSyncStatus();
      const mutations = await outboxQueue.getAll();
      set({
        pendingCount: status.pendingCount,
        errorCount: status.errorCount,
        mutations,
      });
    },

    refreshStatus: async () => {
      const status = await engine.getSyncStatus();
      const mutations = await outboxQueue.getAll();
      set({
        isConnected: status.isConnected,
        isSyncing: status.isSyncing,
        pendingCount: status.pendingCount,
        errorCount: status.errorCount,
        lastSyncedAt: status.lastSyncedAt,
        mutations,
      });
    },

    clearOutbox: async () => {
      await outboxQueue.clear();
      const status = await engine.getSyncStatus();
      set({
        pendingCount: status.pendingCount,
        errorCount: status.errorCount,
        mutations: [],
      });
    },
  }));

export const useSyncStore = createSyncStore(syncEngine);
