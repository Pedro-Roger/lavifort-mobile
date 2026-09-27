import React from 'react';
import renderer from 'react-test-renderer';
import { AddressButton } from '../AddressButton';
import { mapsService } from '@/services/maps.service';

jest.mock('@/services/maps.service', () => ({
  mapsService: {
    openAddressSelector: jest.fn(),
    openApp: jest.fn(),
    getNavigationUrls: jest.fn(),
  },
}));

describe('AddressButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders compact address button and triggers selector on press', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await renderer.act(async () => {
      tree = renderer.create(
        <AddressButton
          address="Rodovia CE-040, Km 42, Aquiraz"
          variant="compact"
          testID="btn-address-compact"
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const button = root.findByProps({ accessibilityRole: 'button' });

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(mapsService.openAddressSelector).toHaveBeenCalledWith(
      'Rodovia CE-040, Km 42, Aquiraz',
      undefined
    );
  });

  it('renders full card variant with address and route action button', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await renderer.act(async () => {
      tree = renderer.create(
        <AddressButton
          address="Fazenda Boa Vista, Viveiro 4"
          variant="full"
          testID="btn-address-full"
        />
      );
    });

    const root = tree!.root;
    const button = root.findByProps({ accessibilityRole: 'button' });

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(mapsService.openAddressSelector).toHaveBeenCalledWith(
      'Fazenda Boa Vista, Viveiro 4',
      undefined
    );
  });

  it('renders inline variant with address text', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await renderer.act(async () => {
      tree = renderer.create(
        <AddressButton
          address="Viveiro 10 - Setor Norte"
          variant="inline"
          testID="btn-address-inline"
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'btn-address-inline' })).toBeDefined();
  });

  it('renders nothing when address is empty or whitespace', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await renderer.act(async () => {
      tree = renderer.create(<AddressButton address="   " testID="btn-empty" />);
    });

    expect(tree?.toJSON()).toBeNull();
  });
});
