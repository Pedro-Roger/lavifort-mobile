import React from 'react';
import renderer from 'react-test-renderer';
import { TaskDetailModal } from '../TaskDetailModal';
import { Task, Project } from '../../../types';

describe('TaskDetailModal Component', () => {
  const mockProjects: Project[] = [
    { id: 'comercial', nome: 'Comercial', setor: 'Comercial' },
    { id: 'operacoes', nome: 'Operações', setor: 'Operações' },
  ];

  const mockTask: Task = {
    id: 'task-10',
    titulo: 'Manutenção de Aeradores',
    descricao: 'Revisão mecânica dos motores',
    projetoId: 'operacoes',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    progresso: 40,
    responsavel: 'Lucas Silva',
    prazo: '2026-09-22',
    syncStatus: 'SYNCED',
  };

  const mockOnClose = jest.fn();
  const mockOnUpdateStatus = jest.fn().mockResolvedValue(mockTask);
  const mockOnUpdateProgress = jest.fn().mockResolvedValue(mockTask);
  const mockOnUpdateTask = jest.fn().mockResolvedValue(mockTask);
  const mockOnDeleteTask = jest.fn().mockResolvedValue(true);
  const mockOnTransferTask = jest.fn().mockResolvedValue(mockTask);
  const mockOnAddSubtask = jest.fn().mockResolvedValue(mockTask);
  const mockOnToggleSubtask = jest.fn().mockResolvedValue(mockTask);
  const mockOnDeleteSubtask = jest.fn().mockResolvedValue(mockTask);
  let currentTree: renderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (currentTree) {
      renderer.act(() => {
        currentTree?.unmount();
      });
      currentTree = undefined;
    }
  });

  it('renders task details in view mode', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={mockTask}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onUpdateStatus={mockOnUpdateStatus}
          onUpdateProgress={mockOnUpdateProgress}
          onUpdateTask={mockOnUpdateTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );
    });

    expect(currentTree).toBeDefined();
    const root = currentTree!.root;

    expect(root.findByProps({ testID: 'task-detail-modal' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-title' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-project-name' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-assignee' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-prazo' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-description' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-quick-status' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-progress-slider' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-edit-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'task-detail-delete-button' })).toBeDefined();
  });

  it('updates status with 1-touch quick status pill', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={mockTask}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onUpdateStatus={mockOnUpdateStatus}
        />
      );
    });

    const root = currentTree!.root;
    const concluidoPill = root.findByProps({ testID: 'task-detail-status-pill-CONCLUIDO' });

    await renderer.act(async () => {
      concluidoPill.props.onPress();
    });

    expect(mockOnUpdateStatus).toHaveBeenCalledWith('task-10', 'CONCLUIDO');
  });

  it('updates progress when slider preset is selected', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={mockTask}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onUpdateProgress={mockOnUpdateProgress}
        />
      );
    });

    const root = currentTree!.root;
    const preset100 = root.findByProps({ testID: 'slider-preset-100' });

    await renderer.act(async () => {
      preset100.props.onPress();
    });

    expect(mockOnUpdateProgress).toHaveBeenCalledWith('task-10', 100);
  });

  it('enters edit mode, updates fields, and saves changes', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={mockTask}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onUpdateTask={mockOnUpdateTask}
        />
      );
    });

    const root = currentTree!.root;
    const editBtn = root.findByProps({ testID: 'task-detail-edit-button' });

    await renderer.act(async () => {
      editBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'task-detail-edit-mode' })).toBeDefined();

    const titleInput = root.findByProps({ testID: 'task-detail-edit-title-input' });
    const descInput = root.findByProps({ testID: 'task-detail-edit-desc-input' });
    const priorityPill = root.findByProps({ testID: 'task-detail-edit-priority-BAIXA' });
    const saveBtn = root.findByProps({ testID: 'task-detail-save-button' });

    await renderer.act(async () => {
      titleInput.props.onChangeText('Manutenção Concluída');
      descInput.props.onChangeText('Motores revisados e testados');
      priorityPill.props.onPress();
    });

    await renderer.act(async () => {
      saveBtn.props.onPress();
    });

    expect(mockOnUpdateTask).toHaveBeenCalledWith('task-10', expect.objectContaining({
      titulo: 'Manutenção Concluída',
      descricao: 'Motores revisados e testados',
      prioridade: 'BAIXA',
    }));
  });

  it('handles cancel edit mode', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={mockTask}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
        />
      );
    });

    const root = currentTree!.root;
    const editBtn = root.findByProps({ testID: 'task-detail-edit-button' });

    await renderer.act(async () => {
      editBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'task-detail-edit-mode' })).toBeDefined();

    const cancelEditBtn = root.findByProps({ testID: 'task-detail-cancel-edit-button' });

    await renderer.act(async () => {
      cancelEditBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'task-detail-view-mode' })).toBeDefined();
  });

  it('renders subtask list and handles subtask operations', async () => {
    const taskWithSubtasks: Task = {
      ...mockTask,
      subtarefas: [
        {
          id: 'sub-1',
          taskId: 'task-10',
          titulo: 'Testar voltagem',
          concluida: false,
        },
      ],
    };

    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={taskWithSubtasks}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onAddSubtask={mockOnAddSubtask}
          onToggleSubtask={mockOnToggleSubtask}
          onDeleteSubtask={mockOnDeleteSubtask}
        />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'task-detail-subtask-list' })).toBeDefined();

    const checkbox = root.findByProps({ testID: 'subtask-checkbox-sub-1' });
    await renderer.act(async () => {
      checkbox.props.onPress();
    });

    expect(mockOnToggleSubtask).toHaveBeenCalledWith('task-10', 'sub-1');
  });

  it('renders transfer button and opens transfer modal', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={mockTask}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onTransferTask={mockOnTransferTask}
        />
      );
    });

    const root = currentTree!.root;
    const transferBtn = root.findByProps({ testID: 'task-detail-transfer-button' });
    expect(transferBtn).toBeDefined();

    await renderer.act(async () => {
      transferBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'task-detail-transfer-modal' })).toBeDefined();
  });

  it('renders attachment list and passes attachment callbacks', async () => {
    const mockOnCapturePhoto = jest.fn().mockResolvedValue({});
    const mockOnPickPhoto = jest.fn().mockResolvedValue({});
    const mockOnDeleteAttachment = jest.fn().mockResolvedValue(true);

    const taskWithAttachment: Task = {
      ...mockTask,
      anexos: [
        {
          id: 'att-1',
          taskId: 'task-10',
          uri: 'file:///mock/foto.jpg',
          nome: 'foto_evidencia.jpg',
          createdAt: '2026-09-09T10:00:00Z',
        },
      ],
    };

    await renderer.act(async () => {
      currentTree = renderer.create(
        <TaskDetailModal
          task={taskWithAttachment}
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onCapturePhoto={mockOnCapturePhoto}
          onPickPhoto={mockOnPickPhoto}
          onDeleteAttachment={mockOnDeleteAttachment}
        />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'task-detail-attachment-list' })).toBeDefined();
  });
});
