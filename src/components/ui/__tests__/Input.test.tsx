import React from 'react';
import renderer from 'react-test-renderer';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders input with label and placeholder', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <Input
          label="Título da Tarefa"
          placeholder="Digite o título"
          value="Revisar tanque 04"
        />
      );
    });

    expect(tree).toBeDefined();
    expect(tree?.toJSON()).toBeDefined();
  });

  it('renders error message when error prop is provided', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <Input
          label="E-mail"
          error="E-mail inválido"
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const errorNode = root.findByProps({ testID: 'input-error-text' });
    expect(errorNode).toBeDefined();
    expect(errorNode.props.children).toBe('E-mail inválido');
  });

  it('renders required asterisk when required is true', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <Input
          label="Responsável"
          required
        />
      );
    });

    expect(tree).toBeDefined();
    expect(tree?.toJSON()).toBeDefined();
  });
});
