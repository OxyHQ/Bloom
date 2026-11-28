/**
 * A view's `static let` is the type's constant: `Card.fallback` reads it in the view and outside
 * it (Swift's qualified static), and the view's own body reads it unqualified (it was B0205).
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./bloom/view-static.bloom') as {
  Card: (props: { title?: string }) => Parameters<typeof toElement>[0];
  Plain: () => Parameters<typeof toElement>[0];
  cardLabel: (title: string | undefined) => string;
};

const text = (node: Parameters<typeof toElement>[0]) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(node));
  });
  return r.root.findAll(
    (n) => typeof n.type === 'string' && typeof n.props.children === 'string',
  )[0]?.props.children;
};

it('reads a view’s static qualified and unqualified', () => {
  expect(text(m.Card({}))).toBe('Untitled');
  expect(text(m.Card({ title: 'Bloom' }))).toBe('Bloom');
  expect(text(m.Plain())).toBe('4');
  expect(m.cardLabel(undefined)).toBe('Untitled');
});
