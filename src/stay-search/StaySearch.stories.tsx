import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RangeCalendar, type DateRange } from '../date-picker';
import { Dialog, useDialogControl } from '../dialog';
import { Divider } from '../divider';
import { RiBuilding2Line } from '../icons/remix/RiBuilding2Line';
import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { Search } from '../search';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  DateFlexibilityChips,
  DestinationSuggestions,
  GuestPicker,
  StaySearchBar,
  StaySearchCompact,
  StaySearchPanel,
  StaySearchStep,
} from './index';
import type { DestinationSuggestion, GuestCounts, StaySearchSegment } from './types';

const meta: Meta = {
  title: 'Blocks/Stays/Stay Search',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented places.
// ---------------------------------------------------------------------------

const SUGGESTIONS: DestinationSuggestion[] = [
  { id: 'nearby', title: 'Nearby', description: 'Find what’s around you', icon: RiMapPinLine },
  { id: 'recent', title: 'Solvia Bay · 3 guests', description: 'Oct 12 – 16', icon: RiTimeLine },
  { id: 'marrow', title: 'Marrowfield', description: 'For its lakeside cabins', icon: RiMapPinLine },
  { id: 'halden', title: 'Old Halden', description: 'Great for a city weekend', icon: RiBuilding2Line },
  { id: 'terrace', title: 'Terracina Coast', description: 'Popular beach destination', icon: RiMapPinLine },
];

const MONTH = new Date(2026, 9, 1);

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function guestSummary(g: GuestCounts): string | undefined {
  const guests = g.adults + g.children;
  if (guests === 0 && g.infants === 0 && g.pets === 0) return undefined;
  const parts = [`${guests} ${guests === 1 ? 'guest' : 'guests'}`];
  if (g.infants) parts.push(`${g.infants} ${g.infants === 1 ? 'infant' : 'infants'}`);
  if (g.pets) parts.push(`${g.pets} ${g.pets === 1 ? 'pet' : 'pets'}`);
  return parts.join(', ');
}

const NO_GUESTS: GuestCounts = { adults: 0, children: 0, infants: 0, pets: 0 };

// ---------------------------------------------------------------------------
//  Desktop
// ---------------------------------------------------------------------------

function DesktopDemo({
  initialSegment = null,
  datesMode = 'split',
  width = 860,
  initialDestination,
}: {
  initialSegment?: StaySearchSegment | null;
  datesMode?: 'split' | 'single';
  width?: number;
  initialDestination?: string;
}) {
  const theme = useTheme();
  const [segment, setSegment] = useState<StaySearchSegment | null>(initialSegment);
  const [destination, setDestination] = useState<string | undefined>(initialDestination);
  const [range, setRange] = useState<DateRange | null>(null);
  const [flex, setFlex] = useState('exact');
  const [guests, setGuests] = useState<GuestCounts>(NO_GUESTS);
  const [query, setQuery] = useState('');

  const flexSuffix = flex === 'exact' ? '' : ` ± ${flex}`;
  const dates = range
    ? {
        checkIn: `${formatDay(range.start)}${flexSuffix}`,
        checkOut: `${formatDay(range.end)}${flexSuffix}`,
      }
    : undefined;

  let panel: React.ReactNode = null;
  if (segment === 'destination') {
    panel = (
      <StaySearchPanel width={420} padding={16} accessibilityLabel="Destinations" testID="panel-destination">
        <DestinationSuggestions
          heading="Suggested destinations"
          items={SUGGESTIONS.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))}
          onSelect={(item) => {
            setDestination(item.title);
            setQuery('');
            setSegment(datesMode === 'single' ? 'dates' : 'checkIn');
          }}
          testID="suggestions"
        />
      </StaySearchPanel>
    );
  } else if (segment === 'checkIn' || segment === 'checkOut' || segment === 'dates') {
    panel = (
      <StaySearchPanel padding={24} accessibilityLabel="Dates" testID="panel-dates">
        <View style={{ gap: 20 }}>
          <RangeCalendar
            value={range}
            onChange={(next) => {
              setRange(next);
              if (datesMode === 'split') setSegment('checkOut');
            }}
            visibleMonths={2}
            defaultMonth={MONTH}
          />
          <DateFlexibilityChips value={flex} onChange={setFlex} testID="flex" />
        </View>
      </StaySearchPanel>
    );
  } else if (segment === 'guests') {
    panel = (
      <StaySearchPanel width={400} padding={8} accessibilityLabel="Guests" testID="panel-guests">
        <View style={{ paddingLeft: 24, paddingRight: 24 }}>
          <GuestPicker value={guests} onChange={setGuests} max={{ adults: 16, children: 15, infants: 5, pets: 5 }} testID="guests" />
        </View>
      </StaySearchPanel>
    );
  }

  return (
    <View style={{ width, maxWidth: '100%', minHeight: 620 }}>
      <StaySearchBar
        activeSegment={segment}
        onActiveSegmentChange={setSegment}
        destination={destination}
        dates={dates}
        guests={guestSummary(guests)}
        datesMode={datesMode}
        onSearch={() => setSegment(null)}
        destinationQuery={query}
        onDestinationQueryChange={setQuery}
        panel={panel}
        testID="bar"
      />
      <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary, marginTop: 16, marginLeft: 16 }}>
        {segment ? `Open: ${segment}` : 'At rest'}
      </Text>
    </View>
  );
}

