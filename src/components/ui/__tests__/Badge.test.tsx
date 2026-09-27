import React from 'react';
import renderer from 'react-test-renderer';
import { Badge } from '../Badge';
import { colors } from '@/core/theme';
import { StatusTarefa, PrioridadeTarefa, TaskSyncStatus } from '@/types';

describe('Badge Component', () => {
  it('renders status badges with correct theme colors and labels', () => {
    const statuses: StatusTarefa[] = ['BACKLOG', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDO'];

    statuses.forEach((status) => {
      let tree: renderer.ReactTestRenderer | undefined;
      renderer.act(() => {
        tree = renderer.create(<Badge status={status} />);
      });
      expect(tree).toBeDefined();
      const root = tree!.root;
      const badge = root.findByProps({ testID: 'badge-container' });
      expect(badge).toBeDefined();
    });
  });

  it('renders priority badges with correct labels', () => {
    const priorities: PrioridadeTarefa[] = ['BAIXA', 'MEDIA', 'ALTA'];

    priorities.forEach((priority) => {
      let tree: renderer.ReactTestRenderer | undefined;
      renderer.act(() => {
        tree = renderer.create(<Badge priority={priority} />);
      });
      expect(tree).toBeDefined();
      const root = tree!.root;
      const badge = root.findByProps({ testID: 'badge-container' });
      expect(badge).toBeDefined();
    });
  });

  it('renders sync status badges', () => {
    const syncStatuses: TaskSyncStatus[] = ['SYNCED', 'PENDING', 'ERROR'];

    syncStatuses.forEach((syncStatus) => {
      let tree: renderer.ReactTestRenderer | undefined;
      renderer.act(() => {
        tree = renderer.create(<Badge syncStatus={syncStatus} />);
      });
      expect(tree).toBeDefined();
    });
  });

  it('renders with dot indicator when showDot is true', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Badge label="Online" showDot />);
    });
    expect(tree).toBeDefined();
    const root = tree!.root;
    const dot = root.findByProps({ testID: 'badge-dot' });
    expect(dot).toBeDefined();
  });
});
