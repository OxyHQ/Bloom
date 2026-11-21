import { FactStrip } from '@oxy.so/bloom/fact-strip';
import { Rating } from '@oxy.so/bloom/rating';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const open = () => {};

const facts = () => [
  L.Fact('1.2K ratings', '4.7').caption(L.Rating(4.7).style('stars').showsValue(false).size('sm')),
  L.Fact('Category', 'Productivity').caption('Work').onPress(open),
  L.Fact('Released', '2026').caption('March').id('year'),
  L.Fact('Languages', 'EN').caption('+ 12 more').label('English and 12 more'),
];

const FACTS = [
  {
    key: '1.2K ratings',
    label: '1.2K ratings',
    value: '4.7',
    caption: <Rating value={4.7} variant="stars" showValue={false} size="sm" />,
  },
  { key: 'Category', label: 'Category', value: 'Productivity', caption: 'Work', onPress: open },
  { key: 'year', label: 'Released', value: '2026', caption: 'March' },
  {
    key: 'Languages',
    label: 'Languages',
    value: 'EN',
    caption: '+ 12 more',
    accessibilityLabel: 'English and 12 more',
  },
];

export const FACT_STRIP_CASES: readonly ParityCase[] = [
  {
    name: 'a fact strip',
    language: () => toElement(L.FactStrip(...facts())),
    bloom: () => <FactStrip items={FACTS} />,
  },
  {
    name: 'a fact strip inset, named, narrow facts',
    language: () =>
      toElement(
        L.FactStrip(...facts())
          .contentInset('lg')
          .minItemWidth('80')
          .label('About this app')
          .testID('facts'),
      ),
    bloom: () => (
      <FactStrip
        items={FACTS}
        contentInset={16}
        minItemWidth={80}
        accessibilityLabel="About this app"
        testID="facts"
      />
    ),
  },
  {
    name: 'a fact strip with one fact, framed',
    language: () =>
      toElement(L.FactStrip(L.Fact('Website', 'tidewater.app')).frame({ width: '320' })),
    bloom: () => (
      <FactStrip
        items={[{ key: 'Website', label: 'Website', value: 'tidewater.app' }]}
        style={{ width: 320 }}
      />
    ),
  },
];
