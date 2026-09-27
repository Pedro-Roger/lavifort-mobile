import React from 'react';
import renderer from 'react-test-renderer';
import { Avatar } from '../Avatar';

describe('Avatar Component', () => {
  it('extracts initials from full name', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Avatar name="Pedro Roger" />);
    });
    expect(tree).toBeDefined();

    const root = tree!.root;
    const initials = root.findByProps({ testID: 'avatar-initials' });
    expect(initials.props.children).toBe('PR');
  });

  it('handles single word name', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Avatar name="LarviFort" />);
    });
    const root = tree!.root;
    const initials = root.findByProps({ testID: 'avatar-initials' });
    expect(initials.props.children).toBe('LA');
  });

  it('handles empty name fallback', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Avatar name="" />);
    });
    const root = tree!.root;
    const initials = root.findByProps({ testID: 'avatar-initials' });
    expect(initials.props.children).toBe('?');
  });

  it('renders image when imageUri is provided', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Avatar imageUri="https://example.com/avatar.jpg" name="Pedro" />);
    });
    const root = tree!.root;
    const image = root.findByProps({ testID: 'avatar-image' });
    expect(image.props.source.uri).toBe('https://example.com/avatar.jpg');
  });
});
