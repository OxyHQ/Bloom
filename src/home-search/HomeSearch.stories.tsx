import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RangeCalendar, type DateRange } from '../date-picker';
import { Divider } from '../divider';
import { RiBuilding2Line } from '../icons/remix/RiBuilding2Line';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import type { PropertyType } from '../stay-filters';
import {
  DateFlexibilityChips,
  DestinationSuggestions,
  GuestPicker,
  StaySearchCompact,
  StaySearchPanel,
  StaySearchStep,
  type DestinationSuggestion,
  type GuestCounts,
} from '../stay-search';
import { StepperRow } from '../stepper';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  BudgetPicker,
  DEFAULT_HOME_SEARCH_MODE_LABELS,
  HomeSearchBar,
  homeSearchSegments,
  MoveInPicker,
  PropertyTypePicker,
  SavedSearchCard,
  SaveSearchButton,
  SearchModeTabs,
} from './index';
import type { HomeSearchMode, MoveInValue } from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Home Search',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented places and prices.
// ---------------------------------------------------------------------------

const AREAS: DestinationSuggestion[] = [
  { id: 'nearby', title: 'Nearby', description: 'Search around your location', icon: RiMapPinLine },
  { id: 'recent', title: 'Old Halden · 2+ bedrooms', description: 'Recent search', icon: RiTimeLine },
  { id: 'halden', title: 'Old Halden', description: 'City centre, 1,240 homes', icon: RiBuilding2Line },
  { id: 'marrow', title: 'Marrowfield', description: 'Lakeside town, 312 homes', icon: RiHome4Line },
  { id: 'solvia', title: 'Solvia Bay', description: 'Coast, 586 homes', icon: RiMapPinLine },
];

const MONTH = new Date(2026, 9, 1);

const euro = (n: number) => `€${n.toLocaleString('en-US')}`;
const euroShort = (n: number) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : n >= 1000 ? `€${Math.round(n / 1000)}K` : `€${n}`;

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function rangeSummary([min, max]: [number | null, number | null], format: (n: number) => string): string | undefined {
  if (min == null && max == null) return undefined;
  if (min == null) return `Up to ${format(max as number)}`;
  if (max == null) return `${format(min)}+`;
  return `${format(min)} – ${format(max)}`;
}

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  room: 'Room',
  studio: 'Studio',
  duplex: 'Duplex',
  penthouse: 'Penthouse',
  coliving: 'Coliving',
  hostel: 'Hostel',
  other: 'Land / Other',
};

function typesSummary(types: PropertyType[]): string | undefined {
  if (types.length === 0) return undefined;
  if (types.length === 1) return TYPE_LABELS[types[0]!];
  return `${TYPE_LABELS[types[0]!]} +${types.length - 1}`;
}

function moveInSummary(v: MoveInValue): string | undefined {
  if (v.timing === 'asap') return 'As soon as possible';
  if (v.timing === 'flexible') return 'Flexible';
  return v.date ? formatDay(v.date) : undefined;
}

function guestSummary(g: GuestCounts): string | undefined {
  const guests = g.adults + g.children;
  if (guests === 0) return undefined;
  return `${guests} ${guests === 1 ? 'guest' : 'guests'}`;
}

const NO_GUESTS: GuestCounts = { adults: 0, children: 0, infants: 0, pets: 0 };
const NO_MOVE_IN: MoveInValue = { timing: 'date', date: null, contractLength: 'any' };

interface SearchState {
  location?: string;
  query: string;
  budget: [number | null, number | null];
  price: [number | null, number | null];
  moveIn: MoveInValue;
  types: PropertyType[];
  range: DateRange | null;
  flex: string;
  guests: GuestCounts;
  bedrooms: number;
  sleeps: number;
}

const INITIAL: SearchState = {
  query: '',
  budget: [null, null],
  price: [null, null],
  moveIn: NO_MOVE_IN,
  types: [],
  range: null,
  flex: 'exact',
  guests: NO_GUESTS,
  bedrooms: 0,
  sleeps: 0,
};

function useSearchState(initial: Partial<SearchState> = {}) {
  const [state, setState] = useState<SearchState>({ ...INITIAL, ...initial });
  const set = (patch: Partial<SearchState>) => setState((s) => ({ ...s, ...patch }));
  return { state, set };
}

type SearchApi = ReturnType<typeof useSearchState>;

// ---------------------------------------------------------------------------
//  Panels per mode
// ---------------------------------------------------------------------------

