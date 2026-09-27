import React from 'react';
import renderer from 'react-test-renderer';
import { Slider, ProgressBar } from '../Slider';

describe('Slider and ProgressBar Components', () => {
  it('renders ProgressBar with given percentage', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ProgressBar progress={75} />);
    });
    expect(tree).toBeDefined();

    const root = tree!.root;
    const fill = root.findByProps({ testID: 'progress-bar-fill' });
    expect(fill.props.style[1].width).toBe('75%');
  });

  it('clamps ProgressBar percentage between 0 and 100', () => {
    let overflowTree: renderer.ReactTestRenderer | undefined;
    let underflowTree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      overflowTree = renderer.create(<ProgressBar progress={150} />);
      underflowTree = renderer.create(<ProgressBar progress={-20} />);
    });

    const overflowFill = overflowTree!.root.findByProps({ testID: 'progress-bar-fill' });
    expect(overflowFill.props.style[1].width).toBe('100%');

    const underflowFill = underflowTree!.root.findByProps({ testID: 'progress-bar-fill' });
    expect(underflowFill.props.style[1].width).toBe('0%');
  });

  it('renders Slider with value and handles increment/decrement stepper buttons', () => {
    const onChangeMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <Slider
          value={50}
          onChange={onChangeMock}
          label="Progresso da Tarefa"
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;

    const decrementBtn = root.findByProps({ testID: 'slider-decrement-button' });
    const incrementBtn = root.findByProps({ testID: 'slider-increment-button' });

    renderer.act(() => {
      decrementBtn.props.onPress();
    });
    expect(onChangeMock).toHaveBeenCalledWith(40);

    renderer.act(() => {
      incrementBtn.props.onPress();
    });
    expect(onChangeMock).toHaveBeenCalledWith(60);
  });

  it('handles quick preset pills', () => {
    const onChangeMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <Slider
          value={0}
          onChange={onChangeMock}
          presets={[0, 25, 50, 75, 100]}
        />
      );
    });

    const root = tree!.root;
    const preset75 = root.findByProps({ testID: 'slider-preset-75' });
    renderer.act(() => {
      preset75.props.onPress();
    });
    expect(onChangeMock).toHaveBeenCalledWith(75);
  });
});
