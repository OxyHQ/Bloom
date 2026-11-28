/**
 * The emitter's own bindings never collide with the module's names: a view with a prop named
 * `props` (`const { props } = props` was a SyntaxError), and a module that imports React's
 * `useState` itself beside a hook-local `@State var` (a second `import { useState }` was one).
 */
import { HStack, toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = Parameters<typeof toElement>[0];
// Required, not imported: see bloom.cost.test.tsx.
const { Island, Labeled } = require('./bloom/emit-names.bloom') as {
  Island: (props: { name: string; props: string }) => Node;
  Labeled: () => Node;
};

it('compiles and draws with the module’s own names', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(HStack(Island({ name: 'a', props: 'b' }), Labeled())));
  });
  const texts = r.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.children === 'string')
    .map((n) => n.props.children as string);
  expect(texts).toEqual(['a b', 'tags 2']);
});