function LocationPanel({ api, next, heading }: { api: SearchApi; next: () => void; heading: string }) {
  const { state, set } = api;
  return (
    <StaySearchPanel width={420} accessibilityLabel={heading} testID="panel-location">
      <DestinationSuggestions
        heading={heading}
        items={AREAS.filter((a) => a.title.toLowerCase().includes(state.query.toLowerCase()))}
        onSelect={(item) => {
          set({ location: item.title, query: '' });
          next();
        }}
      />
    </StaySearchPanel>
  );
}

function DatesPanel({ api }: { api: SearchApi }) {
  const { state, set } = api;
  return (
    <StaySearchPanel padding={24} accessibilityLabel="Dates" testID="panel-dates">
      <View style={{ gap: 20 }}>
        <RangeCalendar value={state.range} onChange={(range) => set({ range })} visibleMonths={2} defaultMonth={MONTH} />
        <DateFlexibilityChips value={state.flex} onChange={(flex) => set({ flex })} />
      </View>
    </StaySearchPanel>
  );
}

function panelFor(mode: HomeSearchMode, segment: string | null, api: SearchApi, go: (s: string | null) => void): React.ReactNode {
  const { state, set } = api;
  if (segment === null) return null;
  if (segment === 'location' || segment === 'destination') {
    const next = { rent: 'moveIn', buy: 'price', stays: 'checkIn', swap: 'dates' }[mode];
    return <LocationPanel api={api} next={() => go(next)} heading={mode === 'rent' || mode === 'buy' ? 'Suggested areas' : 'Suggested destinations'} />;
  }
  switch (segment) {
    case 'moveIn':
      return (
        <StaySearchPanel width={380} padding={24} accessibilityLabel="Move-in" testID="panel-move-in">
          <MoveInPicker value={state.moveIn} onValueChange={(moveIn) => set({ moveIn })} defaultMonth={MONTH} testID="move-in" />
        </StaySearchPanel>
      );
    case 'budget':
      return (
        <StaySearchPanel width={420} padding={24} accessibilityLabel="Budget" testID="panel-budget">
          <BudgetPicker value={state.budget} onValueChange={(budget) => set({ budget })} formatAmount={euro} testID="budget" />
        </StaySearchPanel>
      );
    case 'price':
      return (
        <StaySearchPanel width={440} padding={24} accessibilityLabel="Price" testID="panel-price">
          <BudgetPicker
            period="total"
            value={state.price}
            onValueChange={(price) => set({ price })}
            formatAmount={euroShort}
            testID="price"
          />
        </StaySearchPanel>
      );
    case 'propertyType':
      return (
        <StaySearchPanel width={460} padding={20} accessibilityLabel="Property type" testID="panel-type">
          <PropertyTypePicker value={state.types} onValueChange={(types) => set({ types })} testID="types" />
        </StaySearchPanel>
      );
    case 'checkIn':
    case 'checkOut':
    case 'dates':
      return <DatesPanel api={api} />;
    case 'guests':
      return (
        <StaySearchPanel width={400} padding={8} accessibilityLabel="Guests">
          <View style={{ paddingLeft: 24, paddingRight: 24 }}>
            <GuestPicker value={state.guests} onChange={(guests) => set({ guests })} max={16} />
          </View>
        </StaySearchPanel>
      );
    case 'homeSize':
      return (
        <StaySearchPanel width={380} padding={8} accessibilityLabel="Home size" testID="panel-size">
          <View style={{ paddingLeft: 24, paddingRight: 24 }}>
            <StepperRow title="Bedrooms" description="At least" value={state.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} max={8} divider />
            <StepperRow title="Sleeps" description="People the home fits" value={state.sleeps} onValueChange={(sleeps) => set({ sleeps })} max={16} />
          </View>
        </StaySearchPanel>
      );
    default:
      return null;
  }
}

function sizeSummary(s: SearchState): string | undefined {
  const parts: string[] = [];
  if (s.bedrooms) parts.push(`${s.bedrooms}+ bd`);
  if (s.sleeps) parts.push(`sleeps ${s.sleeps}`);
  return parts.length ? parts.join(', ') : undefined;
}

