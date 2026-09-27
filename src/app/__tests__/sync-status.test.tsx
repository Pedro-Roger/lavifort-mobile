import React from 'react';
import { Alert } from 'react-native';
import renderer from 'react-test-renderer';
import SyncStatusScreen from '../sync-status';
import { useSyncStore } from '../../stores/sync.store';
import { OutboxMutation } from '../../types';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe('SyncStatusScreen (Offline & Outbox Inspection Panel)', () => {
  const mockInit = jest.fn().mockResolvedValue(undefined);
  const mockLoadMutations = jest.fn().mockResolvedValue(undefined);
  const mockSyncNow = jest.fn().mockResolvedValue(undefined);
  const mockRetryErrors = jest.fn().mockResolvedValue(undefined);
  const mockRetryMutation = jest.fn().mockResolvedValue(undefined);
  const mockRemoveMutation = jest.fn().mockResolvedValue(undefined);
  const mockRefreshStatus = jest.fn().mockResolvedValue(undefined);
  const mockClearOutbox = jest.fn().mockResolvedValue(undefined);

  const sampleMutations: OutboxMutation[] = [
    {
      id: 'mut-1',
      entityId: 'task-100',
      entityType: 'TASK',
      action: 'CREATE',
      payload: { titulo: 'Coleta de Amostra Viveiro B' },
      createdAt: '2026-09-09T10:00:00.000Z',
      retryCount: 0,
      status: 'PENDING',
    },
    {
      id: 'mut-2',
      entityId: 'task-200',
      entityType: 'TASK',
      action: 'UPDATE_STATUS',
      payload: { status: 'CONCLUIDO' },
      createdAt: '2026-09-09T10:15:00.000Z',
      retryCount: 5,
      status: 'ERROR',
      errorMessage: 'Tarefa arquivada no servidor',
    },
  ];

  let currentTree: renderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    renderer.act(() => {
      useSyncStore.setState({
        isConnected: true,
        isSyncing: false,
        pendingCount: 1,
        errorCount: 1,
        lastSyncedAt: '2026-09-09T10:30:00.000Z',
        mutations: sampleMutations,
        init: mockInit,
        loadMutations: mockLoadMutations,
        syncNow: mockSyncNow,
        retryErrors: mockRetryErrors,
        retryMutation: mockRetryMutation,
        removeMutation: mockRemoveMutation,
        refreshStatus: mockRefreshStatus,
        clearOutbox: mockClearOutbox,
      });
    });
  });

  afterEach(() => {
    if (currentTree) {
      renderer.act(() => {
        currentTree?.unmount();
      });
      currentTree = undefined;
    }
  });

  it('renders overview card, connectivity, metrics, and outbox mutations', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    expect(currentTree).toBeDefined();
    const root = currentTree!.root;

    expect(root.findByProps({ testID: 'sync-overview-card' })).toBeDefined();
    expect(root.findByProps({ testID: 'sync-now-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'outbox-item-mut-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'outbox-item-mut-2' })).toBeDefined();

    const str = JSON.stringify(currentTree!.toJSON());
    expect(str).toContain('Total na Fila');
    expect(str).toContain('Pendentes');
    expect(str).toContain('Erros / Conflitos');
    expect(str).toContain('Tarefa arquivada no servidor');
  });

  it('filters outbox list by status tabs', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    const filterPending = root.findByProps({ testID: 'filter-pending' });

    await renderer.act(async () => {
      filterPending.props.onPress();
    });

    expect(root.findByProps({ testID: 'outbox-item-mut-1' })).toBeDefined();
    expect(() => root.findByProps({ testID: 'outbox-item-mut-2' })).toThrow();

    const filterError = root.findByProps({ testID: 'filter-error' });
    await renderer.act(async () => {
      filterError.props.onPress();
    });

    expect(root.findByProps({ testID: 'outbox-item-mut-2' })).toBeDefined();
    expect(() => root.findByProps({ testID: 'outbox-item-mut-1' })).toThrow();
  });

  it('triggers manual sync when Sincronizar Agora is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    const syncButton = root.findByProps({ testID: 'sync-now-button' });

    await renderer.act(async () => {
      syncButton.props.onPress();
    });

    expect(mockSyncNow).toHaveBeenCalledTimes(1);
  });

  it('alerts user when trying to sync while offline', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderer.act(() => {
      useSyncStore.setState({ isConnected: false });
    });

    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    const syncButton = root.findByProps({ testID: 'sync-now-button' });

    await renderer.act(async () => {
      syncButton.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Modo Offline',
      expect.stringContaining('Conecte-se à internet')
    );
    expect(mockSyncNow).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('triggers retry all errors when button is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    const retryAllBtn = root.findByProps({ testID: 'retry-all-errors-button' });

    await renderer.act(async () => {
      retryAllBtn.props.onPress();
    });

    expect(mockRetryErrors).toHaveBeenCalledTimes(1);
  });

  it('navigates back when back button is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    const backBtn = root.findByProps({ testID: 'sync-back-button' });

    await renderer.act(async () => {
      backBtn.props.onPress();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('calls refreshStatus when Atualizar button is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    const refreshBtn = root.findByProps({ testID: 'sync-refresh-button' });

    await renderer.act(async () => {
      refreshBtn.props.onPress();
    });

    expect(mockRefreshStatus).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no mutations exist in active filter', async () => {
    renderer.act(() => {
      useSyncStore.setState({
        mutations: [],
        pendingCount: 0,
        errorCount: 0,
      });
    });

    await renderer.act(async () => {
      currentTree = renderer.create(<SyncStatusScreen />);
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'empty-outbox-state' })).toBeDefined();
  });
});
