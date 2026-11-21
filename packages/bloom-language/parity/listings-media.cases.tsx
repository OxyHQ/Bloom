import { RiHeart3Line, RiWifiLine } from '@oxy.so/bloom/icons';
import {
  AmenityList,
  HostCard,
  ListingHeader,
  ListingHeaderAction,
  ListingPhotoGrid,
  ReviewCard,
} from '@oxy.so/bloom/listing-details';
import { MapClusterMarker, MapPriceMarker, MapSearchAreaButton } from '@oxy.so/bloom/map-marker';
import { FollowButton } from '@oxy.so/bloom/media-header';
import { Shelf, ShelfSkeleton } from '@oxy.so/bloom/media-shelf';
import { SubscriptionPlans, SubscriptionPrice } from '@oxy.so/bloom/subscription-plans';
import { Text } from '@oxy.so/bloom/typography';
import { UserHoverCard } from '@oxy.so/bloom/user-hover-card';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const AMENITIES = [
  { label: 'Wi-Fi', icon: RiWifiLine },
  { label: 'Pool', available: false },
];
const STATS = [
  { value: '128', label: 'Reviews' },
  { value: '4.9', label: 'Rating', star: true },
];
const PHOTOS = [
  { source: PHOTO, alt: 'Living room' },
  { source: PHOTO, alt: 'Kitchen' },
  { source: PHOTO, alt: 'Bedroom' },
];
const PLANS = [
  {
    id: 'plus',
    label: 'Plus',
    price: { amount: 4.99, currency: 'EUR', suffix: '/mo' },
    benefits: [{ id: 'a', title: 'No ads' }],
  },
  { id: 'pro', label: 'Pro', benefits: [{ id: 'b', title: 'Everything' }] },
];

const listings: ParityCase[] = [
  {
    name: 'AmenityList',
    language: () => toElement(L.AmenityList(AMENITIES, { columns: 2, onShowAll: press })),
    bloom: () => <AmenityList items={AMENITIES} columns={2} onShowAll={press} />,
  },
  {
    name: 'HostCard',
    language: () =>
      toElement(L.HostCard('Ana Lima', { verified: true, stats: STATS, onMessage: press })),
    bloom: () => <HostCard name="Ana Lima" verified stats={STATS} onMessage={press} />,
  },
  ...ENUMS.listingHeaderSize.map((size) => ({
    name: `ListingHeader ${size}`,
    language: () =>
      toElement(
        L.ListingHeader('Sea view loft', {
          subtitle: ['2 guests', '1 bed'],
          rating: 4.9,
          location: 'Lisbon',
          actions: L.ListingHeaderAction('Save', { icon: RiHeart3Line }).onPress(press),
        }).size(size),
      ),
    bloom: () => (
      <ListingHeader
        title="Sea view loft"
        subtitle={['2 guests', '1 bed']}
        rating={4.9}
        location="Lisbon"
        actions={<ListingHeaderAction label="Save" icon={RiHeart3Line} onPress={press} />}
        size={size}
      />
    ),
  })),
  {
    name: 'ListingHeaderAction icon only, pressed',
    language: () =>
      toElement(
        L.ListingHeaderAction('Share', {
          icon: RiHeart3Line,
          iconOnly: true,
          pressed: true,
        }).onPress(press),
      ),
    bloom: () => (
      <ListingHeaderAction label="Share" icon={RiHeart3Line} iconOnly pressed onPress={press} />
    ),
  },
  ...ENUMS.listingPhotoLayout.map((layout) => ({
    name: `ListingPhotoGrid ${layout}`,
    language: () => toElement(L.ListingPhotoGrid(PHOTOS, { onShowAll: press }).style(layout)),
    bloom: () => <ListingPhotoGrid photos={PHOTOS} onShowAll={press} layout={layout} />,
  })),
  {
    name: 'ReviewCard',
    language: () =>
      toElement(
        L.ReviewCard('Ana Lima', 'A lovely stay by the sea.', {
          rating: 5,
          date: 'May 2026',
        }).lines(2),
      ),
    bloom: () => (
      <ReviewCard
        name="Ana Lima"
        text="A lovely stay by the sea."
        rating={5}
        date="May 2026"
        numberOfLines={2}
      />
    ),
  },
  ...ENUMS.mapMarkerState.map((state) => ({
    name: `MapClusterMarker ${state}`,
    language: () => toElement(L.MapClusterMarker(12).style(state).onPress(press)),
    bloom: () => <MapClusterMarker count={12} state={state} onPress={press} />,
  })),
  ...ENUMS.mapMarkerState.flatMap((state) =>
    ENUMS.mapPriceMarkerSize.map((size) => ({
      name: `MapPriceMarker ${state} ${size}`,
      language: () =>
        toElement(L.MapPriceMarker('€120', { saved: true }).style(state).size(size).onPress(press)),
      bloom: () => <MapPriceMarker price="€120" saved state={state} size={size} onPress={press} />,
    })),
  ),
  {
    name: 'MapSearchAreaButton',
    language: () => toElement(L.MapSearchAreaButton({ label: 'Search here' }).onPress(press)),
    bloom: () => <MapSearchAreaButton label="Search here" onPress={press} />,
  },
  {
    name: 'MapSearchAreaButton a toggle, disabled',
    language: () =>
      toElement(
        L.MapSearchAreaButton({
          variant: 'toggle',
          checked: true,
          onCheckedChange: set,
        }).disabled(),
      ),
    bloom: () => <MapSearchAreaButton variant="toggle" checked onCheckedChange={set} disabled />,
  },
];