/**
 * The wide bar, fully interactive: hover a segment, press one to open its panel,
 * press outside or Escape to close. Choosing a destination moves on to dates,
 * choosing check-in moves on to check-out.
 */
export const Desktop: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo />
    </View>
  ),
};

/** Destination open: the raised segment, the widened search button and the suggestions panel. */
export const DestinationOpen: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialSegment="destination" />
    </View>
  ),
};

/** Check in open: a two-month `RangeCalendar` with `DateFlexibilityChips` under it, centred. */
export const DatesOpen: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialSegment="checkIn" initialDestination="Marrowfield" />
    </View>
  ),
};

/** Who open: the guest picker, aligned to the right end. */
export const GuestsOpen: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo initialSegment="guests" initialDestination="Old Halden" />
    </View>
  ),
};

/** `datesMode="single"`: one "When" segment instead of check in / check out. */
export const SingleDatesSegment: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <DesktopDemo datesMode="single" width={720} />
    </View>
  ),
};

/** Filled values at rest, and each segment open, statically. */
export const States: Story = {
  render: function StatesStory() {
    const theme = useTheme();
    const segments: (StaySearchSegment | null)[] = [null, 'destination', 'checkIn', 'checkOut', 'guests'];
    return (
      <View style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background }}>
        {segments.map((s) => (
          <View key={s ?? 'rest'} style={{ gap: 8 }}>
            <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
              {s ?? 'rest, filled'}
            </Text>
            <StaySearchBar
              activeSegment={s}
              onActiveSegmentChange={() => {}}
              dismissible={false}
              destination="Terracina Coast"
              dates={{ checkIn: 'Oct 12', checkOut: 'Oct 16' }}
              guests="3 guests, 1 pet"
              style={{ width: 860 }}
            />
          </View>
        ))}
      </View>
    );
  },
};

// ---------------------------------------------------------------------------
//  Parts
// ---------------------------------------------------------------------------

