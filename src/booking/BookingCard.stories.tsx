import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BookingBar } from './BookingBar';
import { BookingCard } from './BookingCard';
import { GuestPicker } from '../stay-search';
import type { GuestCounts } from '../stay-search';
import { PriceBreakdown } from './PriceBreakdown';
import { TripCard } from './TripCard';
import type { PriceBreakdownProps } from './types';
import { Button } from '../button';
import { RiFlagLine } from '../icons/remix/RiFlagLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Blocks/Stays/Booking',
};

export default meta;

type Story = StoryObj;

/** An offline placeholder photo: a two-stop landscape drawn as an SVG data URI. */
function scene(sky: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#fdf6ec"/></linearGradient></defs><rect width="600" height="400" fill="url(#s)"/><circle cx="450" cy="120" r="46" fill="#fff6d8"/><path d="M0 300 L140 190 L260 280 L380 170 L600 310 L600 400 L0 400Z" fill="${ground}"/><path d="M0 350 L200 290 L420 340 L600 300 L600 400 L0 400Z" fill="${ground}" opacity="0.7"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const PHOTOS = {
  cabin: scene('#9cc3e6', '#3f6b4f'),
  coast: scene('#f2b58f', '#2f5d78'),
  dunes: scene('#f6d7a6', '#b8773f'),
};

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View style={{ padding: 24, backgroundColor: theme.colors.background, alignItems: 'flex-start' }}>
      <View style={{ width: width ?? '100%', maxWidth: '100%' }}>{children}</View>
    </View>
  );
}

const BREAKDOWN: PriceBreakdownProps = {
  rows: [
    { label: '$180 x 5 nights', amount: '$900' },
    { label: 'Cleaning fee', amount: '$45' },
    { label: 'Service fee', amount: '$127' },
  ],
  total: '$1,072',
};

function ReportLink() {
  return (
    <Button variant="link" linkTone="secondary" size="small" leadingIcon={RiFlagLine} onPress={() => undefined}>
      Report this listing
    </Button>
  );
}

