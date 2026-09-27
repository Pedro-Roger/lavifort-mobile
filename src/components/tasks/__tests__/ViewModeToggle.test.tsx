import React from 'react';
import renderer from 'react-test-renderer';
import { ViewModeToggle } from '../ViewModeToggle';

describe('ViewModeToggle', () => {
  it('renders Kanban and Lista options with active state on Kanban', () => {
    const mockOnChange = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <ViewModeToggle mode="kanban" onChangeMode={mockOnChange} />
      );
    });

    const root = tree!.root;

    const kanbanBtn = root.findByProps({ testID: 'view-mode-kanban' });
    const listBtn = root.findByProps({ testID: 'view-mode-list' });

    expect(kanbanBtn.props.accessibilityState.selected).toBe(true);
    expect(listBtn.props.accessibilityState.selected).toBe(false);
  });

  it('calls onChangeMode when tapping alternate mode', () => {
    const mockOnChange = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <ViewModeToggle mode="kanban" onChangeMode={mockOnChange} />
      );
    });

    const root = tree!.root;
    const listBtn = root.findByProps({ testID: 'view-mode-list' });

    renderer.act(() => {
      listBtn.props.onPress();
    });

    expect(mockOnChange).toHaveBeenCalledWith('list');
  });

  it('reflects list mode selection correctly', () => {
    const mockOnChange = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <ViewModeToggle mode="list" onChangeMode={mockOnChange} />
      );
    });

    const root = tree!.root;

    const kanbanBtn = root.findByProps({ testID: 'view-mode-kanban' });
    const listBtn = root.findByProps({ testID: 'view-mode-list' });

    expect(kanbanBtn.props.accessibilityState.selected).toBe(false);
    expect(listBtn.props.accessibilityState.selected).toBe(true);
  });
});
