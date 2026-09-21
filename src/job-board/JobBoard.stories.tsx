import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { JobBoard } from './JobBoard';
import { JobCard } from './JobCard';
import type { JobBoardBand, JobOffer } from './types';

const meta: Meta = {
  title: 'Blocks/Fulfilment/JobBoard',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented loads, invented amounts, invented streets.
// ---------------------------------------------------------------------------

const SOFA: JobOffer = {
  id: 'sofa',
  load: 'Two-seater sofa and a footstool',
  loadNote: 'Third floor, no lift',
  pay: '€38.40',
  payNote: 'Fuel and tolls included',
  pickup: { title: 'Rua das Amoreiras 12', subtitle: 'Ring the bell marked Peralta' },
  dropoff: { title: 'Travessa do Olival 3', subtitle: 'Ground floor, side door' },
  distance: '11.4 km',
  duration: 'about 40 min',
  window: 'Today, 14:00–16:00',
  vehicle: 'Van',
  vehicleKind: 'van',
  expiresIn: 'Open for 12 more minutes',
  tags: ['Two people'],
  payValue: 38.4,
  distanceKm: 11.4,
  startsInMinutes: 90,
  expiresInMinutes: 12,
  payLines: [
    { label: 'Collection and delivery', sublabel: '11.4 km', amount: '€26.00' },
    { label: 'Help loading', sublabel: 'Two people, both ends', amount: '€9.00' },
    { label: 'Stairs', sublabel: 'Third floor, no lift', amount: '€3.40' },
  ],
  payTotal: { label: 'You earn', amount: '€38.40', note: 'Paid the day after the job' },
};

const TRAYS: JobOffer = {
  id: 'trays',
  load: 'Six catering trays',
  pay: '€16.80',
  pickup: { title: 'Praça do Feijó 8', subtitle: 'Kitchen entrance at the back' },
  dropoff: { title: 'Largo da Bica 41', meta: '2.1 km away' },
  distance: '2.6 km',
  duration: 'about 14 min',
  window: 'Today, 12:15–12:45',
  vehicle: 'Cargo bike',
  vehicleKind: 'bike',
  expiresIn: 'Open for 4 more minutes',
  tags: ['Keep level'],
  payValue: 16.8,
  distanceKm: 2.6,
  startsInMinutes: 25,
  expiresInMinutes: 4,
};

const FRIDGE: JobOffer = {
  id: 'fridge',
  load: 'Chilled crates for the market stall',
  loadNote: 'Must stay under 4 °C',
  pay: '€164.00',
  payNote: 'Before the platform fee',
  pickup: { title: 'Cais do Sodré, bay 7' },
  dropoff: { title: 'Mercado do Arieiro, stall 22' },
  via: [{ title: 'Rua Ferreira Borges 60', subtitle: 'Second collection' }],
  distance: '23.8 km',
  duration: 'about 1 h 10',
  window: 'Tomorrow, 05:30–07:00',
  vehicle: 'Refrigerated van',
  vehicleKind: 'refrigerated',
  tags: ['Early start'],
  payValue: 164,
  distanceKm: 23.8,
  startsInMinutes: 780,
  expiresInMinutes: 240,
};

const PIANO: JobOffer = {
  id: 'piano',
  load: 'Upright piano',
  pay: '€142.00',
  pickup: { title: 'Avenida do Restelo 210' },
  dropoff: { title: 'Rua do Sol à Graça 5', subtitle: 'Narrow street, park at the corner' },
  distance: '9.2 km',
  duration: 'about 50 min',
  window: 'Saturday, 09:00–13:00',
  vehicle: 'Box truck',
  vehicleKind: 'boxTruck',
  tags: ['Three people', 'Fragile'],
  state: 'taken',
  payValue: 142,
  distanceKm: 9.2,
  startsInMinutes: 3000,
};

const PARCEL: JobOffer = {
  id: 'parcel',
  load: 'One parcel, 4 kg',
  pay: '€7.20',
  pickup: { title: 'Rua da Prata 17' },
  dropoff: { title: 'Calçada do Combro 88' },
  distance: '1.8 km',
  duration: 'about 9 min',
  window: 'Today, as soon as you can',
  vehicle: 'Car',
  vehicleKind: 'car',
  state: 'expired',
  payValue: 7.2,
  distanceKm: 1.8,
  startsInMinutes: 5,
  expiresInMinutes: 0,
};

const JOBS: JobOffer[] = [SOFA, TRAYS, FRIDGE, PIANO, PARCEL];

/** The app owns its currency, so it owns the words on a pay band. */
const PAY_BANDS: JobBoardBand[] = [
  { value: null, label: 'Any pay' },
  { value: 20, label: '€20 and up' },
  { value: 50, label: '€50 and up' },
  { value: 100, label: '€100 and up' },
];

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

/** One job, everything filled in, with what it pays collapsed under it. */
export const Card_: Story = {
  name: 'Card',
  render: () => (
    <Page>
      <JobCard job={SOFA} onTake={noop} onPass={noop} onPressJob={noop} testID="job" />
    </Page>
  ),
};

/** The job being looked at: the accent border, and nothing inside it moves. */
export const Looking: Story = {
  render: () => (
    <Page>
      <JobCard job={FRIDGE} onTake={noop} onPass={noop} selected testID="job" />
    </Page>
  ),
};

/**
 * A job that closed while the reader was looking at it. It keeps its place, the
 * take action is gone rather than greyed out, and the card says which of the two
 * things happened.
 */
export const Closed: Story = {
  render: () => (
    <Page>
      <Caption>Taken by someone else</Caption>
      <JobCard job={PIANO} onTake={noop} onPass={noop} testID="taken" />
      <Caption>The offer ran out</Caption>
      <JobCard job={PARCEL} onTake={noop} onPass={noop} testID="expired" />
    </Page>
  ),
};

/** The compact density — a list row, not a card with the padding taken out. */
export const CompactRow: Story = {
  render: () => (
    <Page maxWidth={420}>
      <View style={{ gap: 4 }}>
        {JOBS.map((job) => (
          <JobCard key={job.id} job={job} density="compact" onPressJob={noop} />
        ))}
      </View>
    </Page>
  ),
};

/** The whole board: the filters, the order and the refresh, all live. */
export const Board: Story = {
  render: function BoardStory() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <Page>
        <JobBoard
          jobs={JOBS}
          payBands={PAY_BANDS}
          selectedId={chosen}
          onTake={setChosen}
          onPass={noop}
          onPressJob={noop}
          onRefresh={noop}
          testID="board"
        />
      </Page>
    );
  },
};

