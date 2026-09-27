import React from 'react';
import renderer from 'react-test-renderer';
import { KanbanBoard } from '../KanbanBoard';
import { Task } from '@/types';

describe('KanbanBoard', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      titulo: 'Tarefa Backlog',
      projetoId: 'comercial',
      status: 'BACKLOG',
      prioridade: 'ALTA',
      progresso: 0,
    },
    {
      id: 'task-2',
      titulo: 'Tarefa Em Andamento',
      projetoId: 'comercial',
      status: 'EM_ANDAMENTO',
      prioridade: 'MEDIA',
      progresso: 40,
    },
    {
      id: 'task-3',
      titulo: 'Tarefa Em Revisão',
      projetoId: 'comercial',
      status: 'EM_REVISAO',
      prioridade: 'BAIXA',
      progresso: 80,
    },
    {
      id: 'task-4',
      titulo: 'Tarefa Concluída',
      projetoId: 'comercial',
      status: 'CONCLUIDO',
      prioridade: 'MEDIA',
      progresso: 100,
    },
  ];

  it('renders column tabs with correct task counts for each status', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(<KanbanBoard tasks={sampleTasks} />);
    });

    const root = tree!.root;

    expect(root.findByProps({ testID: 'kanban-tab-BACKLOG' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-tab-EM_ANDAMENTO' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-tab-EM_REVISAO' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-tab-CONCLUIDO' })).toBeDefined();

    const backlogCount = root.findByProps({ testID: 'kanban-tab-count-BACKLOG' });
    const countText = backlogCount.findByType('Text' as any);
    expect(countText.props.children).toBe(1);
  });

  it('renders default BACKLOG column initially and switches active column on tab tap', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(<KanbanBoard tasks={sampleTasks} />);
    });

    const root = tree!.root;

    expect(root.findByProps({ testID: 'kanban-column-BACKLOG' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-task-task-1' })).toBeDefined();

    const emAndamentoTab = root.findByProps({ testID: 'kanban-tab-EM_ANDAMENTO' });
    renderer.act(() => {
      emAndamentoTab.props.onPress();
    });

    expect(root.findByProps({ testID: 'kanban-column-EM_ANDAMENTO' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-task-task-2' })).toBeDefined();
  });

  it('renders loading state when isLoading is true and tasks are empty', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(<KanbanBoard tasks={[]} isLoading={true} />);
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'kanban-board-loading' })).toBeDefined();
  });

  it('renders search input when onSearchChange is provided', () => {
    const mockOnSearch = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <KanbanBoard
          tasks={sampleTasks}
          searchQuery="teste"
          onSearchChange={mockOnSearch}
        />
      );
    });

    const root = tree!.root;
    const searchInput = root.findByProps({ testID: 'kanban-search-input' });
    expect(searchInput).toBeDefined();

    renderer.act(() => {
      searchInput.props.onChangeText('novo termo');
    });

    expect(mockOnSearch).toHaveBeenCalledWith('novo termo');
  });

  it('supports controlled activeStatus and onStatusChange prop', () => {
    const mockOnStatusChange = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <KanbanBoard
          tasks={sampleTasks}
          activeStatus="EM_REVISAO"
          onStatusChange={mockOnStatusChange}
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'kanban-column-EM_REVISAO' })).toBeDefined();

    const concluidoTab = root.findByProps({ testID: 'kanban-tab-CONCLUIDO' });
    renderer.act(() => {
      concluidoTab.props.onPress();
    });

    expect(mockOnStatusChange).toHaveBeenCalledWith('CONCLUIDO');
  });
});
