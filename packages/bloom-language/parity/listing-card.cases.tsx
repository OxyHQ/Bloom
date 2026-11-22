import { RiHeart3Line, RiHotelBedLine } from '@oxy.so/bloom/icons';
import { ListingCard, ListingCardGrid, WishlistCard } from '@oxy.so/bloom/listing-card';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const PHOTOS = [PHOTO, PHOTO, PHOTO];
const FACTS = [{ icon: RiHotelBedLine, label: '2 beds' }, { label: '68 m²' }];
const HOME = {
  subtitle: 'Old Halden',
  rating: 4.9,
  reviewCount: 128,
  price: '€1,250',
  priceUnit: 'month',
  facts: FACTS,
  offerings: ['long_term_rent', 'sale'] as const,
};

export const LISTING_CARD_CASES: ParityCase[] = [
  {
    name: 'ListingCard',
    language: () => toElement(L.ListingCard('Harbour flat', PHOTOS, HOME).onPress(press)),
    bloom: () => <ListingCard title="Harbour flat" photos={PHOTOS} {...HOME} onPress={press} />,
  },
  ...ENUMS.listingCardLayout.flatMap((layout) =>
    ENUMS.density.map((density) => ({
      name: `ListingCard ${layout}, ${density}`,
      language: () =>
        toElement(L.ListingCard('Harbour flat', PHOTOS, HOME).style(layout).density(density)),
      bloom: () => (
        <ListingCard
          title="Harbour flat"
          photos={PHOTOS}
          {...HOME}
          layout={layout}
          density={density === 'default' ? 'comfortable' : density}
        />
      ),
    })),
  ),
  {
    name: 'ListingCard a favourite, a badge, a status, named, long-pressed',
    language: () =>
      toElement(
        L.ListingCard('Harbour flat', PHOTOS, {
          ...HOME,
          favorite: true,
          onFavoriteChange: set,
          status: 'reserved',
          badge: L.Text('New'),
        })
          .onPress(press)
          .onLongPress(press)
          .label('Harbour flat, €1,250 a month'),
      ),
    bloom: () => (
      <ListingCard
        title="Harbour flat"
        photos={PHOTOS}
        {...HOME}
        favorite
        onFavoriteChange={set}
        status="reserved"
        badge={<Text>New</Text>}
        onPress={press}
        onLongPress={press}
        accessibilityLabel="Harbour flat, €1,250 a month"
      />
    ),
  },
  {
    name: 'ListingCard loading',
    language: () => toElement(L.ListingCard('Harbour flat', PHOTOS).loading()),
    bloom: () => <ListingCard title="Harbour flat" photos={PHOTOS} loading />,
  },
  ...ENUMS.density.map((density) => ({
    name: `ListingCardGrid ${density}`,
    language: () =>
      toElement(
        L.ListingCardGrid(
          ['a', 'b', 'c'].map((id) => L.ListingCard(`Home ${id}`, PHOTOS, HOME).id(id)),
        ).density(density),
      ),
    bloom: () => (
      <ListingCardGrid density={density === 'default' ? 'results' : density}>
        {['a', 'b', 'c'].map((id) => (
          <ListingCard key={id} title={`Home ${id}`} photos={PHOTOS} {...HOME} />
        ))}
      </ListingCardGrid>
    ),
  })),
  {
    name: 'WishlistCard',
    language: () =>
      toElement(
        L.WishlistCard('Summer', PHOTOS, { description: '12 saved' })
          .onPress(press)
          .label('Summer'),
      ),
    bloom: () => (
      <WishlistCard
        name="Summer"
        photos={PHOTOS}
        description="12 saved"
        onPress={press}
        accessibilityLabel="Summer"
      />
    ),
  },
  {
    name: 'WishlistCard empty, its colour and glyph',
    language: () =>
      toElement(
        L.WishlistCard('Someday', [], { icon: RiHeart3Line, empty: L.Text('Nothing yet') }).tint(
          'primary/half',
        ),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <WishlistCard
            name="Someday"
            photos={[]}
            icon={RiHeart3Line}
            empty={<Text>Nothing yet</Text>}
            color={withAlpha(c.primary, 0.5)}
          />
        )}
      </Themed>
    ),
  },
];
