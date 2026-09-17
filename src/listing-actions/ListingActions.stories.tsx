import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BookingBar } from '../booking';
import { Button } from '../button';
import { RiFlagLine } from '../icons/remix/RiFlagLine';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import { RiShareLine } from '../icons/remix/RiShareLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ActionBar } from './ActionBar';
import { ApplicationChecklist } from './ApplicationChecklist';
import { ExchangeProposalCard } from './ExchangeProposalCard';
import { MortgageCalculator } from './MortgageCalculator';
import { computeMortgage } from './mortgage';
import { RentalActionCard } from './RentalActionCard';
import { SaleActionCard } from './SaleActionCard';
import { ViewingScheduler } from './ViewingScheduler';
import type { ApplicationItem, ExchangeMode, ListingFact, ViewingMode, ViewingSlot } from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Listing Actions',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** An offline placeholder photo: a two-stop landscape drawn as an SVG data URI. */
function scene(sky: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#fdf6ec"/></linearGradient></defs><rect width="600" height="450" fill="url(#s)"/><rect x="190" y="190" width="220" height="150" fill="#f4efe6"/><path d="M170 200 L300 110 L430 200Z" fill="#b5654a"/><rect x="280" y="260" width="40" height="80" fill="#6b4a3a"/><path d="M0 340 L600 330 L600 450 L0 450Z" fill="${ground}"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const PHOTOS = {
  harbour: scene('#9cc3e6', '#5d8a6a'),
  hills: scene('#f2b58f', '#7a8f4f'),
};

