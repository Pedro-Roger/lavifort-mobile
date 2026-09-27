import React from 'react';
import renderer from 'react-test-renderer';
import { SubtaskList } from '../SubtaskList';
import { SubTask } from '../../../types';

describe('SubtaskList Component', () => {
  const mockSubtasks: SubTask[] = [
    {
      id: 'sub-1',
      taskId: 'task-1',
      titulo: 'Medir nível de oxigênio',
      concluida: false,
    },
    {
      id: 'sub-2',
      taskId: 'task-1',
      titulo: 'Checar salinidade',
      concluida: true,
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

  it('renders list of subtasks and counter', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <SubtaskList taskId="task-1" subtarefas={mockSubtasks} />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'subtask-list' })).toBeDefined();
    expect(root.findByProps({ testID: 'subtask-item-sub-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'subtask-item-sub-2' })).toBeDefined();
    expect(root.findByProps({ testID: 'subtask-counter' })).toBeDefined();
  });

  it('renders empty message when no subtasks provided', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <SubtaskList taskId="task-1" subtarefas={[]} />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'subtask-empty-text' })).toBeDefined();
  });

  it('calls onToggleSubtask when checkbox is pressed', async () => {
    const onToggleSubtask = jest.fn().mockResolvedValue(undefined);
    await renderer.act(async () => {
      currentTree = renderer.create(
        <SubtaskList
          taskId="task-1"
          subtarefas={mockSubtasks}
          onToggleSubtask={onToggleSubtask}
        />
      );
    });

    const root = currentTree!.root;
    const checkbox = root.findByProps({ testID: 'subtask-checkbox-sub-1' });

    await renderer.act(async () => {
      checkbox.props.onPress();
    });

    expect(onToggleSubtask).toHaveBeenCalledWith('sub-1');
  });

  it('calls onDeleteSubtask when delete button is pressed', async () => {
    const onDeleteSubtask = jest.fn().mockResolvedValue(undefined);
    await renderer.act(async () => {
      currentTree = renderer.create(
        <SubtaskList
          taskId="task-1"
          subtarefas={mockSubtasks}
          onDeleteSubtask={onDeleteSubtask}
        />
      );
    });

    const root = currentTree!.root;
    const deleteBtn = root.findByProps({ testID: 'subtask-delete-sub-1' });

    await renderer.act(async () => {
      deleteBtn.props.onPress();
    });

    expect(onDeleteSubtask).toHaveBeenCalledWith('sub-1');
  });

  it('adds a new subtask when input is filled and button is pressed', async () => {
    const onAddSubtask = jest.fn().mockResolvedValue(undefined);
    await renderer.act(async () => {
      currentTree = renderer.create(
        <SubtaskList
          taskId="task-1"
          subtarefas={mockSubtasks}
          onAddSubtask={onAddSubtask}
        />
      );
    });

    const root = currentTree!.root;
    const input = root.findByProps({ testID: 'subtask-input' });
    const addBtn = root.findByProps({ testID: 'subtask-add-button' });

    await renderer.act(async () => {
      input.props.onChangeText('Coletar ph da água');
    });

    await renderer.act(async () => {
      addBtn.props.onPress();
    });

    expect(onAddSubtask).toHaveBeenCalledWith('Coletar ph da água');
  });

  it('displays error banner if onAddSubtask fails', async () => {
    const onAddSubtask = jest.fn().mockRejectedValue(new Error('Erro de conexão'));
    await renderer.act(async () => {
      currentTree = renderer.create(
        <SubtaskList
          taskId="task-1"
          subtarefas={mockSubtasks}
          onAddSubtask={onAddSubtask}
        />
      );
    });

    const root = currentTree!.root;
    const input = root.findByProps({ testID: 'subtask-input' });
    const addBtn = root.findByProps({ testID: 'subtask-add-button' });

    await renderer.act(async () => {
      input.props.onChangeText('Subtarefa falha');
    });

    await renderer.act(async () => {
      addBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'subtask-error-banner' })).toBeDefined();
  });
});
