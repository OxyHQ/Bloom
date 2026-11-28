/**
 * A React element a TS caller hands to a Bloom view's `View?` prop (`slot={<Text>…</Text>}`, as
 * Mention's composer hands PostHeader its schedule label) is drawn where the view goes, as an
 * `Embed` of it. It was dropped: the runtime drew nothing for a child that is not a node.
 */
import { toElement } from '@oxy.so/bloom-language';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { SlotRow } = require('./bloom/element-view-prop.bloom') as {
  SlotRow: (props: { name: string; slot?: unknown }) => Parameters<typeof toElement>[0];
};

const texts = (r: TestRenderer.ReactTestRenderer): string[] =>
  r.root
    .findAll((node) => typeof node.type === 'string' && typeof node.props.children === 'string')
    .map((node) => node.props.children as string);

it.each([
  ['an element', <Text key="s">Scheduled</Text>],
  ['a list of elements', [<Text key="a">Scheduled</Text>]],
])('draws %s handed to a View? prop', (_kind, slot) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(SlotRow({ name: 'Nate', slot })));
  });
  expect(texts(r)).toEqual(['Nate', 'Scheduled']);
});

it('draws nothing for no slot', () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(SlotRow({ name: 'Nate' })));
  });
  expect(texts(r)).toEqual(['Nate']);
});
