import React from 'react';
import renderer from 'react-test-renderer';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner Component', () => {
  it('renders offline state with pending counts', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <OfflineBanner
          isConnected={false}
          isSyncing={false}
          pendingCount={3}
          errorCount={0}
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const banner = root.findByProps({ testID: 'offline-banner' });
    expect(banner).toBeDefined();
  });

  it('renders syncing state with indicator', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <OfflineBanner
          isConnected={true}
          isSyncing={true}
          pendingCount={2}
          errorCount={0}
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const spinner = root.findByProps({ testID: 'offline-banner-spinner' });
    expect(spinner).toBeDefined();
  });

  it('renders error state with retry button', () => {
    const onSyncPressMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <OfflineBanner
          isConnected={true}
          isSyncing={false}
          pendingCount={1}
          errorCount={2}
          onSyncPress={onSyncPressMock}
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const banner = root.findByProps({ testID: 'offline-banner' });
    expect(banner.props.accessibilityRole).toBe('button');

    renderer.act(() => {
      banner.props.onPress();
    });
    expect(onSyncPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders synced state and supports hideWhenSynced', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <OfflineBanner
          isConnected={true}
          isSyncing={false}
          pendingCount={0}
          errorCount={0}
          hideWhenSynced={false}
        />
      );
    });

    expect(tree?.toJSON()).not.toBeNull();

    let hiddenTree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      hiddenTree = renderer.create(
        <OfflineBanner
          isConnected={true}
          isSyncing={false}
          pendingCount={0}
          errorCount={0}
          hideWhenSynced
        />
      );
    });

    expect(hiddenTree?.toJSON()).toBeNull();
  });

  it('triggers onPressBanner when provided in offline or synced state', () => {
    const onPressBannerMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <OfflineBanner
          isConnected={false}
          isSyncing={false}
          pendingCount={0}
          errorCount={0}
          onPressBanner={onPressBannerMock}
        />
      );
    });

    const banner = tree!.root.findByProps({ testID: 'offline-banner' });
    renderer.act(() => {
      banner.props.onPress();
    });
    expect(onPressBannerMock).toHaveBeenCalledTimes(1);
  });
});
