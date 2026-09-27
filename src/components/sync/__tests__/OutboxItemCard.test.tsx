import React from 'react';
import renderer from 'react-test-renderer';
import { OutboxItemCard } from '../OutboxItemCard';
import { OutboxMutation } from '@/types';

describe('OutboxItemCard Component', () => {
  const baseMutation: OutboxMutation = {
    id: 'mut-123',
    entityId: 'task-abc-456',
    entityType: 'TASK',
    action: 'CREATE',
    payload: {
      titulo: 'Vistoria Viveiro 4',
      status: 'EM_ANDAMENTO',
    },
    createdAt: '2026-09-09T14:30:00.000Z',
    retryCount: 1,
    status: 'PENDING',
  };

  it('renders pending mutation details correctly', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<OutboxItemCard mutation={baseMutation} />);
    });

    expect(tree).toBeDefined();
    const str = JSON.stringify(tree!.toJSON());
    expect(str).toContain('Criar Tarefa');
    expect(str).toContain('Vistoria Viveiro 4');
    expect(str).toContain('Pendente');
    expect(str).toContain('Tentativas: 1');
  });

  it('renders error status and conflict message with retry button', () => {
    const errorMutation: OutboxMutation = {
      ...baseMutation,
      id: 'mut-err-999',
      status: 'ERROR',
      errorMessage: 'Conflito de versão no servidor (409)',
    };
    const onRetryMock = jest.fn();
    const onRemoveMock = jest.fn();

    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <OutboxItemCard
          mutation={errorMutation}
          onRetry={onRetryMock}
          onRemove={onRemoveMock}
        />
      );
    });

    const str = JSON.stringify(tree!.toJSON());
    expect(str).toContain('Erro / Conflito');
    expect(str).toContain('Conflito de versão no servidor (409)');

    const retryBtn = tree!.root.findByProps({ testID: 'outbox-item-card-retry-button' });
    renderer.act(() => {
      retryBtn.props.onPress();
    });
    expect(onRetryMock).toHaveBeenCalledWith('mut-err-999');

    const removeBtn = tree!.root.findByProps({ testID: 'outbox-item-card-remove-button' });
    renderer.act(() => {
      removeBtn.props.onPress();
    });
    expect(onRemoveMock).toHaveBeenCalledWith('mut-err-999');
  });

  it('renders syncing status correctly', () => {
    const syncingMutation: OutboxMutation = {
      ...baseMutation,
      status: 'SYNCING',
    };

    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<OutboxItemCard mutation={syncingMutation} />);
    });

    const str = JSON.stringify(tree!.toJSON());
    expect(str).toContain('Enviando...');
  });
});
