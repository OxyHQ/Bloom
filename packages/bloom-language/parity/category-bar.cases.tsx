import { CategoryBar, type CategoryBarItem } from '@oxy.so/bloom/category-bar';
import { RiBuildingLine, RiHomeLine, RiHotelLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const ITEMS: readonly CategoryBarItem[] = [
  { key: 'homes', label: 'Homes', icon: RiHomeLine },
  { key: 'flats', label: 'Flats', icon: RiBuildingLine },
  { key: 'stays', label: 'Stays', icon: RiHotelLine },
];

export const CATEGORY_BAR_CASES: readonly ParityCase[] = [
  {
    name: 'three categories, one selected',
    language: () => toElement(L.CategoryBar('Categories', ITEMS, ['flats', set])),
    bloom: () => (
      <CategoryBar
        items={ITEMS}
        value="flats"
        onValueChange={set}
        accessibilityLabel="Categories"
      />
    ),
  },
  {
    name: 'none selected',
    language: () => toElement(L.CategoryBar('Categories', ITEMS, [undefined, set])),
    bloom: () => (
      <CategoryBar
        items={ITEMS}
        value={undefined}
        onValueChange={set}
        accessibilityLabel="Categories"
      />
    ),
  },
  {
    name: 'a trailing slot, spacing and arrows in its own words',
    language: () =>
      toElement(
        L.CategoryBar('Property type', ITEMS, ['homes', set])
          .trailing(L.Text('Filters'))
          .spacing('2xl')
          .labels({ previous: 'Anteriores', next: 'Siguientes' })
          .testID('types'),
      ),
    bloom: () => (
      <CategoryBar
        items={ITEMS}
        value="homes"
        onValueChange={set}
        accessibilityLabel="Property type"
        trailing={<Text>Filters</Text>}
        gap={24}
        previousLabel="Anteriores"
        nextLabel="Siguientes"
        testID="types"
      />
    ),
  },
  {
    name: 'on a surface of its own, boxed',
    language: () =>
      toElement(
        L.CategoryBar('Categories', ITEMS, ['stays', set]).backdrop('surface').padding('sm'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <CategoryBar
            items={ITEMS}
            value="stays"
            onValueChange={set}
            accessibilityLabel="Categories"
            fadeColor={c.backgroundSecondary}
            style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
          />
        )}
      </Themed>
    ),
  },
];
