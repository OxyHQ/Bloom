import { Button } from '@oxy.so/bloom/button';
import { SortableChipRow } from '@oxy.so/bloom/sortable-chip-row';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const reorder = () => {};
const dragging = () => {};
const add = () => {};
const LINKS = ['Website', 'Shop', 'Newsletter'];

const languageChips = () => LINKS.map((link) => L.SortableChip(link, link, L.Text(link)));
const bloomItems = LINKS.map((link) => ({ key: link, label: link, node: <Text>{link}</Text> }));

export const SORTABLE_CHIP_ROW_CASES: readonly ParityCase[] = [
  {
    name: 'a sortable chip row',
    language: () =>
      toElement(
        L.SortableChipRow(...languageChips())
          .onReorder(reorder)
          .label('Links'),
      ),
    bloom: () => (
      <SortableChipRow items={bloomItems} onReorder={reorder} accessibilityLabel="Links" />
    ),
  },
  {
    name: 'a trailing control, the drag reported',
    language: () =>
      toElement(
        L.SortableChipRow(...languageChips())
          .onReorder(reorder)
          .onDragChange(dragging)
          .trailing(L.Button(L.Text('Add link')).onPress(add))
          .testID('links'),
      ),
    bloom: () => (
      <SortableChipRow
        items={bloomItems}
        onReorder={reorder}
        onDragStateChange={dragging}
        trailing={<Button onPress={add}>Add link</Button>}
        testID="links"
      />
    ),
  },
  {
    name: 'a disabled sortable chip row',
    language: () =>
      toElement(
        L.SortableChipRow(...languageChips())
          .onReorder(reorder)
          .disabled(),
      ),
    bloom: () => <SortableChipRow items={bloomItems} onReorder={reorder} disabled />,
  },
];
