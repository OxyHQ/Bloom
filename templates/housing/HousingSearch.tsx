import React, { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { Button } from '../../src/button';
import { RangeCalendar, type DateRange } from '../../src/date-picker';
import { Dialog, useDialogControl } from '../../src/dialog';
import { Divider } from '../../src/divider';
import {
  BudgetPicker,
  HomeSearchBar,
  homeSearchSegments,
  MoveInPicker,
  PropertyTypePicker,
  SearchModeTabs,
  type HomeSearchMode,
  type MoveInValue,
} from '../../src/home-search';
import { RiSearchLine } from '../../src/icons/remix';
import { Search } from '../../src/search';
import type { PropertyType } from '../../src/stay-filters';
import {
  DateFlexibilityChips,
  DestinationSuggestions,
  GuestPicker,
  StaySearchBar,
  StaySearchCompact,
  StaySearchPanel,
  StaySearchStep,
  type DestinationSuggestion,
  type GuestCounts,
  type StaySearchSegment,
} from '../../src/stay-search';
import { StepperRow } from '../../src/stepper';
import { useTheme } from '../../src/theme/use-theme';
import {
  AREAS,
  DESTINATIONS,
  MODE_TITLES,
  NO_GUESTS,
  NO_MOVE_IN,
  START_MONTH,
  euro,
  euroShort,
  formatDay,
  formatRange,
  guestSummary,
  moveInSummary,
  rangeSummary,
  typesSummary,
} from './data';

// ---------------------------------------------------------------------------
//  Search state, shared by the desktop bar and the mobile flow
// ---------------------------------------------------------------------------

interface SearchValues {
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

const INITIAL: SearchValues = {
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

/** The mode and every value the four search modes collect. Lifted to the page so a resize keeps them. */
export function useHomeSearch(initialMode: HomeSearchMode = 'rent') {
  const [mode, setMode] = useState<HomeSearchMode>(initialMode);
  const [values, setValues] = useState<SearchValues>({ ...INITIAL, location: 'Old Halden' });
  const set = (patch: Partial<SearchValues>) => setValues((v) => ({ ...v, ...patch }));
  const clear = () => setValues(INITIAL);
  return { mode, setMode, values, set, clear };
}

export type HomeSearchState = ReturnType<typeof useHomeSearch>;

const suggestionsFor = (mode: HomeSearchMode) => (mode === 'rent' || mode === 'buy' ? AREAS : DESTINATIONS);

function matching(items: DestinationSuggestion[], query: string) {
  return items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
}

function sizeSummary(v: SearchValues): string | undefined {
  const parts: string[] = [];
  if (v.bedrooms) parts.push(`${v.bedrooms}+ bd`);
  if (v.sleeps) parts.push(`sleeps ${v.sleeps}`);
  return parts.length ? parts.join(', ') : undefined;
}

function datesSummary(v: SearchValues): string | undefined {
  const range = formatRange(v.range);
  if (!range) return undefined;
  return v.flex === 'exact' ? range : `${range} ± ${v.flex}`;
}

/** The one-line summary the compact trigger shows per mode. */
export function searchSummary(search: HomeSearchState): string {
  const { mode, values: v } = search;
  const where = v.location ?? 'Anywhere';
  switch (mode) {
    case 'rent':
      return [where, moveInSummary(v.moveIn) ?? 'Any time', rangeSummary(v.budget, euro) ?? 'Any budget'].join(' · ');
    case 'buy':
      return [where, rangeSummary(v.price, euroShort) ?? 'Any price', typesSummary(v.types) ?? 'Any type'].join(' · ');
    case 'stays':
      return [where, datesSummary(v) ?? 'Any week', guestSummary(v.guests) ?? 'Add guests'].join(' · ');
    case 'swap':
      return [where, formatRange(v.range) ?? 'Any dates', sizeSummary(v) ?? 'Any size'].join(' · ');
  }
}

// ---------------------------------------------------------------------------
//  Desktop: the tabs and the bar with its panels
// ---------------------------------------------------------------------------

export function DesktopModeTabs({ search }: { search: HomeSearchState }) {
  return <SearchModeTabs value={search.mode} onValueChange={search.setMode} testID="housing-modes" />;
}

function DatesPanel({ search, onDone }: { search: HomeSearchState; onDone?: () => void }) {
  return (
    <StaySearchPanel padding={24} accessibilityLabel="Dates" testID="housing-panel-dates">
      <View style={{ gap: 20 }}>
        <RangeCalendar
          value={search.values.range}
          onChange={(range) => {
            search.set({ range });
            onDone?.();
          }}
          visibleMonths={2}
          defaultMonth={START_MONTH}
        />
        <DateFlexibilityChips value={search.values.flex} onChange={(flex) => search.set({ flex })} />
      </View>
    </StaySearchPanel>
  );
}

function LocationPanel({ search, onDone }: { search: HomeSearchState; onDone: () => void }) {
  const areas = search.mode === 'rent' || search.mode === 'buy';
  const heading = areas ? 'Suggested areas' : 'Suggested destinations';
  return (
    <StaySearchPanel width={420} accessibilityLabel={heading} testID="housing-panel-location">
      <DestinationSuggestions
        heading={heading}
        items={matching(suggestionsFor(search.mode), search.values.query)}
        onSelect={(item) => {
          search.set({ location: item.title, query: '' });
          onDone();
        }}
      />
    </StaySearchPanel>
  );
}

function HomeSizeRows({ search }: { search: HomeSearchState }) {
  const { values, set } = search;
  return (
    <>
      <StepperRow title="Bedrooms" description="At least" value={values.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} max={8} divider />
      <StepperRow title="Sleeps" description="People the home fits" value={values.sleeps} onValueChange={(sleeps) => set({ sleeps })} max={16} />
    </>
  );
}

function panelFor(search: HomeSearchState, segment: string | null, go: (segment: string | null) => void): React.ReactNode {
  const { mode, values, set } = search;
  if (segment === null) return null;
  switch (segment) {
    case 'location':
    case 'destination':
      return <LocationPanel search={search} onDone={() => go({ rent: 'moveIn', buy: 'price', stays: 'checkIn', swap: 'dates' }[mode])} />;
    case 'moveIn':
      return (
        <StaySearchPanel width={380} padding={24} accessibilityLabel="Move-in" testID="housing-panel-move-in">
          <MoveInPicker value={values.moveIn} onValueChange={(moveIn) => set({ moveIn })} defaultMonth={START_MONTH} />
        </StaySearchPanel>
      );
    case 'budget':
      return (
        <StaySearchPanel width={420} padding={24} accessibilityLabel="Budget" testID="housing-panel-budget">
          <BudgetPicker value={values.budget} onValueChange={(budget) => set({ budget })} formatAmount={euro} />
        </StaySearchPanel>
      );
    case 'price':
      return (
        <StaySearchPanel width={440} padding={24} accessibilityLabel="Price" testID="housing-panel-price">
          <BudgetPicker period="total" value={values.price} onValueChange={(price) => set({ price })} formatAmount={euroShort} />
        </StaySearchPanel>
      );
    case 'propertyType':
      return (
        <StaySearchPanel width={460} padding={20} accessibilityLabel="Property type" testID="housing-panel-type">
          <PropertyTypePicker value={values.types} onValueChange={(types) => set({ types })} />
        </StaySearchPanel>
      );
    case 'checkIn':
    case 'checkOut':
      return <DatesPanel search={search} onDone={() => go('guests')} />;
    case 'dates':
      return <DatesPanel search={search} />;
    case 'guests':
      return (
        <StaySearchPanel width={400} padding={8} accessibilityLabel="Guests" testID="housing-panel-guests">
          <View style={{ paddingLeft: 24, paddingRight: 24 }}>
            <GuestPicker value={values.guests} onChange={(guests) => set({ guests })} max={{ adults: 16, children: 15, infants: 5, pets: 5 }} />
          </View>
        </StaySearchPanel>
      );
    case 'homeSize':
      return (
        <StaySearchPanel width={380} padding={8} accessibilityLabel="Home size" testID="housing-panel-size">
          <View style={{ paddingLeft: 24, paddingRight: 24 }}>
            <HomeSizeRows search={search} />
          </View>
        </StaySearchPanel>
      );
    default:
      return null;
  }
}

/** The bar for the selected mode; vacation rentals draw `StaySearchBar` itself. */
export function DesktopSearchBar({ search }: { search: HomeSearchState }) {
  const [segment, setSegment] = useState<string | null>(null);
  const { mode, values, set } = search;
  const panel = panelFor(search, segment, setSegment);
  const style = { width: '100%' as const, maxWidth: 880 };
  const onSearch = () => setSegment(null);

  // A new mode starts at rest.
  const [lastMode, setLastMode] = useState(mode);
  if (lastMode !== mode) {
    setLastMode(mode);
    setSegment(null);
  }

  if (mode === 'stays') {
    const flex = values.flex === 'exact' ? '' : ` ± ${values.flex}`;
    return (
      <StaySearchBar
        activeSegment={segment as StaySearchSegment | null}
        onActiveSegmentChange={setSegment}
        destination={values.location}
        destinationQuery={values.query}
        onDestinationQueryChange={(query) => set({ query })}
        dates={
          values.range
            ? { checkIn: `${formatDay(values.range.start)}${flex}`, checkOut: `${formatDay(values.range.end)}${flex}` }
            : undefined
        }
        guests={guestSummary(values.guests)}
        onSearch={onSearch}
        panel={panel}
        style={style}
        testID="housing-search"
      />
    );
  }

  const segments =
    mode === 'rent'
      ? homeSearchSegments('rent', {
          location: values.location,
          moveIn: moveInSummary(values.moveIn),
          budget: rangeSummary(values.budget, euro),
        })
      : mode === 'buy'
        ? homeSearchSegments('buy', {
            location: values.location,
            price: rangeSummary(values.price, euroShort),
            propertyType: typesSummary(values.types),
          })
        : homeSearchSegments('swap', {
            destination: values.location,
            dates: formatRange(values.range),
            homeSize: sizeSummary(values),
          });

  return (
    <HomeSearchBar<string>
      segments={segments}
      activeSegment={segment}
      onActiveSegmentChange={setSegment}
      onSearch={onSearch}
      query={values.query}
      onQueryChange={(query) => set({ query })}
      panel={panel}
      style={style}
      testID="housing-search"
    />
  );
}

// ---------------------------------------------------------------------------
//  Below lg: the segmented tabs, the compact trigger and the step flow
// ---------------------------------------------------------------------------

export function MobileModeTabs({ search }: { search: HomeSearchState }) {
  return (
    <SearchModeTabs
      variant="segmented"
      value={search.mode}
      onValueChange={search.setMode}
      labels={{ stays: 'Holidays' }}
      testID="housing-modes-segmented"
    />
  );
}

interface MobileStep {
  key: string;
  label: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

export function MobileSearch({ search, onFilterPress }: { search: HomeSearchState; onFilterPress?: () => void }) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const control = useDialogControl();
  const [open, setOpen] = useState('location');
  const { mode, values, set } = search;

  const areas = mode === 'rent' || mode === 'buy';
  const where: MobileStep = {
    key: 'location',
    label: areas ? 'Location' : 'Where',
    title: areas ? 'Where do you want to live?' : 'Where to?',
    summary: values.location ?? 'Anywhere',
    content: (
      <>
        <Search
          value={values.query}
          onChangeText={(query) => set({ query })}
          onClearText={() => set({ query: '' })}
          label={areas ? 'Search city or area' : 'Search destinations'}
        />
        <DestinationSuggestions
          items={matching(suggestionsFor(mode), values.query)}
          onSelect={(item) => {
            set({ location: item.title, query: '' });
            setOpen(mode === 'rent' ? 'moveIn' : mode === 'buy' ? 'price' : 'dates');
          }}
          style={{ marginLeft: -12, marginRight: -12 }}
        />
      </>
    ),
  };

  const calendar = (
    <View style={{ marginLeft: -16, marginRight: -16, alignItems: 'center' }}>
      <RangeCalendar value={values.range} onChange={(range) => set({ range })} defaultMonth={START_MONTH} />
    </View>
  );

  const steps: Record<HomeSearchMode, MobileStep[]> = {
    rent: [
      where,
      {
        key: 'moveIn',
        label: 'Move-in',
        title: 'When do you move in?',
        summary: moveInSummary(values.moveIn) ?? 'Any time',
        content: <MoveInPicker value={values.moveIn} onValueChange={(moveIn) => set({ moveIn })} defaultMonth={START_MONTH} />,
      },
      {
        key: 'budget',
        label: 'Budget',
        title: 'What’s your budget?',
        summary: rangeSummary(values.budget, euro) ?? 'Any',
        content: <BudgetPicker value={values.budget} onValueChange={(budget) => set({ budget })} formatAmount={euro} />,
      },
    ],
    buy: [
      where,
      {
        key: 'price',
        label: 'Price',
        title: 'Your price range',
        summary: rangeSummary(values.price, euroShort) ?? 'Any',
        content: <BudgetPicker period="total" value={values.price} onValueChange={(price) => set({ price })} formatAmount={euroShort} />,
      },
      {
        key: 'propertyType',
        label: 'Type',
        title: 'What kind of home?',
        summary: typesSummary(values.types) ?? 'Any type',
        content: <PropertyTypePicker value={values.types} onValueChange={(types) => set({ types })} />,
      },
    ],
    stays: [
      where,
      {
        key: 'dates',
        label: 'When',
        title: 'When’s your trip?',
        summary: datesSummary(values) ?? 'Any week',
        content: (
          <>
            {calendar}
            <DateFlexibilityChips value={values.flex} onChange={(flex) => set({ flex })} />
          </>
        ),
      },
      {
        key: 'guests',
        label: 'Who',
        title: 'Who’s coming?',
        summary: guestSummary(values.guests) ?? 'Add guests',
        content: <GuestPicker value={values.guests} onChange={(guests) => set({ guests })} max={16} />,
      },
    ],
    swap: [
      where,
      { key: 'dates', label: 'Dates', title: 'When do you swap?', summary: formatRange(values.range) ?? 'Any dates', content: calendar },
      {
        key: 'homeSize',
        label: 'Home size',
        title: 'How big a home?',
        summary: sizeSummary(values) ?? 'Any size',
        content: (
          <View>
            <HomeSizeRows search={search} />
          </View>
        ),
      },
    ],
  };

  return (
    <>
      <StaySearchCompact
        onPress={() => {
          setOpen('location');
          control.open();
        }}
        title={MODE_TITLES[mode]}
        summary={searchSummary(search)}
        onFilterPress={onFilterPress}
        testID="housing-compact"
      />
      <Dialog
        control={control}
        placement="bottom"
        label={MODE_TITLES[mode]}
        contentPadding={0}
        scrollable={false}
        testID="housing-mobile-search"
      >
        <View style={{ height: Math.min(760, height * 0.88), backgroundColor: theme.colors.backgroundSecondary }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16, paddingLeft: 12, paddingRight: 12, gap: 12 }}
          >
            <MobileModeTabs search={search} />
            {steps[mode].map((step) => (
              <StaySearchStep
                key={step.key}
                label={step.label}
                title={step.title}
                summary={step.summary}
                expanded={open === step.key}
                onPress={() => setOpen(step.key)}
                testID={`housing-step-${step.key}`}
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
            <Button
              variant="link"
              onPress={() => {
                search.clear();
                setOpen('location');
              }}
            >
              Clear all
            </Button>
            <Button variant="primary" size="large" leadingIcon={RiSearchLine} onPress={() => control.close()} testID="housing-mobile-search-submit">
              Search
            </Button>
          </View>
        </View>
      </Dialog>
    </>
  );
}
