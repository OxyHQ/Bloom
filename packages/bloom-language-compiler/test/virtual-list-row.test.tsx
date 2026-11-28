/**
 * `VirtualList(people, { row in … })`: the row closure is typed `VirtualListRow<Person>`, which is
 * what FlashList hands it (`{ item, index }`), so `row.item` is the person at draw time. A row
 * that reads the item's fields off the row itself is B0205 (`check/virtual_list_row`), never a
 * crash on the first draw.
 */
import { toElement } from '@oxy.so/bloom-language';
import type { ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { People } = require('./bloom/virtual-list-row.bloom') as {
  People: (props: { people: { id: string; name: string }[] }) => Parameters<typeof toElement>[0];
};

type RenderItem = (info: { item: unknown; index: number }) => ReactElement | null;

it("draws each row from FlashList's { item, index }", () => {
  const people = [
    { id: 'a', name: 'Ana' },
    { id: 'r', name: 'Rui' },
  ];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(People({ people })));
  });
  const list = r.root.find((node) => typeof node.props.renderItem === 'function');
  expect(list.props.data).toEqual(people);
  const renderItem = list.props.renderItem as RenderItem;
  const texts = people.map((item, index) => {
    let row!: TestRenderer.ReactTestRenderer;
    act(() => {
      row = TestRenderer.create(renderItem({ item, index }) as ReactElement);
    });
    return row.root.find((node) => typeof node.props.children === 'string').props.children;
  });
  expect(texts).toEqual(['1. Ana', '2. Rui']);
});
