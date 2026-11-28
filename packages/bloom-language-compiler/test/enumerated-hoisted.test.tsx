/**
 * `xs.enumerated().map { (i, x) in … }` is emitted as `xs.map((x, i) => …)`. In a view, a closure
 * that captures nothing is hoisted (`$fn0`) and passed through a wrapper, which once passed only
 * the element: every index was `undefined` ("NaN. Bloom").
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Numbered } = require('./bloom/enumerated-hoisted.bloom') as {
  Numbered: (props: { titles: string[] }) => Parameters<typeof toElement>[0];
};

it('passes the index to a hoisted enumerated map closure', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Numbered({ titles: ['Bloom', 'Swift'] })));
  });
  const text = r.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
  )[0]?.props.children;
  expect(text).toBe('1. Bloom, 2. Swift');
});