function segmentsFor(mode: HomeSearchMode, s: SearchState) {
  const datesText = s.range ? `${formatDay(s.range.start)} – ${formatDay(s.range.end)}` : undefined;
  switch (mode) {
    case 'rent':
      return homeSearchSegments('rent', {
        location: s.location,
        moveIn: moveInSummary(s.moveIn),
        budget: rangeSummary(s.budget, euro),
      });
    case 'buy':
      return homeSearchSegments('buy', {
        location: s.location,
        price: rangeSummary(s.price, euroShort),
        propertyType: typesSummary(s.types),
      });
    case 'stays':
      return homeSearchSegments('stays', {
        destination: s.location,
        checkIn: s.range ? formatDay(s.range.start) : undefined,
        checkOut: s.range ? formatDay(s.range.end) : undefined,
        guests: guestSummary(s.guests),
      });
    case 'swap':
      return homeSearchSegments('swap', { destination: s.location, dates: datesText, homeSize: sizeSummary(s) });
  }
}

// ---------------------------------------------------------------------------
//  Desktop
// ---------------------------------------------------------------------------

function DesktopDemo({
  initialMode = 'rent',
  initialSegment = null,
  initial,
  width = 860,
  lockMode = false,
}: {
  initialMode?: HomeSearchMode;
  initialSegment?: string | null;
  initial?: Partial<SearchState>;
  width?: number;
  lockMode?: boolean;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<HomeSearchMode>(initialMode);
  const [segment, setSegment] = useState<string | null>(initialSegment);
  const api = useSearchState(initial);

  return (
    <View style={{ width, maxWidth: '100%', minHeight: 640, gap: 16 }}>
      {lockMode ? null : (
        <View style={{ alignItems: 'center' }}>
          <SearchModeTabs
            value={mode}
            onValueChange={(next) => {
              setMode(next);
              setSegment(null);
            }}
            testID="modes"
          />
        </View>
      )}
      <HomeSearchBar
        segments={segmentsFor(mode, api.state)}
        activeSegment={segment}
        onActiveSegmentChange={setSegment}
        onSearch={() => setSegment(null)}
        query={api.state.query}
        onQueryChange={(query) => api.set({ query })}
        panel={panelFor(mode, segment, api, setSegment)}
        testID="bar"
      />
      <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary, marginLeft: 16 }}>
        {DEFAULT_HOME_SEARCH_MODE_LABELS[mode]} · {segment ? `open: ${segment}` : 'at rest'}
      </Text>
    </View>
  );
}

/**
 * The mode tabs over the bar, fully interactive: switch mode and the segments
 * change (rent: Location · Move-in · Budget; buy: Location · Price · Property
 * type; vacation rentals: Where · Check in · Check out · Who; swap: Where ·
 * Dates · Home size). Press a segment to open its panel.
 */
export const Modes: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo />
    </View>
  ),
};

/** Rent, the budget open: min/max fields and monthly presets. */
export const RentBudget: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialSegment="budget" initial={{ location: 'Old Halden', budget: [800, 1200] }} />
    </View>
  ),
};

/** Rent, move-in open: a single-day calendar, Flexible / As soon as possible, contract length. */
export const RentMoveIn: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo
        initialSegment="moveIn"
        initial={{ location: 'Old Halden', moveIn: { timing: 'date', date: new Date(2026, 9, 15), contractLength: 'long' } }}
      />
    </View>
  ),
};

/** Buy, the price open: sale presets in thousands. */
export const BuyPrice: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialMode="buy" initialSegment="price" initial={{ location: 'Marrowfield', price: [150000, 300000] }} />
    </View>
  ),
};

/** Buy, the property type open: the tile grid, two selected. */
export const BuyPropertyType: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialMode="buy" initialSegment="propertyType" initial={{ location: 'Marrowfield', types: ['apartment', 'duplex'] }} />
    </View>
  ),
};

/** Swap, the home size open. */
export const SwapHomeSize: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialMode="swap" initialSegment="homeSize" initial={{ location: 'Solvia Bay', bedrooms: 2, sleeps: 4 }} />
    </View>
  ),
};

/** Swap, the dates open. */
export const SwapDates: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo
        initialMode="swap"
        initialSegment="dates"
        initial={{ location: 'Solvia Bay', range: { start: new Date(2026, 9, 12), end: new Date(2026, 9, 26) } }}
      />
    </View>
  ),
};

