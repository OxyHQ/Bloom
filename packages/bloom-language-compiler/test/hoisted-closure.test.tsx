/**
 * A closure that writes the view's `@State` (here inside a `do`/`catch`) stays inside the view
 * function: hoisted to module scope, `setItems` was undefined there, the write threw (swallowed by
 * the `catch`) and the recent items never loaded (mention13 hoisted-closure-state-write).
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Recent } = require('./bloom/hoisted-closure.bloom') as {
  Recent: () => Parameters<typeof toElement>[0];
};

it("writes the view's state from a closure in onAppear", async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(toElement(Recent()));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const texts = r.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.children === 'string')
    .map((n) => n.props.children as string);
  expect(texts).toEqual(['a']);
});
