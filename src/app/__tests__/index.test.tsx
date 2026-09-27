import React from 'react';
import renderer from 'react-test-renderer';
import IndexScreen from '../index';
import { useAuthStore } from '../../stores/auth.store';
import { useSyncStore } from '../../stores/sync.store';
import { useTasksStore } from '../../stores/tasks.store';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useSegments: () => [],
}));

describe('IndexScreen (Dashboard / Kanban / Task List)', () => {
  const mockInitSync = jest.fn().mockResolvedValue(undefined);
  const mockLoadProjects = jest.fn().mockResolvedValue([]);
  const mockLoadTasks = jest.fn().mockResolvedValue([]);
  const mockCreateTask = jest.fn().mockResolvedValue({ id: 'task-new' });
  const mockUpdateTaskStatus = jest.fn().mockResolvedValue({});
  let currentTree: renderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    renderer.act(() => {
      useAuthStore.setState({
        user: { id: 'u-1', nome: 'Operador Teste', email: 'op@larvifort.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      useSyncStore.setState({
        isConnected: true,
        isSyncing: false,
        pendingCount: 0,
        errorCount: 0,
        init: mockInitSync,
      });

      useTasksStore.setState({
        projects: [
          { id: 'comercial', nome: 'Comercial', setor: 'Comercial' },
          { id: 'operacoes', nome: 'Operações', setor: 'Operações' },
        ],
        selectedProjectId: 'comercial',
        tasks: [
          {
            id: 'task-1',
            titulo: 'Tarefa Principal',
            projetoId: 'comercial',
            status: 'BACKLOG',
            prioridade: 'ALTA',
            progresso: 10,
          },
        ],
        viewMode: 'kanban',
        isLoading: false,
        isRefreshing: false,
        searchQuery: '',
        statusFilter: 'ALL',
        loadProjects: mockLoadProjects,
        loadTasks: mockLoadTasks,
        createTask: mockCreateTask,
        updateTaskStatus: mockUpdateTaskStatus,
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

  it('renders header, project selector, view mode toggle, kanban board, and FAB by default', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<IndexScreen />);
    });

    expect(currentTree).toBeDefined();
    const root = currentTree!.root;

    expect(root.findByProps({ testID: 'app-header' })).toBeDefined();
    expect(root.findByProps({ testID: 'sync-status-header-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'project-selector' })).toBeDefined();
    expect(root.findByProps({ testID: 'view-mode-toggle' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-board' })).toBeDefined();
    expect(root.findByProps({ testID: 'logout-header-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-fab' })).toBeDefined();
  });

  it('renders task list when viewMode is switched to list', async () => {
    renderer.act(() => {
      useTasksStore.setState({ viewMode: 'list' });
    });

    await renderer.act(async () => {
      currentTree = renderer.create(<IndexScreen />);
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'task-list' })).toBeDefined();
  });

  it('opens CreateTaskModal when FAB is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<IndexScreen />);
    });

    const root = currentTree!.root;
    const fab = root.findByProps({ testID: 'create-task-fab' });

    await renderer.act(async () => {
      fab.props.onPress();
    });

    const createModal = root.findByProps({ testID: 'create-task-modal' });
    expect(createModal.props.visible).toBe(true);
  });

  it('opens TaskDetailModal when a task card is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(<IndexScreen />);
      await Promise.resolve();
    });

    const root = currentTree!.root;
    const taskCard = root.findByProps({ testID: 'kanban-task-task-1' });

    await renderer.act(async () => {
      taskCard.props.onPress();
    });

    const detailModal = root.findByProps({ testID: 'task-detail-modal' });
    expect(detailModal.props.visible).toBe(true);
  });
});