/** Every mode's bar at rest, filled, stacked. */
export const BarsPerMode: Story = {
  render: function BarsStory() {
    const theme = useTheme();
    const filled: SearchState = {
      ...INITIAL,
      location: 'Old Halden',
      budget: [800, 1200],
      price: [300000, 600000],
      moveIn: { timing: 'asap', date: null, contractLength: 'any' },
      types: ['apartment', 'house'],
      range: { start: new Date(2026, 9, 12), end: new Date(2026, 9, 16) },
      guests: { adults: 2, children: 1, infants: 0, pets: 0 },
      bedrooms: 2,
    };
    return (
      <View style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background }}>
        {(['rent', 'buy', 'stays', 'swap'] as const).map((mode) => (
          <View key={mode} style={{ gap: 8, width: 860, maxWidth: '100%' }}>
            <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
              {DEFAULT_HOME_SEARCH_MODE_LABELS[mode]}
            </Text>
            <HomeSearchBar segments={segmentsFor(mode, filled)} activeSegment={null} onActiveSegmentChange={() => {}} />
          </View>
        ))}
      </View>
    );
  },
};

// ---------------------------------------------------------------------------
//  Mode tabs
// ---------------------------------------------------------------------------

/** `tabs` (underline) and `segmented` (pill), the full set and a relabelled subset. */
export const ModeTabs: Story = {
  render: function ModeTabsStory() {
    const theme = useTheme();
    const [a, setA] = useState<HomeSearchMode>('buy');
    const [b, setB] = useState<HomeSearchMode>('rent');
    const [c, setC] = useState<HomeSearchMode>('stays');
    const [d, setD] = useState<'rent' | 'buy'>('rent');
    const caption = (text: string) => (
      <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
        {text}
      </Text>
    );
    return (
      <View style={{ padding: 24, gap: 24, width: 560, maxWidth: '100%' }}>
        {caption('tabs')}
        <SearchModeTabs value={a} onValueChange={setA} testID="tabs" />
        {caption('tabs · subset, relabelled')}
        <SearchModeTabs modes={['rent', 'buy']} labels={{ rent: 'To rent', buy: 'For sale' }} value={d} onValueChange={setD} />
        {caption('segmented · 343 wide')}
        <View style={{ width: 343, maxWidth: '100%' }}>
          <SearchModeTabs variant="segmented" value={b} onValueChange={setB} labels={{ stays: 'Holidays' }} testID="segmented" />
        </View>
        {caption('segmented · three modes')}
        <View style={{ width: 343 }}>
          <SearchModeTabs variant="segmented" modes={['rent', 'buy', 'stays']} value={c} onValueChange={setC} />
        </View>
      </View>
    );
  },
};

// ---------------------------------------------------------------------------
//  Panel parts
// ---------------------------------------------------------------------------

