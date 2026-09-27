import React from 'react';
import renderer from 'react-test-renderer';
import { KanbanColumn } from '../KanbanColumn';
import { Task } from '@/types';

describe('KanbanColumn', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      titulo: 'Vistoria Viveiro 1',
      descricao: 'Checar oxigenação da água',
      projetoId: 'operacoes',
      status: 'BACKLOG',
      prioridade: 'ALTA',
      progresso: 0,
      responsavel: 'João Silva',
      prazo: '2026-09-20',
    },
    {
      id: 'task-2',
      titulo: 'Vistoria Viveiro 2',
      descricao: 'Checar PH',
      projetoId: 'operacoes',
      status: 'BACKLOG',
      prioridade: 'MEDIA',
      progresso: 25,
      responsavel: 'Maria Santos',
    },
  ];

  it('renders column header with status dot, title, and count badge', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <KanbanColumn status="BACKLOG" tasks={sampleTasks} />
      );
    });

    const root = tree!.root;

    expect(root.findByProps({ testID: 'kanban-column-header-BACKLOG' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-status-dot-BACKLOG' })).toBeDefined();

    const countBadge = root.findByProps({ testID: 'kanban-column-count-BACKLOG' });
    expect(countBadge).toBeDefined();

    const countText = countBadge.findByType('Text' as any);
    expect(countText.props.children).toBe(2);
  });

  it('renders task cards for all tasks in the column', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <KanbanColumn status="BACKLOG" tasks={sampleTasks} />
      );
    });

    const root = tree!.root;

    expect(root.findByProps({ testID: 'kanban-task-task-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'kanban-task-task-2' })).toBeDefined();
  });

  it('renders empty placeholder when no tasks exist for this status', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <KanbanColumn status="CONCLUIDO" tasks={[]} />
      );
    });

    const root = tree!.root;

    expect(root.findByProps({ testID: 'kanban-column-empty-CONCLUIDO' })).toBeDefined();
  });

  it('invokes onTaskPress when a task card is tapped', () => {
    const mockOnTaskPress = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <KanbanColumn
          status="BACKLOG"
          tasks={sampleTasks}
          onTaskPress={mockOnTaskPress}
        />
      );
    });

    const root = tree!.root;
    const taskCard = root.findByProps({ testID: 'kanban-task-task-1' });

    renderer.act(() => {
      taskCard.props.onPress(sampleTasks[0]);
    });

    expect(mockOnTaskPress).toHaveBeenCalledWith(sampleTasks[0]);
  });
});
