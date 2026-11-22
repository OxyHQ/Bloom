import {
  ListingPreviewPane,
  ListingQualityMeter,
  PropertyTypeSelector,
} from '@oxy.so/bloom/listing-editor';
import { OfferingBadge } from '@oxy.so/bloom/offering-badge';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const LISTING = {
  title: 'Harbour flat',
  photos: [PHOTO, PHOTO],
  subtitle: 'Old Halden',
  price: '€1,250',
  priceUnit: 'month',
  description: 'Bright, two bedrooms, a balcony over the harbour.',
  location: 'Old Halden',
};
const ITEMS = [
  { key: 'photos', label: 'Add 5 photos', done: true },
  { key: 'description', label: 'Describe the home', tip: 'Mention the light', done: false },
  { key: 'price', label: 'Set a price', done: false, weight: 2, onPress: press },
];

export const LISTING_EDITOR_CASES: ParityCase[] = [
  {
    name: 'ListingPreviewPane',
    language: () => toElement(L.ListingPreviewPane(LISTING)),
    bloom: () => <ListingPreviewPane listing={LISTING} />,
  },
  {
    name: 'ListingPreviewPane its page, its words',
    language: () =>
      toElement(
        L.ListingPreviewPane(LISTING, {
          mode: 'page',
          onModeChange: set,
          title: 'Preview',
          renderPage: (listing) => L.Text(`${listing.title}: the page`),
        }),
      ),
    bloom: () => (
      <ListingPreviewPane
        listing={LISTING}
        mode="page"
        onModeChange={set}
        title="Preview"
        renderPage={(listing) => <Text>{`${listing.title}: the page`}</Text>}
      />
    ),
  },
  {
    name: 'ListingQualityMeter',
    language: () => toElement(L.ListingQualityMeter(ITEMS)),
    bloom: () => <ListingQualityMeter items={ITEMS} />,
  },
  {
    name: 'ListingQualityMeter a score, tips, named',
    language: () =>
      toElement(
        L.ListingQualityMeter(ITEMS, {
          score: 72,
          title: 'Listing quality',
          tips: ['Add a floor plan'],
          formatScore: (score) => `${score} of 100`,
        }).label('Listing quality, 72'),
      ),
    bloom: () => (
      <ListingQualityMeter
        items={ITEMS}
        score={72}
        title="Listing quality"
        tips={['Add a floor plan']}
        formatScore={(score) => `${score} of 100`}
        accessibilityLabel="Listing quality, 72"
      />
    ),
  },
  {
    name: 'PropertyTypeSelector none chosen',
    language: () => toElement(L.PropertyTypeSelector([null, set])),
    bloom: () => <PropertyTypeSelector value={null} onValueChange={set} />,
  },
  {
    name: 'PropertyTypeSelector in 3 columns, an error, disabled, named',
    language: () =>
      toElement(
        L.PropertyTypeSelector(['house', set], { error: 'Pick one' })
          .columns(3)
          .disabled()
          .label('Property type'),
      ),
    bloom: () => (
      <PropertyTypeSelector
        value="house"
        onValueChange={set}
        error="Pick one"
        columns={3}
        disabled
        accessibilityLabel="Property type"
      />
    ),
  },
  ...ENUMS.offeringBadgeSize.flatMap((size) =>
    ENUMS.offeringBadgeStyle.map((variant) => ({
      name: `OfferingBadge ${size} ${variant}`,
      language: () => toElement(L.OfferingBadge('sale').size(size).style(variant)),
      bloom: () => <OfferingBadge offering="sale" size={size} variant={variant} />,
    })),
  ),
  ...(['long_term_rent', 'short_term_rent', 'exchange'] as const).map((offering) => ({
    name: `OfferingBadge ${offering}`,
    language: () => toElement(L.OfferingBadge(offering)),
    bloom: () => <OfferingBadge offering={offering} />,
  })),
  {
    name: 'OfferingBadge its own words, no glyph',
    language: () => toElement(L.OfferingBadge('sale', { label: 'For sale', icon: false })),
    bloom: () => <OfferingBadge offering="sale" label="For sale" icon={false} />,
  },
];
