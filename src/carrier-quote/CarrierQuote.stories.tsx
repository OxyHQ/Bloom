import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { ContactProfileCard } from '../contact-card';
import { RiBikeLine, RiBusLine, RiCarLine } from '../icons/remix';
import { OrderStatusBar, OrderStatusTimeline } from '../order-status';
import { RouteStops } from '../route-stops';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CarrierQuoteCard } from './CarrierQuoteCard';
import { CarrierQuoteList } from './CarrierQuoteList';
import type { CarrierQuote } from './types';

const meta: Meta = {
  title: 'Blocks/Freight/CarrierQuote',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented carriers, invented amounts, invented places.
// ---------------------------------------------------------------------------

const IVO: CarrierQuote = {
  id: 'ivo',
  carrier: {
    id: 'c-ivo',
    name: 'Ivo Brennan',
    rating: 4.92,
    jobs: 214,
    vehicle: 'Van',
    vehicleIcon: RiBusLine,
    verified: true,
    detail: 'Sable Haulage',
  },
  price: '€38.40',
  priceNote: 'All in, VAT included',
  pickupWindow: 'Today, 14:00–16:00',
  eta: '17:40',
  priceValue: 38.4,
  etaMinutes: 210,
  message: 'Happy to take the sofa. I work with a second pair of hands, so the stairs are no problem.',
  priceLines: [
    { label: 'Collection and delivery', sublabel: '11.4 km', amount: '€26.00' },
    { label: 'Help loading', sublabel: 'Two people, both ends', amount: '€9.00' },
    { label: 'Stairs', sublabel: 'Third floor, no lift', amount: '€3.40' },
  ],
  priceTotal: { label: 'Total', amount: '€38.40', note: 'Paid when the job is accepted' },
};

const MARISOL: CarrierQuote = {
  id: 'marisol',
  carrier: {
    id: 'c-marisol',
    name: 'Marisol Adeyemi',
    rating: 4.71,
    jobs: 88,
    vehicle: 'Cargo bike',
    vehicleIcon: RiBikeLine,
    detail: 'Independent',
  },
  price: '€24.90',
  pickupWindow: 'Today, 15:30–16:30',
  eta: '18:20',
  priceValue: 24.9,
  etaMinutes: 260,
  expiresIn: 'Expires in 12 min',
  priceLines: [
    { label: 'Collection and delivery', sublabel: '11.4 km', amount: '€24.90' },
    { label: 'Help loading', amount: '—', state: 'pending' },
  ],
  priceTotal: { label: 'Total', amount: '€24.90' },
};

const TEODOR: CarrierQuote = {
  id: 'teodor',
  carrier: {
    id: 'c-teodor',
    name: 'Ashgrove Freight',
    rating: null,
    jobs: 3,
    vehicle: 'Car',
    vehicleIcon: RiCarLine,
    detail: 'New on the platform',
  },
  price: '€41.00',
  pickupWindow: 'Tomorrow, 08:00–10:00',
  eta: '11:05',
  priceValue: 41,
  etaMinutes: 180,
};

const QUOTES: CarrierQuote[] = [IVO, MARISOL, TEODOR];

function Page({ children, maxWidth = 680 }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20, gap: 16 }}>
      <View style={{ width: '100%', maxWidth, gap: 16 }}>{children}</View>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 640 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 640 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

/** One offer, everything filled in, with the breakdown collapsed under it. */
export const Card_: Story = {
  name: 'Card',
  render: () => (
    <Page>
      <CarrierQuoteCard
        quote={{ ...IVO, marks: ['fastest'] }}
        onAccept={noop}
        onMessage={noop}
        onDecline={noop}
        onPressCarrier={noop}
        testID="quote"
      />
    </Page>
  ),
};

/** Chosen: the accent border and the tick on the accept button. */
export const Accepted: Story = {
  render: () => (
    <Page>
      <CarrierQuoteCard quote={IVO} onAccept={noop} onMessage={noop} selected testID="quote" />
    </Page>
  ),
};

/** The compact density — a list row, not a card with the padding taken out. */
export const CompactRow: Story = {
  render: () => (
    <Page maxWidth={420}>
      <View style={{ gap: 4 }}>
        {QUOTES.map((quote) => (
          <CarrierQuoteCard key={quote.id} quote={quote} density="compact" onPressCarrier={noop} />
        ))}
      </View>
    </Page>
  ),
};

/** The whole list, sorted and marked, with the sort control live. */
export const List: Story = {
  render: function ListStory() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <Page>
        <CarrierQuoteList
          quotes={QUOTES}
          selectedId={chosen}
          onAccept={setChosen}
          onMessage={noop}
          onDecline={noop}
          onPressCarrier={noop}
          testID="offers"
        />
      </Page>
    );
  },
};

/** Nothing has arrived yet. An empty offers list is a WAIT, not a failure. */
export const Empty: Story = {
  render: () => (
    <Page>
      <CarrierQuoteList
        quotes={[]}
        emptyAction={
          <Button variant="secondary" size="medium" onPress={noop}>
            Edit the job
          </Button>
        }
        testID="offers"
      />
    </Page>
  ),
};

