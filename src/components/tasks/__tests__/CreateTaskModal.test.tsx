import React from 'react';
import renderer from 'react-test-renderer';
import { CreateTaskModal } from '../CreateTaskModal';
import { Project } from '../../../types';

describe('CreateTaskModal Component', () => {
  const mockProjects: Project[] = [
    { id: 'comercial', nome: 'Comercial', setor: 'Comercial' },
    { id: 'operacoes', nome: 'Operações', setor: 'Operações' },
  ];

  const mockOnClose = jest.fn();
  const mockOnCreateTask = jest.fn().mockResolvedValue({ id: 'task-new-1' });
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

  it('renders form fields when visible is true', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <CreateTaskModal
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onCreateTask={mockOnCreateTask}
        />
      );
    });

    expect(currentTree).toBeDefined();
    const root = currentTree!.root;

    expect(root.findByProps({ testID: 'create-task-modal' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-title-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-project-options' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-status-options' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-priority-options' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-progress-slider' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-responsavel-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-prazo-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-descricao-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-submit-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'create-task-cancel-button' })).toBeDefined();
  });

  it('shows error banner when trying to submit with empty title', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <CreateTaskModal
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onCreateTask={mockOnCreateTask}
        />
      );
    });

    const root = currentTree!.root;
    const submitBtn = root.findByProps({ testID: 'create-task-submit-button' });

    await renderer.act(async () => {
      submitBtn.props.onPress();
    });

    expect(mockOnCreateTask).not.toHaveBeenCalled();
    expect(root.findByProps({ testID: 'create-task-error-banner' })).toBeDefined();
  });

  it('submits valid task data and calls onCreateTask and onClose', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <CreateTaskModal
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          defaultProjectId="operacoes"
          onCreateTask={mockOnCreateTask}
        />
      );
    });

    const root = currentTree!.root;
    const titleInput = root.findByProps({ testID: 'create-task-title-input' });
    const responsavelInput = root.findByProps({ testID: 'create-task-responsavel-input' });
    const prazoInput = root.findByProps({ testID: 'create-task-prazo-input' });
    const descInput = root.findByProps({ testID: 'create-task-descricao-input' });
    const statusPill = root.findByProps({ testID: 'create-task-status-EM_ANDAMENTO' });
    const priorityPill = root.findByProps({ testID: 'create-task-priority-ALTA' });
    const submitBtn = root.findByProps({ testID: 'create-task-submit-button' });

    await renderer.act(async () => {
      titleInput.props.onChangeText('Vistoria no Viveiro 3');
      statusPill.props.onPress();
      priorityPill.props.onPress();
      responsavelInput.props.onChangeText('Pedro Roger');
      prazoInput.props.onChangeText('2026-09-25');
      descInput.props.onChangeText('Checagem de ph e salinidade');
    });

    await renderer.act(async () => {
      submitBtn.props.onPress();
    });

    expect(mockOnCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: 'Vistoria no Viveiro 3',
        status: 'EM_ANDAMENTO',
        prioridade: 'ALTA',
        responsavel: 'Pedro Roger',
        prazo: '2026-09-25',
        descricao: 'Checagem de ph e salinidade',
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is pressed', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <CreateTaskModal
          visible={true}
          onClose={mockOnClose}
          projects={mockProjects}
          onCreateTask={mockOnCreateTask}
        />
      );
    });

    const root = currentTree!.root;
    const cancelBtn = root.findByProps({ testID: 'create-task-cancel-button' });

    await renderer.act(async () => {
      cancelBtn.props.onPress();
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