/** The new panel parts inside `StaySearchPanel`s: rent budget, sale price, move-in, property type. */
export const PanelParts: Story = {
  render: function PanelPartsStory() {
    const [budget, setBudget] = useState<[number | null, number | null]>([null, 1200]);
    const [price, setPrice] = useState<[number | null, number | null]>([300000, 600000]);
    const [moveIn, setMoveIn] = useState<MoveInValue>({ timing: 'flexible', date: null, contractLength: 'medium' });
    const [types, setTypes] = useState<PropertyType[]>(['house']);
    return (
      <View style={{ padding: 24, gap: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <StaySearchPanel width={420} padding={24}>
          <BudgetPicker value={budget} onValueChange={setBudget} formatAmount={euro} testID="budget" />
        </StaySearchPanel>
        <StaySearchPanel width={440} padding={24}>
          <BudgetPicker period="total" value={price} onValueChange={setPrice} formatAmount={euroShort} testID="price" />
        </StaySearchPanel>
        <StaySearchPanel width={380} padding={24}>
          <MoveInPicker value={moveIn} onValueChange={setMoveIn} defaultMonth={MONTH} testID="move-in" />
        </StaySearchPanel>
        <StaySearchPanel width={460} padding={20}>
          <PropertyTypePicker value={types} onValueChange={setTypes} testID="types" />
        </StaySearchPanel>
      </View>
    );
  },
};

// ---------------------------------------------------------------------------
//  Mobile
// ---------------------------------------------------------------------------

interface MobileStep {
  key: string;
  label: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

function MobileFlow({ initialMode = 'rent', lockMode = false }: { initialMode?: HomeSearchMode; lockMode?: boolean }) {
  const theme = useTheme();
  const [mode, setMode] = useState<HomeSearchMode>(initialMode);
  const [open, setOpen] = useState<string>('location');
  const api = useSearchState();
  const { state, set } = api;

  const where: MobileStep = {
    key: 'location',
    label: mode === 'rent' || mode === 'buy' ? 'Location' : 'Where',
    title: mode === 'rent' || mode === 'buy' ? 'Where do you want to live?' : 'Where to?',
    summary: state.location ?? 'Anywhere',
    content: (
      <DestinationSuggestions
        items={AREAS}
        onSelect={(item) => set({ location: item.title })}
        style={{ marginLeft: -12, marginRight: -12 }}
      />
    ),
  };

  const calendar = (
    <View style={{ marginLeft: -16, marginRight: -16, alignItems: 'center' }}>
      <RangeCalendar value={state.range} onChange={(range) => set({ range })} defaultMonth={MONTH} />
    </View>
  );
  const datesSummary = state.range ? `${formatDay(state.range.start)} – ${formatDay(state.range.end)}` : 'Any week';

  const stepsByMode: Record<HomeSearchMode, MobileStep[]> = {
    rent: [
      where,
      {
        key: 'moveIn',
        label: 'Move-in',
        title: 'When do you move in?',
        summary: moveInSummary(state.moveIn) ?? 'Any time',
        content: (
          <View style={{ marginLeft: -16, marginRight: -16, paddingLeft: 8, paddingRight: 8 }}>
            <MoveInPicker value={state.moveIn} onValueChange={(moveIn) => set({ moveIn })} defaultMonth={MONTH} />
          </View>
        ),
      },
      {
        key: 'budget',
        label: 'Budget',
        title: 'What’s your budget?',
        summary: rangeSummary(state.budget, euro) ?? 'Any',
        content: <BudgetPicker value={state.budget} onValueChange={(budget) => set({ budget })} formatAmount={euro} />,
      },
    ],
    buy: [
      where,
      {
        key: 'price',
        label: 'Price',
        title: 'Your price range',
        summary: rangeSummary(state.price, euroShort) ?? 'Any',
        content: (
          <BudgetPicker period="total" value={state.price} onValueChange={(price) => set({ price })} formatAmount={euroShort} />
        ),
      },
      {
        key: 'propertyType',
        label: 'Type',
        title: 'What kind of home?',
        summary: typesSummary(state.types) ?? 'Any type',
        content: <PropertyTypePicker value={state.types} onValueChange={(types) => set({ types })} />,
      },
    ],
    stays: [
      where,
      {
        key: 'dates',
        label: 'When',
        title: 'When’s your trip?',
        summary: datesSummary,
        content: (
          <>
            {calendar}
            <DateFlexibilityChips value={state.flex} onChange={(flex) => set({ flex })} />
          </>
        ),
      },
      {
        key: 'guests',
        label: 'Who',
        title: 'Who’s coming?',
        summary: guestSummary(state.guests) ?? 'Add guests',
        content: <GuestPicker value={state.guests} onChange={(guests) => set({ guests })} max={16} />,
      },
    ],
    swap: [
      where,
      { key: 'dates', label: 'Dates', title: 'When do you swap?', summary: datesSummary, content: calendar },
      {
        key: 'homeSize',
        label: 'Home size',
        title: 'How big a home?',
        summary: sizeSummary(state) ?? 'Any size',
        content: (
          <View>
            <StepperRow title="Bedrooms" description="At least" value={state.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} max={8} divider />
            <StepperRow title="Sleeps" description="People the home fits" value={state.sleeps} onValueChange={(sleeps) => set({ sleeps })} max={16} />
          </View>
        ),
      },
    ],
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }}>
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 16, paddingLeft: 12, paddingRight: 12, gap: 12 }}>
        {lockMode ? null : (
          <SearchModeTabs
            variant="segmented"
            value={mode}
            onValueChange={(next) => {
              setMode(next);
              setOpen('location');
            }}
            labels={{ stays: 'Holidays' }}
            testID="mobile-modes"
          />
        )}
        {stepsByMode[mode].map((step) => (
          <StaySearchStep
            key={step.key}
            label={step.label}
            title={step.title}
            summary={step.summary}
            expanded={open === step.key}
            onPress={() => setOpen(step.key)}
            testID={`step-${step.key}`}
          >
            {step.content}
          </StaySearchStep>
        ))}
      </ScrollView>
      <Divider />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 20,
          paddingRight: 16,
          backgroundColor: theme.colors.card,
        }}
      >
        <Button variant="link" onPress={() => set(INITIAL)}>
          Clear all
        </Button>
        <Button variant="primary" size="large" icon={RiSearchLine}>
          Search
        </Button>
      </View>
    </View>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: 375, maxWidth: '100%', height: 780, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
      {children}
    </View>
  );
}