function GuestsDemo({ initialOpen = false }: { initialOpen?: boolean }) {
  const [counts, setCounts] = useState<GuestCounts>({ adults: 2, children: 0, infants: 1, pets: 0 });
  const [open, setOpen] = useState(initialOpen);
  const guests = counts.adults + counts.children;
  const summary = [
    `${guests} guest${guests === 1 ? '' : 's'}`,
    counts.infants ? `${counts.infants} infant${counts.infants === 1 ? '' : 's'}` : null,
    counts.pets ? `${counts.pets} pet${counts.pets === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <BookingCard
      price="$180"
      priceUnit="night"
      rating={4.92}
      reviewCount={128}
      checkIn="10/12/2026"
      checkOut="10/17/2026"
      guests={summary}
      guestsOpen={open}
      onGuestsOpenChange={setOpen}
      guestPicker={
        <GuestPicker
          size="small"
          value={counts}
          onChange={setCounts}
          maxGuests={4}
          note="This place has a maximum of 4 guests, not including infants. Pets aren't allowed."
        />
      }
      breakdown={BREAKDOWN}
    />
  );
}

/** No dates yet: placeholders in both date cells, "Check availability", no note or breakdown. */
export const NoDates: Story = {
  render: () => (
    <Page width={372}>
      <BookingCard price="$180" priceUnit="night" rating={4.92} reviewCount={128} guests="1 guest" />
    </Page>
  ),
};

/** Dates selected: "Reserve", the note, the breakdown and a footer link. */
export const DatesSelected: Story = {
  render: () => (
    <Page width={372}>
      <BookingCard
        price="$180"
        priceUnit="night"
        rating={4.92}
        reviewCount={128}
        checkIn="10/12/2026"
        checkOut="10/17/2026"
        guests="2 guests"
        breakdown={BREAKDOWN}
        footer={<ReportLink />}
      />
    </Page>
  ),
};

/** At phone width (320): the card fills its column and the cells share it. */
export const Narrow: Story = {
  render: () => (
    <Page width={320}>
      <BookingCard
        price="$1,240"
        originalPrice="$1,380"
        priceUnit="night"
        rating={4.8}
        reviewCount="1.2k"
        checkIn="Wed, Oct 12, 2026"
        checkOut="Mon, Oct 17, 2026"
        guests="4 guests, 1 infant, 1 pet"
        breakdown={BREAKDOWN}
      />
    </Page>
  ),
};

/** A struck earlier price, a discount row, and a label that opens its explanation. */
export const Discount: Story = {
  render: () => (
    <Page width={372}>
      <BookingCard
        price="$162"
        originalPrice="$180"
        priceUnit="night"
        rating={null}
        checkIn="10/12/2026"
        checkOut="10/19/2026"
        guests="3 guests"
        breakdown={{
          rows: [
            { label: '$180 x 7 nights', amount: '$1,260' },
            {
              label: 'Weekly stay discount',
              amount: '$126',
              tone: 'discount',
              details: <DetailsNote text="Stays of 7 nights or more get 10% off the nightly price." />,
            },
            { label: 'Cleaning fee', amount: '$45' },
            {
              label: 'Service fee',
              amount: '$152',
              details: <DetailsNote text="This helps run the platform and covers support around the clock." />,
            },
          ],
          total: '$1,331',
        }}
      />
    </Page>
  ),
};

function DetailsNote({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Text variant="body-regular" style={{ color: theme.colors.text, padding: 8 }}>
      {text}
    </Text>
  );
}

/** Reserving: the button shows its spinner and ignores presses; the date cell being edited is outlined. */
export const Loading: Story = {
  render: () => (
    <Page width={372}>
      <BookingCard
        price="$180"
        priceUnit="night"
        rating={4.92}
        reviewCount={128}
        checkIn="10/12/2026"
        checkOut="10/17/2026"
        guests="2 guests"
        activeField="checkOut"
        loading
        breakdown={BREAKDOWN}
      />
    </Page>
  ),
};

/** The guests popover open (a bottom sheet on native): steppers capped at 4 guests, "Close" shuts it. */
export const GuestsOpen: Story = {
  render: () => (
    <Page width={372}>
      <GuestsDemo initialOpen />
      <View style={{ height: 420 }} />
    </Page>
  ),
};

/** `PriceBreakdown` on its own, as a checkout summary. */
export const PriceBreakdownAlone: Story = {
  render: () => (
    <Page width={360}>
      <PriceBreakdown
        rows={[
          { label: '$240 x 3 nights', amount: '$720' },
          { label: 'Early booking discount', amount: '$72', tone: 'discount' },
          { label: 'Cleaning fee', amount: '$60', onPressLabel: () => undefined },
          { label: 'Taxes', amount: '$64' },
        ]}
        totalLabel="Total (USD)"
        total="$772"
      />
    </Page>
  ),
};

/** The phone bar at 375: price and dates on the left, "Reserve" on the right. */
export const BookingBarPhone: Story = {
  render: function BarDemo() {
    const theme = useTheme();
    return (
      <View style={{ backgroundColor: theme.colors.background, padding: 24, gap: 24, alignItems: 'flex-start' }}>
        <View style={{ width: 375, gap: 16 }}>
          <BookingBar
            price="$180"
            priceUnit="night"
            dates="Oct 12 – 17"
            onPressDates={() => undefined}
            testID="bar"
          />
          <BookingBar price="$162" originalPrice="$180" priceUnit="night" dates="Oct 12 – 19" reserveLabel="Reserve" />
          <BookingBar price="$180" priceUnit="night" reserveLabel="Check availability" loading bottomInset={34} />
        </View>
      </View>
    );
  },
};

function TripActions() {
  return (
    <>
      <Button variant="secondary" size="small" onPress={() => undefined}>
        Message host
      </Button>
      <Button variant="secondary" size="small" onPress={() => undefined}>
        Get directions
      </Button>
    </>
  );
}

/** Each status, vertical at phone width and horizontal (auto) in a wide column. */
export const TripCards: Story = {
  render: function Trips() {
    const theme = useTheme();
    return (
      <View style={{ backgroundColor: theme.colors.background, padding: 24, gap: 32 }}>
        <View style={{ width: 720, maxWidth: '100%', gap: 16 }}>
          <TripCard
            image={PHOTOS.cabin}
            title="Cliffside cabin in Val Serena"
            subtitle="Hosted by Marisol"
            dates="Oct 12 – 17, 2026"
            status="confirmed"
            actions={<TripActions />}
            onPress={() => undefined}
            testID="trip-wide"
          />
          <TripCard
            image={PHOTOS.coast}
            title="Harbour loft in Porto Lume"
            subtitle="Hosted by Anselm"
            dates="Nov 3 – 6, 2026"
            status="pending"
            onPress={() => undefined}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <View style={{ width: 320 }}>
            <TripCard
              image={PHOTOS.dunes}
              title="Dune house near Ras Meridia"
              subtitle="Hosted by Idris"
              dates="Aug 2 – 9, 2026"
              status="completed"
              actions={
                <Button variant="secondary" size="small" onPress={() => undefined}>
                  Write a review
                </Button>
              }
              onPress={() => undefined}
            />
          </View>
          <View style={{ width: 320 }}>
            <TripCard
              title="Garden studio in Aldercombe"
              subtitle="Hosted by Pim"
              dates="Jul 18 – 20, 2026"
              status="cancelled"
            />
          </View>
        </View>
      </View>
    );
  },
};

/** Card, bar and a trip, forced dark. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: function DarkDemo() {
    const theme = useTheme();
    return (
      <View style={{ backgroundColor: theme.colors.background, padding: 24, gap: 24, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ width: 372 }}>
            <BookingCard
              price="$162"
              originalPrice="$180"
              priceUnit="night"
              rating={4.92}
              reviewCount={128}
              checkIn="10/12/2026"
              checkOut="10/19/2026"
              guests="2 guests"
              activeField="checkIn"
              breakdown={{
                rows: [
                  { label: '$180 x 7 nights', amount: '$1,260' },
                  { label: 'Weekly stay discount', amount: '$126', tone: 'discount', onPressLabel: () => undefined },
                  { label: 'Service fee', amount: '$152' },
                ],
                total: '$1,286',
              }}
              footer={<ReportLink />}
            />
          </View>
          <View style={{ width: 360, gap: 16 }}>
            <TripCard
              image={PHOTOS.coast}
              title="Harbour loft in Porto Lume"
              subtitle="Hosted by Anselm"
              dates="Nov 3 – 6, 2026"
              status="pending"
              actions={<TripActions />}
              onPress={() => undefined}
            />
            <PriceBreakdown rows={BREAKDOWN.rows} total={BREAKDOWN.total} />
          </View>
        </View>
        <View style={{ width: 375 }}>
          <BookingBar price="$180" priceUnit="night" dates="Oct 12 – 17" onPressDates={() => undefined} />
        </View>
      </View>
    );
  },
};
