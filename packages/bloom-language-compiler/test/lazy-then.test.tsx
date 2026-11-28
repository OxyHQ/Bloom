/**
 * A React `lazy` component (`lazy { import(…).then { m in ({ default: m.X }) } }`) is drawn as an
 * element: `$jsx(Greeting, …)`. Called (`Greeting({ … })`) it threw a TypeError at the draw, as a
 * `LazyExoticComponent` is not a function (mention13 lazy-component-called).
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Sheet } = require('./bloom/lazy-then.bloom') as {
  Sheet: () => Parameters<typeof toElement>[0];
};

it('draws a lazy component once its module loads', async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(toElement(Sheet()));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const texts = r.root
    .findAll((node) => typeof node.type === 'string' && typeof node.props.children === 'string')
    .map((node) => node.props.children as string);
  expect(texts).toContain('Hi!');
});