const media: ParityCase[] = [
  {
    name: 'FollowButton',
    language: () => toElement(L.FollowButton([false, set])),
    bloom: () => <FollowButton following={false} onFollowChange={set} />,
  },
  ...ENUMS.followButtonSize.map((size) => ({
    name: `FollowButton following ${size}, outlined, loading`,
    language: () =>
      toElement(L.FollowButton([true, set]).size(size).style('outline').tint('neutral').loading()),
    bloom: () => (
      <FollowButton
        following
        onFollowChange={set}
        size={size}
        appearance="outline"
        tone="neutral"
        loading
      />
    ),
  })),
  ...ENUMS.shelfLayout.map((layout) => ({
    name: `Shelf ${layout}`,
    language: () =>
      toElement(
        L.Shelf('New releases', [L.Text('One').id('a'), L.Text('Two').id('b')], {
          subtitle: 'This week',
          onShowAll: press,
          itemWidth: '160',
        })
          .style(layout)
          .spacing('md'),
      ),
    bloom: () => (
      <Shelf
        title="New releases"
        subtitle="This week"
        onShowAll={press}
        itemWidth={160}
        layout={layout}
        gap={12}
      >
        <Text>One</Text>
        <Text>Two</Text>
      </Shelf>
    ),
  })),
  ...ENUMS.shelfLayout.map((layout) => ({
    name: `ShelfSkeleton ${layout}`,
    language: () =>
      toElement(L.ShelfSkeleton({ count: 3, round: true, itemWidth: '120' }).style(layout)),
    bloom: () => <ShelfSkeleton count={3} round itemWidth={120} layout={layout} />,
  })),
  {
    name: 'SubscriptionPlans',
    language: () =>
      toElement(
        L.SubscriptionPlans(['plus', set], {
          productName: 'Oxy',
          plans: PLANS,
          selectorLabel: 'Plan',
          primaryAction: { label: 'Subscribe', onPress: press },
          footer: L.Text('Cancel any time'),
        }),
      ),
    bloom: () => (
      <SubscriptionPlans
        value="plus"
        onValueChange={set}
        productName="Oxy"
        plans={PLANS}
        selectorLabel="Plan"
        primaryAction={{ label: 'Subscribe', onPress: press }}
        footer={<Text>Cancel any time</Text>}
      />
    ),
  },
  {
    name: 'SubscriptionPrice',
    language: () =>
      toElement(
        L.SubscriptionPrice({ amount: 4.99, currency: 'EUR', suffix: '/mo', locale: 'en' }),
      ),
    bloom: () => <SubscriptionPrice amount={4.99} currency="EUR" suffix="/mo" locale="en" />,
  },
  {
    name: 'UserHoverCard',
    language: () =>
      toElement(
        L.UserHoverCard('Ana Lima', {
          username: 'ana',
          bio: 'Maps and coffee',
          stats: [{ label: 'Followers', value: 120 }],
          verified: true,
          animateIn: false,
          action: L.Button(L.Text('Follow')).onPress(press),
        }),
      ),
    bloom: () => (
      <UserHoverCard
        displayName="Ana Lima"
        username="ana"
        bio="Maps and coffee"
        stats={[{ label: 'Followers', value: 120 }]}
        verified
        animateIn={false}
        action={toElement(L.Button(L.Text('Follow')).onPress(press))}
      />
    ),
  },
  {
    name: 'UserHoverCard loading',
    language: () => toElement(L.UserHoverCard('Ana Lima', { loading: true, animateIn: false })),
    bloom: () => <UserHoverCard displayName="Ana Lima" loading animateIn={false} />,
  },
];

export const LISTINGS_MEDIA_CASES: ParityCase[] = [...listings, ...media];
