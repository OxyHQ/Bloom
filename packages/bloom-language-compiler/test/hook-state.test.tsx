/**
 * `@State var x = v` in a hook function's body: one `useState` (never `Foreign<Dispatch>`), read
 * as `x`, written as `x = …` and `x += 1` in its closures, and `$x` its binding, which a
 * `@Binding` view writes.
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Counter } = require('./bloom/hook-state.bloom') as {
  Counter: (props: { start: number }) => Parameters<typeof toElement>[0];
};

it('keeps, writes and binds a hook function’s state', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Counter({ start: 5 })));
  });
  const shown = () =>
    r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
    )[0]?.props.children;
  const press = (index: number) => {
    const pressables = r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.onPress === 'function',
    );
    act(() => pressables[index]?.props.onPress());
  };
  expect(shown()).toBe('50');
  press(0);
  expect(shown()).toBe('61');
  press(0);
  expect(shown()).toBe('72');
  press(1);
  expect(shown()).toBe('2');
});