const mobileStory = (mode: HomeSearchMode): Story => ({
  render: () => (
    <PhoneFrame>
      <MobileFlow initialMode={mode} />
    </PhoneFrame>
  ),
});

/** The compact triggers per mode at 343: the summary line says what the mode searches. */
export const MobileTriggers: Story = {
  render: () => (
    <View style={{ padding: 16, gap: 12, width: 375, maxWidth: '100%' }}>
      <SearchModeTabs<HomeSearchMode> variant="segmented" value="rent" onValueChange={() => {}} labels={{ stays: 'Holidays' }} />
      <StaySearchCompact onPress={() => {}} title="Find a home to rent" summary="Anywhere · Any time · Any budget" onFilterPress={() => {}} />
      <StaySearchCompact onPress={() => {}} title="Find a home to buy" summary="Marrowfield · €150K – €300K · House" onFilterPress={() => {}} />
      <StaySearchCompact onPress={() => {}} summary="Anywhere · Any week · Add guests" onFilterPress={() => {}} />
      <StaySearchCompact onPress={() => {}} title="Swap your home" summary="Solvia Bay · Oct 12 – 26 · 2+ bd" onFilterPress={() => {}} />
    </View>
  ),
};

/** The rent flow at 375: Location, Move-in, Budget; switch mode with the pill tabs. */
export const MobileRent: Story = mobileStory('rent');
/** The buy flow at 375: Location, Price, Type. */
export const MobileBuy: Story = mobileStory('buy');
/** The vacation-rental flow at 375: Where, When, Who. */
export const MobileStays: Story = mobileStory('stays');
/** The swap flow at 375: Where, Dates, Home size. */
export const MobileSwap: Story = mobileStory('swap');

// ---------------------------------------------------------------------------
//  Saved searches
// ---------------------------------------------------------------------------

function SavedSearchList({ width }: { width: number }) {
  const theme = useTheme();
  const [saved, setSaved] = useState(true);
  return (
    <View style={{ width, maxWidth: '100%', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text variant="title-2-semibold" style={{ color: theme.colors.text, flexShrink: 1 }}>
          Saved searches
        </Text>
        <SaveSearchButton saved={saved} onSavedChange={setSaved} testID="save" />
      </View>
      <SavedSearchCard
        title="2-bed flats in Old Halden"
        criteria={['Rent', '€800 – €1,200', '2+ bedrooms', 'Furnished']}
        newCount={12}
        alertFrequency="Instant alerts"
        onPress={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        testID="saved-0"
      />
      <SavedSearchCard
        title="Family houses by the lake in Marrowfield"
        icon={RiHome4Line}
        criteria={['Buy', '€300K – €600K', 'House', 'Garden', 'A–C energy']}
        newCount={3}
        alertFrequency="Daily alerts"
        onPress={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
      <SavedSearchCard
        title="Summer swap, Solvia Bay"
        criteria={['Swap', 'Jul 4 – 25', 'Sleeps 4']}
        onPress={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </View>
  );
}

/** A saved-searches list with the save toggle, at 560 and 343. */
export const SavedSearches: Story = {
  render: () => (
    <View style={{ padding: 16, gap: 32, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <SavedSearchList width={560} />
      <SavedSearchList width={343} />
    </View>
  ),
};

/** `SaveSearchButton` off, on and disabled. */
export const SaveButton: Story = {
  render: function SaveButtonStory() {
    const [saved, setSaved] = useState(false);
    return (
      <View style={{ padding: 24, gap: 12, flexDirection: 'row', alignItems: 'center' }}>
        <SaveSearchButton saved={saved} onSavedChange={setSaved} testID="save" />
        <SaveSearchButton saved onSavedChange={() => {}} />
        <SaveSearchButton saved={false} onSavedChange={() => {}} disabled />
      </View>
    );
  },
};

// ---------------------------------------------------------------------------
//  Dark
// ---------------------------------------------------------------------------

function DarkCanvas() {
  const theme = useTheme();
  return (
    <View style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background }}>
      <DesktopDemo initialMode="buy" initialSegment="propertyType" initial={{ location: 'Marrowfield', types: ['apartment'] }} />
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <PhoneFrame>
          <MobileFlow initialMode="rent" />
        </PhoneFrame>
        <SavedSearchList width={400} />
      </View>
    </View>
  );
}

/** Dark: the buy bar with property types open, the rent flow and saved searches. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <DarkCanvas />
    </BloomThemeProvider>
  ),
};
