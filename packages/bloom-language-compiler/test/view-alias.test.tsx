/**
 * A view called through a `let` alias of it (`public let PostItem = PostItemContent`) is the view's
 * call, its props one object: it was emitted with positional arguments, so the view's props were
 * the first argument itself (`props.title` undefined).
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Titles } = require('./bloom/view-alias-user.bloom') as {
  Titles: (props: { titles: string[] }) => Parameters<typeof toElement>[0];
};

it('calls a view through its alias with its props', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Titles({ titles: ['a', 'b'] })));
  });
  const texts = r.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.children === 'string')
    .map((n) => n.props.children as string);
  expect(texts).toEqual(['row a', 'row b']);
});
