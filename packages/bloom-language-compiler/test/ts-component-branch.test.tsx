/**
 * A TS value typed as a component (react-native 0.81's `const Switch: (props) => ReactNode`,
 * exported through `typeof`) is drawn as an element: its hooks are its own, so it may appear in
 * a branch. Called, its `useState` ran in the caller and React threw "Rendered more hooks".
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Panel } = require('./bloom/ts-component-branch.bloom') as {
  Panel: () => Parameters<typeof toElement>[0];
};

it('draws a TS component in a branch as an element', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Panel()));
  });
  const texts = () =>
    r.root
      .findAll((node) => typeof node.type === 'string' && typeof node.props.children === 'string')
      .map((node) => node.props.children as string);
  const press = () => {
    const button = r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
    )[0];
    act(() => button?.props.onPress());
  };
  expect(texts()).not.toContain('On!');
  press();
  expect(texts()).toContain('On!');
  press();
  expect(texts()).not.toContain('On!');
});
