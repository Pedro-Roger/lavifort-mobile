import React from 'react';
import renderer from 'react-test-renderer';
import { TaskCard } from '../TaskCard';
import { Task } from '../../../types';

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: 'task-100',
    titulo: 'Vistoria Viveiro 5',
    descricao: 'Verificar oxigenação e biometria dos camarões',
    projetoId: 'operacoes',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    progresso: 60,
    responsavel: 'Pedro Silva',
    prazo: '2026-09-20',
    syncStatus: 'PENDING',
    subtarefas: [
      { id: 'sub-1', taskId: 'task-100', titulo: 'Medir O2', concluida: true },
      { id: 'sub-2', taskId: 'task-100', titulo: 'Pesar amostra', concluida: false },
    ],
  };

  it('renders task details, status, priority, progress, assignee, and pending sync indicator', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(<TaskCard task={mockTask} />);
    });

    expect(tree).toBeDefined();
    const root = tree!.root;

    expect(root.findByProps({ testID: 'task-card-task-100' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-status-badge-task-100' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-priority-badge-task-100' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-sync-pending-task-100' })).toBeDefined();
  });

  it('handles onPress event when provided', () => {
    const onPressMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(<TaskCard task={mockTask} onPress={onPressMock} />);
    });

    const root = tree!.root;
    const card = root.findByProps({ testID: 'task-card-task-100' });

    renderer.act(() => {
      card.props.onPress();
    });

    expect(onPressMock).toHaveBeenCalledWith(mockTask);
  });
});