/** Waiting: placeholder cards of the same height, announced busy. */
export const Loading: Story = {
  render: () => (
    <Page>
      <CarrierQuoteList quotes={[]} loading loadingCount={2} testID="offers" />
    </Page>
  ),
};

/** Phone width: the actions drop to glyphs and the tiles stack two by two. */
export const Narrow: Story = {
  render: () => (
    <Page maxWidth={358}>
      <CarrierQuoteList
        quotes={QUOTES}
        onAccept={noop}
        onMessage={noop}
        onDecline={noop}
        testID="offers"
      />
    </Page>
  ),
};

/** Long names, long messages, long windows — at phone width. */
export const LongText: Story = {
  render: () => (
    <Page maxWidth={358}>
      <CarrierQuoteCard
        quote={{
          ...IVO,
          carrier: {
            ...IVO.carrier,
            name: 'Brennan & Daughters Removals and Light Haulage',
            detail: 'Operating out of the Ashgrove industrial estate since 2011',
          },
          pickupWindow: 'Today between 14:00 and 16:00, or tomorrow first thing',
          message:
            'Happy to take the sofa. I work with a second pair of hands, so the stairs are no problem, and I can bring blankets and straps if you would rather it was wrapped for the journey.',
          marks: ['cheapest', 'fastest'],
        }}
        onAccept={noop}
        onMessage={noop}
        onDecline={noop}
      />
    </Page>
  ),
};

/** Both modes in one shot. */
export const Modes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BothModes>
      <CarrierQuoteCard
        quote={{ ...IVO, marks: ['cheapest'] }}
        onAccept={noop}
        onMessage={noop}
        onDecline={noop}
      />
    </BothModes>
  ),
};

/**
 * Beside the reference this card was drawn to match: `contact-card`'s
 * `ContactProfileCard`. Same mark, same identity block, same tiles, same
 * hairline before the actions — a quote is a person with a number on it.
 */
export const BesideTheReference: Story = {
  render: () => (
    <Page maxWidth={680}>
      <View style={{ width: '100%', gap: 16 }}>
        <Caption>Bloom reference — contact-card / ContactProfileCard</Caption>
        <ContactProfileCard
          name="Nadia Okonjo"
          role="Dispatch Lead"
          company="Sable Haulage"
          status={{ label: 'Partner', tone: 'success' }}
          channels={[
            { kind: 'email', onPress: noop },
            { kind: 'phone', onPress: noop },
          ]}
          headline={{ label: 'Jobs this month', value: '148', delta: '+12' }}
          stats={[
            { value: '4.9', label: 'Rating' },
            { value: '11', label: 'Vehicles' },
            { value: '2h', label: 'Replies in' },
          ]}
          tags={['Furniture', 'Same day']}
          onPress={noop}
        />
        <Caption>This family — carrier-quote / CarrierQuoteCard</Caption>
        <CarrierQuoteCard
          quote={{ ...IVO, marks: ['cheapest'] }}
          onAccept={noop}
          onMessage={noop}
          onDecline={noop}
          onPressCarrier={noop}
          testID="quote-beside"
        />
      </View>
    </Page>
  ),
};

/**
 * The job end to end, in the families that already own each step: the route is
 * `route-stops`, the offers are this family, and the TRACKING is `order-status`
 * — `OrderStatusBar` for the live line and `OrderStatusTimeline` for what has
 * happened. Nothing here draws a second timeline.
 */
export const EndToEnd: Story = {
  render: () => (
    <Page maxWidth={680}>
      <Caption>1 — the route (route-stops)</Caption>
      <RouteStops
        stops={[
          { id: 'a', title: 'Vellmar Passage 9', subtitle: 'Pick-up, third floor', state: 'reached' },
          { id: 'b', title: 'Ashgrove Depot, Unit 4', subtitle: 'Drop-off at the loading bay', state: 'current' },
        ]}
      />
      <Caption>2 — the offer that was accepted (carrier-quote)</Caption>
      <CarrierQuoteCard quote={IVO} selected onMessage={noop} breakdown={false} />
      <Caption>3 — where it is (order-status)</Caption>
      <OrderStatusBar
        status="In transit"
        eta="Arrives 17:40"
        detail="One stop away"
        icon={RiBusLine}
        progress={{ value: 2, max: 3, accessibilityLabel: 'Delivery progress', valueText: '2 of 3 stops' }}
      />
      <OrderStatusTimeline
        steps={[
          { label: 'Job accepted', timestamp: '13:02', state: 'done' },
          { label: 'Picked up', timestamp: '14:18', note: 'Signed for at Vellmar Passage', state: 'done' },
          { label: 'In transit', timestamp: '14:31', state: 'current' },
          { label: 'Delivered', state: 'upcoming' },
        ]}
      />
    </Page>
  ),
};
