import React from 'react';
import renderer from 'react-test-renderer';
import { TransferTaskModal } from '../TransferTaskModal';
import { Task, Project } from '../../../types';

describe('TransferTaskModal Component', () => {
  const mockTask: Task = {
    id: 'task-1',
    titulo: 'Vistoria Viveiro 01',
    descricao: 'Verificar salinidade',
    projetoId: 'comercial',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    progresso: 50,
  };

  const mockProjects: Project[] = [
    { id: 'comercial', nome: 'Comercial', setor: 'Comercial' },
    { id: 'operacoes', nome: 'Operações', setor: 'Operações' },
    { id: 'financeiro', nome: 'Financeiro', setor: 'Financeiro' },
  ];

  const mockAvailableTasks: Task[] = [
    mockTask,
    {
      id: 'task-2',
      titulo: 'Reunião com Produtores',
      projetoId: 'operacoes',
      status: 'BACKLOG',
      prioridade: 'MEDIA',
      progresso: 0,
      responsavel: 'Carlos Lima',
    },
  ];

  let currentTree: renderer.ReactTestRenderer | undefined;

  afterEach(() => {
    if (currentTree) {
      renderer.act(() => {
        currentTree?.unmount();
      });
      currentTree = undefined;
    }
  });

  it('renders nothing when not visible or task is null', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <TransferTaskModal
          task={null}
          visible={true}
          onClose={jest.fn()}
          onTransfer={jest.fn()}
        />
      );
    });

    expect(currentTree?.toJSON()).toBeNull();
  });

  it('renders transfer modal with task details and projects', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <TransferTaskModal
          task={mockTask}
          visible={true}
          onClose={jest.fn()}
          projects={mockProjects}
          availableTasks={mockAvailableTasks}
          onTransfer={jest.fn()}
        />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'transfer-task-modal' })).toBeDefined();
    expect(root.findByProps({ testID: 'transfer-project-pill-operacoes' })).toBeDefined();
    expect(root.findByProps({ testID: 'transfer-mode-move' })).toBeDefined();
    expect(root.findByProps({ testID: 'transfer-mode-subtask' })).toBeDefined();
  });

  it('transfers task to another project in MOVE_PROJECT mode', async () => {
    const onTransfer = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    await renderer.act(async () => {
      currentTree = renderer.create(
        <TransferTaskModal
          task={mockTask}
          visible={true}
          onClose={onClose}
          projects={mockProjects}
          availableTasks={mockAvailableTasks}
          onTransfer={onTransfer}
        />
      );
    });

    const root = currentTree!.root;
    const projectPill = root.findByProps({ testID: 'transfer-project-pill-operacoes' });
    const submitBtn = root.findByProps({ testID: 'transfer-task-submit-button' });

    await renderer.act(async () => {
      projectPill.props.onPress();
    });

    await renderer.act(async () => {
      submitBtn.props.onPress();
    });

    expect(onTransfer).toHaveBeenCalledWith('task-1', 'operacoes', undefined);
    expect(onClose).toHaveBeenCalled();
  });

  it('switches to CONVERT_SUBTASK mode and selects parent task', async () => {
    const onTransfer = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    await renderer.act(async () => {
      currentTree = renderer.create(
        <TransferTaskModal
          task={mockTask}
          visible={true}
          onClose={onClose}
          projects={mockProjects}
          availableTasks={mockAvailableTasks}
          onTransfer={onTransfer}
        />
      );
    });

    const root = currentTree!.root;
    const subtaskModeBtn = root.findByProps({ testID: 'transfer-mode-subtask' });
    const projectPill = root.findByProps({ testID: 'transfer-project-pill-operacoes' });

    await renderer.act(async () => {
      subtaskModeBtn.props.onPress();
      projectPill.props.onPress();
    });

    const parentTaskItem = root.findByProps({ testID: 'transfer-parent-task-task-2' });
    const submitBtn = root.findByProps({ testID: 'transfer-task-submit-button' });

    await renderer.act(async () => {
      parentTaskItem.props.onPress();
    });

    await renderer.act(async () => {
      submitBtn.props.onPress();
    });

    expect(onTransfer).toHaveBeenCalledWith('task-1', 'operacoes', 'task-2');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when in CONVERT_SUBTASK mode without selecting a parent task', async () => {
    const onTransfer = jest.fn();

    await renderer.act(async () => {
      currentTree = renderer.create(
        <TransferTaskModal
          task={mockTask}
          visible={true}
          onClose={jest.fn()}
          projects={mockProjects}
          availableTasks={mockAvailableTasks}
          onTransfer={onTransfer}
        />
      );
    });

    const root = currentTree!.root;
    const subtaskModeBtn = root.findByProps({ testID: 'transfer-mode-subtask' });
    const submitBtn = root.findByProps({ testID: 'transfer-task-submit-button' });

    await renderer.act(async () => {
      subtaskModeBtn.props.onPress();
    });

    await renderer.act(async () => {
      submitBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'transfer-task-error-banner' })).toBeDefined();
    expect(onTransfer).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel or close button is pressed', async () => {
    const onClose = jest.fn();

    await renderer.act(async () => {
      currentTree = renderer.create(
        <TransferTaskModal
          task={mockTask}
          visible={true}
          onClose={onClose}
          projects={mockProjects}
          onTransfer={jest.fn()}
        />
      );
    });

    const root = currentTree!.root;
    const cancelBtn = root.findByProps({ testID: 'transfer-task-cancel-button' });
    const closeBtn = root.findByProps({ testID: 'transfer-task-close-button' });

    await renderer.act(async () => {
      cancelBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await renderer.act(async () => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