function euro(value: number): string {
  const rounded = Math.round(value);
  return `€${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function Page({ children, row = false }: { children: React.ReactNode; row?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'stretch',
        backgroundColor: theme.colors.background,
        ...(row
          ? { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }
          : { gap: 24, alignItems: 'stretch' }),
      }}
    >
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="body-2-medium" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function Column({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ width: 372, maxWidth: '100%' }}>
      <Caption>{label}</Caption>
      {children}
    </View>
  );
}

const RENTAL_FACTS: ListingFact[] = [
  { label: 'Deposit', value: '€2,500' },
  { label: 'Available from', value: 'Sep 1, 2026' },
  { label: 'Minimum stay', value: '12 months' },
  { label: 'Contract type', value: 'Long-term lease' },
];

const SALE_FACTS: ListingFact[] = [
  { label: 'Living area', value: '112 m²' },
  { label: 'Built', value: '1978, renovated 2021' },
  { label: 'Energy rating', value: 'B' },
];

function ReportLink() {
  return (
    <Button variant="link" linkTone="secondary" size="small" leadingIcon={RiFlagLine} onPress={() => undefined}>
      Report this listing
    </Button>
  );
}

const noop = () => undefined;

export const RentalCard: Story = {
  render: () => (
    <Page row>
      <Column label="Available">
        <RentalActionCard
          price="€1,250"
          billsNote="Bills included: water, heating and fibre"
          facts={RENTAL_FACTS}
          onRequestViewing={noop}
          onApply={noop}
          note="Usually responds within a day"
          footer={<ReportLink />}
          testID="rental-available"
        />
      </Column>
      <Column label="Reserved">
        <RentalActionCard
          price="€1,250"
          billsNote="Bills not included"
          facts={RENTAL_FACTS}
          status="reserved"
          onRequestViewing={noop}
          onApply={noop}
          note="Usually responds within a day"
          testID="rental-reserved"
        />
      </Column>
      <Column label="Rented">
        <RentalActionCard
          price="€980"
          originalPrice="€1,050"
          facts={RENTAL_FACTS.slice(0, 2)}
          status="rented"
          onRequestViewing={noop}
          onApply={noop}
          testID="rental-rented"
        />
      </Column>
    </Page>
  ),
};

export const SaleCard: Story = {
  render: () => (
    <Page row>
      <Column label="For sale">
        <SaleActionCard
          price="€385,000"
          pricePerArea="€3,438 / m²"
          mortgageEstimate="Est. €1,540/month"
          onPressMortgage={noop}
          facts={SALE_FACTS}
          onContact={noop}
          onRequestVisit={noop}
          onMakeOffer={noop}
          note="Listed by Harbourline Homes"
          testID="sale-available"
        />
      </Column>
      <Column label="Reserved">
        <SaleActionCard
          price="€385,000"
          pricePerArea="€3,438 / m²"
          mortgageEstimate="Est. €1,540/month"
          onPressMortgage={noop}
          status="reserved"
          onContact={noop}
          onRequestVisit={noop}
          onMakeOffer={noop}
          testID="sale-reserved"
        />
      </Column>
      <Column label="Sold">
        <SaleActionCard
          price="€362,500"
          originalPrice="€385,000"
          pricePerArea="€3,237 / m²"
          status="sold"
          onContact={noop}
          onRequestVisit={noop}
          testID="sale-sold"
        />
      </Column>
    </Page>
  ),
};

function ExchangeDemo({ layout, testID }: { layout?: 'auto' | 'horizontal' | 'vertical'; testID?: string }) {
  const [mode, setMode] = useState<ExchangeMode>('swap');
  return (
    <ExchangeProposalCard
      yourHome={{
        image: PHOTOS.harbour,
        title: 'Stone house by the harbour',
        location: 'Porto Lindo',
        details: '3 beds · 6 guests',
      }}
      theirHome={{
        image: PHOTOS.hills,
        title: 'Farmhouse with an olive grove',
        location: 'Valle Serra',
        details: '2 beds · 4 guests',
      }}
      dates="Jul 4 – 18"
      onPressDates={noop}
      guests="4 guests"
      onPressGuests={noop}
      mode={mode}
      onModeChange={setMode}
      onPropose={noop}
      note={mode === 'swap' ? 'You stay at theirs while they stay at yours.' : 'Guest points: 120 per night'}
      layout={layout}
      testID={testID}
    />
  );
}

export const ExchangeCard: Story = {
  render: () => (
    <Page row>
      <Column label="Side by side">
        <ExchangeDemo testID="exchange" />
      </Column>
      <View style={{ width: 320, maxWidth: '100%' }}>
        <Caption>Narrow (stacked)</Caption>
        <ExchangeDemo testID="exchange-narrow" />
      </View>
      <Column label="Unselected">
        <ExchangeProposalCard
          yourHome={{ title: 'Loft near the old market', location: 'Brevona', details: '1 bed · 2 guests' }}
          theirHome={{ title: 'Garden flat', location: 'Castel Aurio', details: '2 beds · 3 guests' }}
          onPressDates={noop}
          onPressGuests={noop}
          proposeDisabled
        />
      </Column>
    </Page>
  ),
};

export const OfferingCards: Story = {
  render: () => (
    <Page row>
      <Column label="Rent">
        <RentalActionCard
          price="€1,250"
          billsNote="Bills included"
          facts={RENTAL_FACTS}
          onRequestViewing={noop}
          onApply={noop}
          note="Usually responds within a day"
        />
      </Column>
      <Column label="Buy">
        <SaleActionCard
          price="€385,000"
          pricePerArea="€3,438 / m²"
          mortgageEstimate="Est. €1,540/month"
          onPressMortgage={noop}
          facts={SALE_FACTS}
          onContact={noop}
          onRequestVisit={noop}
          onMakeOffer={noop}
        />
      </Column>
      <Column label="Swap">
        <ExchangeDemo />
      </Column>
    </Page>
  ),
};

export const ActionBars: Story = {
  render: () => (
    <Page>
      <View style={{ width: '100%', maxWidth: 420, gap: 8 }}>
        <Caption>Stay</Caption>
        <BookingBar price="$180" priceUnit="night" dates="Oct 12 – 17" onPressDates={noop} onReserve={noop} />
        <Caption>Rent</Caption>
        <ActionBar
          price="€1,250"
          priceUnit="month"
          priceUnitPrefix="/"
          subtitle="Available from Sep 1"
          primaryLabel="Request a viewing"
          onPrimary={noop}
          testID="bar-rent"
        />
        <Caption>Buy</Caption>
        <ActionBar
          price="€385,000"
          subtitle="Est. €1,540/month"
          onPressSubtitle={noop}
          primaryLabel="Contact agent"
          onPrimary={noop}
          secondaryIcon={RiHeart3Line}
          secondaryLabel="Save"
          onSecondary={noop}
          testID="bar-buy"
        />
        <Caption>Swap</Caption>
        <ActionBar
          price="120 pts"
          priceUnit="night"
          priceUnitPrefix="/"
          subtitle="Jul 4 – 18"
          onPressSubtitle={noop}
          primaryLabel="Propose"
          onPrimary={noop}
          secondaryIcon={RiShareLine}
          secondaryLabel="Share"
          onSecondary={noop}
        />
        <Caption>Unavailable</Caption>
        <ActionBar price="€980" priceUnit="month" priceUnitPrefix="/" subtitle="Rented" primaryLabel="Apply" primaryDisabled />
      </View>
    </Page>
  ),
};

function CalculatorDemo({ testID }: { testID?: string }) {
  const [price, setPrice] = useState(385000);
  const [down, setDown] = useState(77000);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(3.4);
  return (
    <MortgageCalculator
      price={price}
      onPriceChange={setPrice}
      downPayment={down}
      onDownPaymentChange={setDown}
      years={years}
      onYearsChange={setYears}
      annualRate={rate}
      onAnnualRateChange={setRate}
      formatCurrency={euro}
      testID={testID}
    />
  );
}

export const Calculator: Story = {
  render: () => (
    <Page>
      <View style={{ width: 760, maxWidth: '100%' }}>
        <Caption>Beside the listing (split from 640)</Caption>
        <CalculatorDemo testID="calculator" />
      </View>
      <View style={{ width: 372, maxWidth: '100%' }}>
        <Caption>In a sheet (stacked)</Caption>
        <MortgageCalculator defaultPrice={240000} defaultAnnualRate={4.1} defaultYears={30} formatCurrency={euro} />
      </View>
    </Page>
  ),
};

/** The teaser on the sale card reads the same function the calculator does. */
export const SaleWithEstimate: Story = {
  render: function SaleWithEstimateStory() {
    const estimate = useMemo(
      () => computeMortgage({ price: 385000, downPayment: 77000, years: 25, annualRate: 3.4 }),
      [],
    );
    return (
      <Page row>
        <Column label="Sale card">
          <SaleActionCard
            price="€385,000"
            pricePerArea="€3,438 / m²"
            mortgageEstimate={`Est. ${euro(estimate.monthlyPayment)}/month`}
            onPressMortgage={noop}
            onContact={noop}
            onRequestVisit={noop}
          />
        </Column>
      </Page>
    );
  },
};

const DAYS = [
  { value: '2026-09-14', weekday: 'Mon', day: '14' },
  { value: '2026-09-15', weekday: 'Tue', day: '15' },
  { value: '2026-09-16', weekday: 'Wed', day: '16', disabled: true },
  { value: '2026-09-17', weekday: 'Thu', day: '17' },
  { value: '2026-09-18', weekday: 'Fri', day: '18' },
  { value: '2026-09-19', weekday: 'Sat', day: '19' },
  { value: '2026-09-20', weekday: 'Sun', day: '20', disabled: true },
  { value: '2026-09-21', weekday: 'Mon', day: '21' },
  { value: '2026-09-22', weekday: 'Tue', day: '22' },
];

const SLOTS: ViewingSlot[] = [
  { value: '09:00', label: '09:00' },
  { value: '09:30', label: '09:30', disabled: true },
  { value: '10:00', label: '10:00' },
  { value: '11:30', label: '11:30' },
  { value: '13:00', label: '13:00' },
  { value: '15:30', label: '15:30' },
  { value: '17:00', label: '17:00', disabled: true },
  { value: '18:30', label: '18:30' },
];

function SchedulerDemo({ initialDay = '2026-09-15', testID }: { initialDay?: string | null; testID?: string }) {
  const [day, setDay] = useState<string | null>(initialDay);
  const [slot, setSlot] = useState<string | null>(initialDay ? '11:30' : null);
  const [mode, setMode] = useState<ViewingMode>('in-person');
  const [note, setNote] = useState('');
  const slots = day === '2026-09-19' ? [] : SLOTS;
  return (
    <ViewingScheduler
      days={DAYS}
      day={day}
      onDayChange={(value) => {
        setDay(value);
        setSlot(null);
      }}
      slots={slots}
      slot={slot}
      onSlotChange={setSlot}
      mode={mode}
      onModeChange={setMode}
      note={note}
      onNoteChange={setNote}
      notePlaceholder="Anything the landlord should know"
      onSubmit={noop}
      testID={testID}
    />
  );
}

export const Scheduler: Story = {
  render: () => (
    <Page row>
      <Column label="A day and time chosen">
        <SchedulerDemo testID="scheduler" />
      </Column>
      <Column label="Nothing chosen yet">
        <SchedulerDemo initialDay={null} />
      </Column>
    </Page>
  ),
};

const ITEMS: ApplicationItem[] = [
  { key: 'id', title: 'Proof of identity', description: 'Passport or national ID, both sides', status: 'verified' },
  { key: 'payslips', title: 'Last three payslips', description: 'June, July and August', status: 'uploaded' },
  { key: 'contract', title: 'Employment contract', description: 'Signed, with your current salary', status: 'missing' },
  {
    key: 'bank',
    title: 'Bank statement',
    status: 'rejected',
    reason: 'The account holder name is cut off. Upload the full first page.',
  },
  { key: 'references', title: 'Landlord reference', description: 'From your current or last landlord', status: 'missing' },
];

export const Checklist: Story = {
  render: function ChecklistStory() {
    const [items, setItems] = useState(ITEMS);
    return (
      <Page>
        <ApplicationChecklist
          items={items}
          onItemAction={(item) =>
            setItems((current) =>
              current.map((it) =>
                it.key === item.key && (it.status === 'missing' || it.status === 'rejected')
                  ? { ...it, status: 'uploaded', reason: undefined }
                  : it,
              ),
            )
          }
          testID="checklist"
        />
      </Page>
    );
  },
};
