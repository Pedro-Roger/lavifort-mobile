import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { ClientStatusBadge } from '../ClientStatusBadge';
import { ClienteStatus } from '@/types';

function textsOf(tree: renderer.ReactTestRenderer): string {
  const root = tree.root;
  const parts = root
    .findAllByType(Text)
    .map((n) => n.props.children)
    .flat()
    .filter((c): c is string => typeof c === 'string');
  return parts.join('|');
}

describe('ClientStatusBadge', () => {
  const statuses: ClienteStatus[] = ['NOVO', 'SEM_CONTATO', 'EM_NEGOCIACAO', 'CLIENTE_ATIVO'];

  it.each(statuses)('renders a badge for status %s', (status) => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientStatusBadge status={status} />);
    });
    expect(tree).toBeDefined();
    const badge = tree!.root.findByProps({ testID: `client-status-${status}` });
    expect(badge).toBeDefined();
    expect(textsOf(tree!).length).toBeGreaterThan(0);
  });

  it('accepts a custom testID and size', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientStatusBadge status="CLIENTE_ATIVO" size="md" testID="my-badge" />);
    });
    const badge = tree!.root.findByProps({ testID: 'my-badge' });
    expect(badge).toBeDefined();
  });
});