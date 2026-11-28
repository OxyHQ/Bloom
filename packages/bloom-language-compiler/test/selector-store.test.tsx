/**
 * A TS value callable by its call signatures beside its members (zustand 5's store hook):
 * `useTrendsStore { s in s.trends }` is the selector's `[Trend]`, read with Swift's list members
 * (`enumerated()`), `useTrendsStore()` the whole state, and `useTrendsStore.getState()` a member.
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';
import { useTrendsStore } from './bloom/trends-store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { TrendShelf } = require('./bloom/selector-store.bloom') as {
  TrendShelf: () => Parameters<typeof toElement>[0];
};

it('calls a store hook with a selector and reads its result as a list', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(TrendShelf()));
  });
  const shown = () =>
    r.root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
    )[0]?.props.children;
  expect(shown()).toBe('loading  0');
  act(() =>
    useTrendsStore.setState({
      trends: [
        { id: 'a', title: 'Bloom' },
        { id: 'b', title: 'Swift' },
      ],
      loaded: true,
    }),
  );
  expect(shown()).toBe('loaded 1. Bloom, 2. Swift 2');
});
