/**
 * Bloom views reaching TS element positions cross as elements: a generic TS component's optional
 * `emptyComponent` and its `renderCell` (each view it gives), and an optional `meta: View?`, which
 * stays `undefined` when it is `none` (`toElement(undefined)` was an element TS read as present).
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = Parameters<typeof toElement>[0];
// Required, not imported: see bloom.cost.test.tsx.
const m = require('./bloom/element-props.bloom') as {
  Posts: (props: { items: { postId: string }[] }) => Node;
  Row: (props: { title: string; meta?: Node }) => Node;
  Rows: (props: { titles: string[] }) => Node;
};
const { Text } = require('@oxy.so/bloom-language') as { Text: (s: string) => Node };

const texts = (node: Node) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(node));
  });
  return r.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.children === 'string')
    .map((n) => n.props.children as string);
};

it("draws a generic TS component's element props", () => {
  expect(texts(m.Posts({ items: [{ postId: 'a' }, { postId: 'b' }] }))).toEqual([
    'cell a',
    'cell b',
  ]);
  expect(texts(m.Posts({ items: [] }))).toEqual(['Nothing yet']);
});

it('keeps an optional view none across the boundary', () => {
  expect(texts(m.Row({ title: 'Ann' }))).toEqual(['Ann']);
  expect(texts(m.Row({ title: 'Ann', meta: Text('2 mutual') }))).toEqual([
    'Ann',
    'meta shown',
    '2 mutual',
  ]);
});

it('draws the views a function handed by name gives', () => {
  expect(texts(m.Rows({ titles: ['a', 'b'] }))).toEqual(['row a', 'row b']);
});