/** The four dimensions, unfolded. */
export const Filters: Story = {
  render: function FiltersStory() {
    const [filter, setFilter] = useState({});
    return (
      <Page>
        <JobBoard
          jobs={JOBS}
          payBands={PAY_BANDS}
          defaultFiltersOpen
          filter={filter}
          onFilterChange={setFilter}
          onTake={noop}
          onRefresh={noop}
          testID="board"
        />
      </Page>
    );
  },
};

/** Nothing matches: the board offers the undo it caused. */
export const FilteredEmpty: Story = {
  render: () => (
    <Page>
      <JobBoard
        jobs={JOBS}
        payBands={PAY_BANDS}
        defaultFilter={{ maxDistanceKm: 3, vehicles: ['boxTruck'] }}
        defaultFiltersOpen
        onTake={noop}
        onRefresh={noop}
        testID="board"
      />
    </Page>
  ),
};

/** No work at all, with the app's own way out. */
export const Empty: Story = {
  render: () => (
    <Page>
      <JobBoard
        jobs={[]}
        emptyTitle="No jobs on this board"
        emptyDescription="You are outside the area this board covers. Move the pin, or turn on alerts for when something lands."
        emptyAction={
          <Button variant="secondary" size="medium" onPress={noop}>
            Change my area
          </Button>
        }
        testID="board"
      />
    </Page>
  ),
};

/** The answer arriving is a list, so a list is what is reserved for it. */
export const Loading: Story = {
  render: () => (
    <Page>
      <JobBoard jobs={JOBS} loading onRefresh={noop} testID="board" />
    </Page>
  ),
};

/** A pull in flight: the control is inert rather than spinning. */
export const Refreshing: Story = {
  render: () => (
    <Page>
      <JobBoard jobs={JOBS} payBands={PAY_BANDS} onRefresh={noop} refreshing testID="board" />
    </Page>
  ),
};

/** Long everything, at the width where the actions drop their labels. */
export const LongText: Story = {
  render: () => (
    <Page maxWidth={380}>
      <JobCard
        job={{
          ...SOFA,
          load: 'A two-seater sofa, a footstool, four dining chairs and a rolled rug',
          loadNote: 'Third floor with a turn in the stairs; the rug will not go in the lift',
          window: 'Today between 14:00 and 16:00, or tomorrow morning',
          tags: ['Two people', 'Stairs', 'Bulky'],
        }}
        onTake={noop}
        onPass={noop}
        onPressJob={noop}
        testID="job"
      />
    </Page>
  ),
};

/** Both modes side by side. */
export const Modes: Story = {
  render: () => (
    <BothModes>
      <JobCard job={TRAYS} onTake={noop} onPass={noop} onPressJob={noop} />
    </BothModes>
  ),
};