/** The three ready panel parts, side by side. */
export const PanelParts: Story = {
  render: function PanelPartsStory() {
    const [guests, setGuests] = useState<GuestCounts>({ adults: 2, children: 1, infants: 0, pets: 0 });
    const [flex, setFlex] = useState('2');
    const [range, setRange] = useState<DateRange | null>({
      start: new Date(2026, 9, 12),
      end: new Date(2026, 9, 16),
    });
    return (
      <View style={{ padding: 24, gap: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <StaySearchPanel width={400}>
          <DestinationSuggestions items={SUGGESTIONS} onSelect={() => {}} heading="Suggested destinations" />
        </StaySearchPanel>
        <StaySearchPanel width={400} padding={8}>
          <View style={{ paddingLeft: 24, paddingRight: 24 }}>
            <GuestPicker value={guests} onChange={setGuests} max={16} />
          </View>
        </StaySearchPanel>
        <StaySearchPanel padding={24}>
          <View style={{ gap: 20 }}>
            <RangeCalendar value={range} onChange={setRange} visibleMonths={2} defaultMonth={MONTH} />
            <DateFlexibilityChips value={flex} onChange={setFlex} />
          </View>
        </StaySearchPanel>
      </View>
    );
  },
};

// ---------------------------------------------------------------------------
//  Mobile
// ---------------------------------------------------------------------------

/** The compact trigger at 375 and at 560, with and without the filter button. */
export const Compact: Story = {
  render: () => (
    <View style={{ padding: 16, gap: 16 }}>
      {[343, 560].map((width) => (
        <View key={width} style={{ width, gap: 12 }}>
          <StaySearchCompact onPress={() => {}} summary="Anywhere · Any week · Add guests" onFilterPress={() => {}} testID={`compact-${width}`} />
          <StaySearchCompact onPress={() => {}} summary="Marrowfield · Oct 12 – 16 · 3 guests" />
        </View>
      ))}
    </View>
  ),
};

type Step = 'where' | 'when' | 'who';

function MobileSearchFlow({ onClose }: { onClose?: () => void }) {
  const theme = useTheme();
  const [step, setStep] = useState<Step>('where');
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState<string | undefined>();
  const [range, setRange] = useState<DateRange | null>(null);
  const [flex, setFlex] = useState('exact');
  const [guests, setGuests] = useState<GuestCounts>(NO_GUESTS);

  const clear = () => {
    setDestination(undefined);
    setRange(null);
    setFlex('exact');
    setGuests(NO_GUESTS);
    setQuery('');
    setStep('where');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }}>
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 16, paddingLeft: 12, paddingRight: 12, gap: 12 }}>
        <StaySearchStep
          label="Where"
          title="Where to?"
          summary={destination ?? 'I’m flexible'}
          expanded={step === 'where'}
          onPress={() => setStep('where')}
          testID="step-where"
        >
          <Search value={query} onChangeText={setQuery} onClearText={() => setQuery('')} label="Search destinations" />
          <DestinationSuggestions
            items={SUGGESTIONS.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))}
            onSelect={(item) => {
              setDestination(item.title);
              setStep('when');
            }}
            style={{ marginLeft: -12, marginRight: -12 }}
          />
        </StaySearchStep>
        <StaySearchStep
          label="When"
          title="When’s your trip?"
          summary={range ? `${formatDay(range.start)} – ${formatDay(range.end)}` : 'Any week'}
          expanded={step === 'when'}
          onPress={() => setStep('when')}
          testID="step-when"
        >
          {/* The month panel is a fixed 326 wide; at 375 it borrows the card's inset. */}
          <View style={{ marginLeft: -16, marginRight: -16, alignItems: 'center' }}>
            <RangeCalendar value={range} onChange={setRange} defaultMonth={MONTH} />
          </View>
          <DateFlexibilityChips value={flex} onChange={setFlex} />
        </StaySearchStep>
        <StaySearchStep
          label="Who"
          title="Who’s coming?"
          summary={guestSummary(guests) ?? 'Add guests'}
          expanded={step === 'who'}
          onPress={() => setStep('who')}
          testID="step-who"
        >
          <GuestPicker value={guests} onChange={setGuests} max={16} testID="mobile-guests" />
        </StaySearchStep>
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
        <Button variant="link" onPress={clear}>
          Clear all
        </Button>
        <Button variant="primary" size="large" icon={RiSearchLine} onPress={onClose}>
          Search
        </Button>
      </View>
    </View>
  );
}

