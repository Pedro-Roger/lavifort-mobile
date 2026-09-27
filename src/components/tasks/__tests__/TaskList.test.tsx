import React from 'react';
import renderer from 'react-test-renderer';
import { TaskList } from '../TaskList';
import { Task } from '../../../types';

describe('TaskList Component', () => {
  const mockTasks: Task[] = [
    {
      id: 't-1',
      titulo: 'Instalar aerador no viveiro B',
      projetoId: 'operacoes',
      status: 'BACKLOG',
      prioridade: 'ALTA',
      progresso: 0,
      syncStatus: 'SYNCED',
    },
    {
      id: 't-2',
      titulo: 'Contatar cliente Fazenda Mar',
      projetoId: 'comercial',
      status: 'CONCLUIDO',
      prioridade: 'BAIXA',
      progresso: 100,
      syncStatus: 'SYNCED',
    },
  ];

  it('renders list of task cards', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <TaskList
          tasks={mockTasks}
          searchQuery=""
          onSearchChange={jest.fn()}
          selectedStatus="ALL"
          onStatusFilterChange={jest.fn()}
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;

    expect(root.findByProps({ testID: 'task-search-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'status-filter-ALL' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-item-t-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-item-t-2' })).toBeDefined();
  });

  it('renders empty component when tasks array is empty', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <TaskList
          tasks={[]}
          emptyTitle="Nenhuma tarefa encontrada"
          emptyMessage="Sem tarefas para o filtro selecionado."
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'task-list-empty' })).toBeDefined();
  });

  it('calls onStatusFilterChange when filter chip is pressed', () => {
    const onStatusFilterMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <TaskList
          tasks={mockTasks}
          selectedStatus="ALL"
          onStatusFilterChange={onStatusFilterMock}
        />
      );
    });

    const root = tree!.root;
    const backlogFilter = root.findByProps({ testID: 'status-filter-BACKLOG' });

    renderer.act(() => {
      backlogFilter.props.onPress();
    });

    expect(onStatusFilterMock).toHaveBeenCalledWith('BACKLOG');
  });

  it('calls onSearchChange when search input changes', () => {
    const onSearchMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <TaskList
          tasks={mockTasks}
          searchQuery=""
          onSearchChange={onSearchMock}
        />
      );
    });

    const root = tree!.root;
    const searchInput = root.findByProps({ testID: 'task-search-input' });

    renderer.act(() => {
      searchInput.props.onChangeText('aerador');
    });

    expect(onSearchMock).toHaveBeenCalledWith('aerador');
  });
});
