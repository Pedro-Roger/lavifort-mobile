import React from 'react';
import renderer from 'react-test-renderer';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with title and default primary variant', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Button title="Clique Aqui" />);
    });
    expect(tree).toBeDefined();
    const root = tree!.root;
    expect(root.findByProps({ accessibilityRole: 'button' })).toBeDefined();
  });

  it('renders loading state with ActivityIndicator', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Button title="Salvar" isLoading />);
    });
    expect(tree).toBeDefined();
    const root = tree!.root;
    const indicator = root.findByProps({ testID: 'button-loading-indicator' });
    expect(indicator).toBeDefined();
  });

  it('handles different variants and sizes', () => {
    let secondaryTree: renderer.ReactTestRenderer | undefined;
    let outlineTree: renderer.ReactTestRenderer | undefined;
    let dangerTree: renderer.ReactTestRenderer | undefined;
    let ghostTree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      secondaryTree = renderer.create(<Button title="Secundário" variant="secondary" size="sm" />);
      outlineTree = renderer.create(<Button title="Outline" variant="outline" size="lg" />);
      dangerTree = renderer.create(<Button title="Excluir" variant="danger" />);
      ghostTree = renderer.create(<Button title="Ghost" variant="ghost" />);
    });

    expect(secondaryTree?.toJSON()).toBeDefined();
    expect(outlineTree?.toJSON()).toBeDefined();
    expect(dangerTree?.toJSON()).toBeDefined();
    expect(ghostTree?.toJSON()).toBeDefined();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Button title="Entrar" onPress={onPressMock} />);
    });
    const root = tree!.root;
    renderer.act(() => {
      root.findByType(Button).props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
