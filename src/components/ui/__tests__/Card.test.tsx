import React from 'react';
import renderer from 'react-test-renderer';
import { Card, CardHeader, CardBody, CardFooter } from '../Card';

describe('Card Component', () => {
  it('renders default container card', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Card>Card Content</Card>);
    });
    expect(tree).toBeDefined();
    const root = tree!.root;
    expect(root.findByProps({ testID: 'card-container' })).toBeDefined();
  });

  it('renders touchable card when onPress is passed', () => {
    const onPressMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<Card onPress={onPressMock}>Clickable Card</Card>);
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable).toBeDefined();

    renderer.act(() => {
      touchable.props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders card subcomponents', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardBody>Body</CardBody>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
    });

    expect(tree?.toJSON()).toBeDefined();
  });
});
