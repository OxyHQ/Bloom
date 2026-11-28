/**
 * SwiftUI's buttons in a package file: `Button("Add") { … }` and `Button("Reset", action: …)` (a
 * title and its action), `Button(action: …) { label }` and `Button { … } label: { … }`, each the
 * language's `Button(Text(…)).onPress(…)`.
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { ButtonCounter } = require('./packages/format-app/Sources/App/Buttons.bloom') as {
  ButtonCounter: () => Parameters<typeof toElement>[0];
};

it('runs each SwiftUI button form’s action', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(ButtonCounter()));
  });
  const count = () =>
    r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
    )[0]?.props.children;
  const press = (index: number) => {
    const pressables = r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
    );
    act(() => pressables[index]?.props.onPress());
  };
  expect(count()).toBe('0');
  press(0);
  expect(count()).toBe('1');
  press(2);
  expect(count()).toBe('11');
  press(3);
  expect(count()).toBe('10');
  press(1);
  expect(count()).toBe('0');
});
