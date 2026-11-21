import { BookingBar, BookingCard, PriceBreakdown, TripCard } from '@oxy.so/bloom/booking';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const ROWS = [
  { label: '$180 x 5 nights', amount: '$900', onPressLabel: press },
  { label: 'Cleaning fee', amount: '$60' },
  { label: 'Early bird', amount: '$45', tone: 'discount' as const },
];
const BREAKDOWN = { rows: ROWS, total: '$915' };

export const BOOKING_CASES: ParityCase[] = [
  {
    name: 'TripCard',
    language: () =>
      toElement(
        L.TripCard('Cliffside cabin', {
          image: PHOTO,
          subtitle: 'Hosted by Marisol',
          dates: 'Oct 12 – 17, 2026',
          status: 'confirmed',
        }),
      ),
    bloom: () => (
      <TripCard
        image={PHOTO}
        title="Cliffside cabin"
        subtitle="Hosted by Marisol"
        dates="Oct 12 – 17, 2026"
        status="confirmed"
      />
    ),
  },
  ...ENUMS.tripCardOrientation.map((orientation) => ({
    name: `TripCard ${orientation}, pressable, with actions`,
    language: () =>
      toElement(
        L.TripCard('Cliffside cabin', {
          dates: 'Oct 12 – 17',
          status: 'pending',
          statusLabel: 'Awaiting host',
          actions: L.Button(L.Text('Message host')).onPress(press),
        })
          .style(orientation)
          .onPress(press),
      ),
    bloom: () => (
      <TripCard
        title="Cliffside cabin"
        dates="Oct 12 – 17"
        status="pending"
        statusLabel="Awaiting host"
        actions={toElement(L.Button(L.Text('Message host')).onPress(press))}
        orientation={orientation}
        onPress={press}
      />
    ),
  })),
  {
    name: 'TripCard pressable, named',
    language: () =>
      toElement(
        L.TripCard('Cliffside cabin', { status: 'cancelled' }).onPress(press).label('Open trip'),
      ),
    bloom: () => (
      <TripCard
        title="Cliffside cabin"
        status="cancelled"
        onPress={press}
        accessibilityLabel="Open trip"
      />
    ),
  },
  {
    name: 'BookingCard',
    language: () =>
      toElement(
        L.BookingCard('$180', '2 guests', {
          priceUnit: 'night',
          originalPrice: '$210',
          rating: 4.92,
          reviewCount: 128,
          onPressDates: press,
          onPressGuests: press,
          onReserve: press,
        }),
      ),
    bloom: () => (
      <BookingCard
        price="$180"
        guests="2 guests"
        priceUnit="night"
        originalPrice="$210"
        rating={4.92}
        reviewCount={128}
        onPressDates={press}
        onPressGuests={press}
        onReserve={press}
      />
    ),
  },
  {
    name: 'BookingCard with dates, a breakdown, a note and a footer',
    language: () =>
      toElement(
        L.BookingCard('$180', '2 guests', {
          checkIn: 'Oct 12',
          checkOut: 'Oct 17',
          activeField: 'checkOut',
          rating: null,
          breakdown: BREAKDOWN,
          note: L.Text('Free cancellation'),
          footer: L.Text('Report this listing'),
          onReserve: press,
        }),
      ),
    bloom: () => (
      <BookingCard
        price="$180"
        guests="2 guests"
        checkIn="Oct 12"
        checkOut="Oct 17"
        activeField="checkOut"
        rating={null}
        breakdown={BREAKDOWN}
        note={<Text>Free cancellation</Text>}
        footer={<Text>Report this listing</Text>}
        onReserve={press}
      />
    ),
  },
  {
    name: 'BookingCard loading, disabled, its note hidden',
    language: () =>
      toElement(
        L.BookingCard('$180', '2 guests', { checkIn: 'Oct 12', checkOut: 'Oct 17', note: null })
          .loading()
          .disabled(),
      ),
    bloom: () => (
      <BookingCard
        price="$180"
        guests="2 guests"
        checkIn="Oct 12"
        checkOut="Oct 17"
        note={null}
        loading
        reserveDisabled
      />
    ),
  },
  {
    name: 'BookingBar',
    language: () =>
      toElement(
        L.BookingBar('$180', {
          priceUnit: 'night',
          dates: 'Oct 12 – 17',
          onPressDates: press,
          onReserve: press,
        }),
      ),
    bloom: () => (
      <BookingBar
        price="$180"
        priceUnit="night"
        dates="Oct 12 – 17"
        onPressDates={press}
        onReserve={press}
      />
    ),
  },
  {
    name: 'BookingBar loading, disabled, its inset',
    language: () =>
      toElement(
        L.BookingBar('€1,250', { priceUnit: 'month', priceUnitPrefix: '/', bottomInset: 'lg' })
          .loading()
          .disabled(),
      ),
    bloom: () => (
      <BookingBar
        price="€1,250"
        priceUnit="month"
        priceUnitPrefix="/"
        bottomInset={16}
        loading
        reserveDisabled
      />
    ),
  },
  {
    name: 'PriceBreakdown',
    language: () => toElement(L.PriceBreakdown(ROWS, { total: '$915', totalLabel: 'Total (USD)' })),
    bloom: () => <PriceBreakdown rows={ROWS} total="$915" totalLabel="Total (USD)" />,
  },
  {
    name: 'PriceBreakdown without a total',
    language: () => toElement(L.PriceBreakdown(ROWS.slice(0, 2))),
    bloom: () => <PriceBreakdown rows={ROWS.slice(0, 2)} />,
  },
];