/**
 * The narrow-screen flow at 375: the compact trigger opens a full-height sheet
 * of `StaySearchStep` cards — one expanded at a time — over a footer with
 * "Clear all" and "Search". Rendered inline so the whole flow is visible;
 * `MobileFlowInDialog` opens the same content in a `Dialog`.
 */
export const MobileFlow: Story = {
  render: function MobileFlowStory() {
    const theme = useTheme();
    return (
      <View style={{ width: 375, height: 760, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
        <MobileSearchFlow />
      </View>
    );
  },
};

/** The compact trigger opening the flow in a bottom `Dialog`. */
export const MobileFlowInDialog: Story = {
  render: function MobileFlowDialogStory() {
    const control = useDialogControl();
    return (
      <View style={{ width: 375, padding: 16 }}>
        <StaySearchCompact onPress={() => control.open()} summary="Anywhere · Any week · Add guests" onFilterPress={() => {}} testID="compact" />
        <Dialog control={control} placement="bottom" title="Search stays">
          <View style={{ height: 640, marginLeft: -16, marginRight: -16 }}>
            <MobileSearchFlow onClose={() => control.close()} />
          </View>
        </Dialog>
      </View>
    );
  },
};

/** Dark: the bar with the guests panel open, and the mobile flow. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <DarkCanvas />
    </BloomThemeProvider>
  ),
};

function DarkCanvas() {
  const theme = useTheme();
  return (
    <View style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background }}>
      <DesktopDemo initialSegment="guests" initialDestination="Solvia Bay" />
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
        <View style={{ width: 343 }}>
          <StaySearchCompact onPress={() => {}} summary="Anywhere · Any week · Add guests" onFilterPress={() => {}} />
        </View>
        <View style={{ width: 375, height: 760, borderRadius: 16, overflow: 'hidden' }}>
          <MobileSearchFlow />
        </View>
      </View>
    </View>
  );
}

/**
 * A row that cannot be chosen, and the stepper buttons in another language.
 * Turn "Location" off to dim the first row: hover skips it, ArrowDown steps
 * over it, Enter on it does nothing, and it says why.
 */
export const UnavailableRowAndTranslatedSteppers: Story = {
  render: function UnavailableRowStory() {
    const theme = useTheme();
    const [locationOn, setLocationOn] = useState(false);
    const [chosen, setChosen] = useState('nothing yet');
    const [guests, setGuests] = useState<GuestCounts>({ adults: 2, children: 0, infants: 0, pets: 0 });
    const items: DestinationSuggestion[] = [
      {
        id: 'nearby',
        title: 'Use my location',
        description: 'Find what’s around you',
        icon: RiMapPinLine,
        disabled: !locationOn,
        disabledReason: 'Location is off',
      },
      ...SUGGESTIONS.slice(1),
    ];
    return (
      <View style={{ padding: 24, gap: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <View style={{ gap: 12 }}>
          <Button variant="secondary" size="small" onPress={() => setLocationOn((on) => !on)}>
            {locationOn ? 'Turn location off' : 'Turn location on'}
          </Button>
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {`Chosen: ${chosen}`}
          </Text>
          <StaySearchPanel width={400}>
            <DestinationSuggestions
              items={items}
              onSelect={(item) => setChosen(item.title)}
              heading="Suggested destinations"
              testID="disabled-suggestions"
            />
          </StaySearchPanel>
        </View>
        <StaySearchPanel width={400} padding={8}>
          <View style={{ paddingLeft: 24, paddingRight: 24 }}>
            <GuestPicker
              value={guests}
              onChange={setGuests}
              max={16}
              labels={{ adults: 'Adultos', children: 'Niños', infants: 'Bebés', pets: 'Mascotas' }}
              descriptions={{ adults: 'Desde 13 años', children: 'De 2 a 12', infants: 'Menos de 2', pets: null }}
              decrementLabel="Quitar uno"
              incrementLabel="Añadir uno"
              closeLabel="Cerrar"
              testID="es-guests"
            />
          </View>
        </StaySearchPanel>
      </View>
    );
  },
};
