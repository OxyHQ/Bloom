/**
 * A `VirtualList`'s row. Swift's trailing form, `VirtualList(people) { person in … }`, is handed
 * the item, and `VirtualList(people.enumerated()) { i, person in … }` its index too. A row closure
 * passed as the argument, `VirtualList(people, { row in … })`, is typed `VirtualListRow<Person>`,
 * what FlashList hands it (`{ item, index }`), so a field read off the row itself is B0205
 * (`check/virtual_list_row`), never a crash on the first draw.
 */
import { toElement } from '@oxy.so/bloom-language';
import type { ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
type View = (props: { people: { id: string; name: string }[] }) => Parameters<typeof toElement>[0];
const { People, NumberedPeople, RowPeople } = require('./bloom/virtual-list-row.bloom') as Record<
  'People' | 'NumberedPeople' | 'RowPeople',
  View
>;

type RenderItem = (info: { item: unknown; index: number }) => ReactElement | null;

const people = [
  { id: 'a', name: 'Ana' },
  { id: 'r', name: 'Rui' },
];

/** What each row draws, from the list's `renderItem` as FlashList calls it. */
function rows(view: View): string[] {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(view({ people })));
  });
  const list = r.root.find((node) => typeof node.props.renderItem === 'function');
  expect(list.props.data).toEqual(people);
  const renderItem = list.props.renderItem as RenderItem;
  return people.map((item, index) => {
    let row!: TestRenderer.ReactTestRenderer;
    act(() => {
      row = TestRenderer.create(renderItem({ item, index }) as ReactElement);
    });
    return row.root.find((node) => typeof node.props.children === 'string').props.children;
  });
}

it('hands the trailing row each item, as SwiftUI does', () => {
  expect(rows(People)).toEqual(['Ana', 'Rui']);
});

it('hands an enumerated trailing row its index and item, with no pairs built', () => {
  expect(rows(NumberedPeople)).toEqual(['1. Ana', '2. Rui']);
});

it("hands a row argument FlashList's { item, index }", () => {
  expect(rows(RowPeople)).toEqual(['1. Ana', '2. Rui']);
});
