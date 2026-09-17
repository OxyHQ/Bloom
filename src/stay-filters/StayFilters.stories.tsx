import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Dialog, useDialogControl } from '../dialog';
import { RiDropLine } from '../icons/remix/RiDropLine';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { RiParkingBoxLine } from '../icons/remix/RiParkingBoxLine';
import { RiRestaurantLine } from '../icons/remix/RiRestaurantLine';
import { RiTShirtAirLine } from '../icons/remix/RiTShirtAirLine';
import { RiTempColdLine } from '../icons/remix/RiTempColdLine';
import { RiTvLine } from '../icons/remix/RiTvLine';
import { RiWifiLine } from '../icons/remix/RiWifiLine';
import { StepperRow } from '../stepper';
import { useTheme } from '../theme/use-theme';
import { AmenityFilter } from './AmenityFilter';
import { CountFilter } from './CountFilter';
import { FilterFooter } from './FilterFooter';
import { FilterSection } from './FilterSection';
import { FilterTriggerButton } from './FilterTriggerButton';
import { PriceHistogram } from './PriceHistogram';
import { PriceRangeFilter } from './PriceRangeFilter';
import { SegmentedFilter } from './SegmentedFilter';
import { SwitchFilterRow } from './SwitchFilterRow';
import type { ToggleChipOption } from './types';

const meta: Meta = {
  title: 'Blocks/Stays/Stay Filters',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data (invented)
// ---------------------------------------------------------------------------

const PRICE_MIN = 20;
const PRICE_MAX = 620;

/** 40 buckets of listing counts: a long-tailed hump, deterministic. */
const BUCKETS = Array.from({ length: 40 }, (_, i) => {
  const x = i / 39;
  const hump = Math.exp(-((x - 0.22) ** 2) / 0.02) * 90;
  const tail = Math.exp(-x * 3) * 30;
  const wobble = ((i * 37) % 11) - 5;
  return Math.max(0, Math.round(hump + tail + wobble));
});

const formatPrice = (n: number) => (n >= PRICE_MAX ? `$${n}+` : `$${n}`);

type PlaceType = 'any' | 'room' | 'entire';
const PLACE_TYPES: { value: PlaceType; label: string }[] = [
  { value: 'any', label: 'Any type' },
  { value: 'room', label: 'Room' },
  { value: 'entire', label: 'Entire home' },
];

type Amenity = 'wifi' | 'kitchen' | 'washer' | 'parking' | 'pool' | 'ac' | 'tv' | 'fireplace';
const AMENITIES: ToggleChipOption<Amenity>[] = [
  { value: 'wifi', label: 'Wifi', icon: RiWifiLine },
  { value: 'kitchen', label: 'Kitchen', icon: RiRestaurantLine },
  { value: 'washer', label: 'Washer', icon: RiTShirtAirLine },
  { value: 'parking', label: 'Free parking', icon: RiParkingBoxLine },
  { value: 'pool', label: 'Pool', icon: RiDropLine },
  { value: 'ac', label: 'Air conditioning', icon: RiTempColdLine },
  { value: 'tv', label: 'TV', icon: RiTvLine },
  { value: 'fireplace', label: 'Indoor fireplace', icon: RiFireLine },
];

interface FilterState {
  price: [number, number];
  type: PlaceType;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  amenities: Amenity[];
  instant: boolean;
}

const INITIAL: FilterState = {
  price: [PRICE_MIN, PRICE_MAX],
  type: 'any',
  bedrooms: null,
  beds: null,
  bathrooms: null,
  amenities: [],
  instant: false,
};

function appliedCount(s: FilterState): number {
  return (
    (s.price[0] !== PRICE_MIN || s.price[1] !== PRICE_MAX ? 1 : 0) +
    (s.type !== 'any' ? 1 : 0) +
    (s.bedrooms != null ? 1 : 0) +
    (s.beds != null ? 1 : 0) +
    (s.bathrooms != null ? 1 : 0) +
    s.amenities.length +
    (s.instant ? 1 : 0)
  );
}

/** A stand-in for the result count an app would fetch. */
function resultsLabel(s: FilterState): string {
  const n = Math.max(0, 1000 - appliedCount(s) * 173 - Math.round((s.price[0] - PRICE_MIN) / 2));
  return n >= 1000 ? 'Show 1,000+ places' : `Show ${n} places`;
}

// ---------------------------------------------------------------------------
//  The composed surface
// ---------------------------------------------------------------------------

function FilterSections({ state, set }: { state: FilterState; set: (patch: Partial<FilterState>) => void }) {
  return (
    <>
      <FilterSection title="Type of place" description="Search rooms, entire homes, or any type of place.">
        <SegmentedFilter
          options={PLACE_TYPES}
          value={state.type}
          onValueChange={(type) => set({ type })}
          accessibilityLabel="Type of place"
          testID="type"
        />
      </FilterSection>
      <FilterSection title="Price range" description="Nightly prices before fees and taxes">
        <PriceRangeFilter
          buckets={BUCKETS}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5}
          value={state.price}
          onValueChange={(price) => set({ price })}
          formatPrice={formatPrice}
          testID="price"
        />
      </FilterSection>
      <FilterSection title="Rooms and beds">
        <View style={{ gap: 24 }}>
          <CountFilter title="Bedrooms" value={state.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} testID="bedrooms" />
          <CountFilter title="Beds" value={state.beds} onValueChange={(beds) => set({ beds })} testID="beds" />
          <CountFilter title="Bathrooms" value={state.bathrooms} onValueChange={(bathrooms) => set({ bathrooms })} testID="bathrooms" />
        </View>
      </FilterSection>
      <FilterSection title="Amenities">
        <AmenityFilter
          options={AMENITIES}
          value={state.amenities}
          onValueChange={(amenities) => set({ amenities })}
          accessibilityLabel="Amenities"
          testID="amenities"
        />
      </FilterSection>
      <FilterSection title="Booking options" divider={false}>
        <SwitchFilterRow
          title="Instant Book"
          description="Listings you can book without waiting for host approval"
          value={state.instant}
          onValueChange={(instant) => set({ instant })}
          testID="instant"
        />
      </FilterSection>
    </>
  );
}

function useFilterState(initial: FilterState = INITIAL) {
  const [state, setState] = useState(initial);
  const set = (patch: Partial<FilterState>) => setState((s) => ({ ...s, ...patch }));
  return { state, set, reset: () => setState(INITIAL) };
}

/** The whole filters dialog, opened from the trigger — the way an app composes it. */
function FiltersDialogDemo({ openOnMount = false }: { openOnMount?: boolean }) {
  const control = useDialogControl();
  const { state, set, reset } = useFilterState();
  const [applied, setApplied] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const count = appliedCount(applied);

  // Stand-in for refetching the result count while the user changes filters.
  const key = JSON.stringify(state);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [key]);

  useEffect(() => {
    if (openOnMount) control.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <FilterTriggerButton count={count} onPress={() => control.open()} testID="filters-trigger" />
      <Dialog
        control={control}
        label="Filters"
        header={{ title: 'Filters', largeTitle: false }}
        placement={{ base: 'bottom', md: 'center' }}
        maxWidth={780}
        scrollable={false}
        contentPadding={0}
        testID="filters-dialog"
      >
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}>
          <FilterSections state={state} set={set} />
        </ScrollView>
        <FilterFooter
          resultsLabel={resultsLabel(state)}
          loading={loading}
          clearDisabled={appliedCount(state) === 0}
          onClear={reset}
          onApply={() => {
            setApplied(state);
            control.close();
          }}
          testID="footer"
        />
      </Dialog>
    </>
  );
}

/**
 * The composed filters dialog. Press "Filters": a centred 780-wide dialog at
 * `md` and up, a bottom sheet below it (the `Dialog`'s own responsive
 * placement). The sections scroll; the footer stays. Apply, and the trigger
 * shows how many filters are on.
 */
export const FiltersDialog: Story = {
  render: () => <FiltersDialogDemo />,
};

/** The same dialog, already open — for screenshots at 1280 and 375. */
export const FiltersDialogOpen: Story = {
  render: () => <FiltersDialogDemo openOnMount />,
};

/** The body inline in a fixed-width frame, so wide and narrow sit side by side without a dialog. */
function Panel({ width }: { width: number }) {
  const theme = useTheme();
  const { state, set, reset } = useFilterState({ ...INITIAL, price: [95, 380], bedrooms: 2, amenities: ['wifi', 'kitchen'] });
  return (
    <View
      style={{
        width,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingLeft: 24, paddingRight: 24 }}>
        <FilterSections state={state} set={set} />
      </View>
      <FilterFooter resultsLabel={resultsLabel(state)} onApply={() => {}} onClear={reset} />
    </View>
  );
}

/** Every part in a 780-wide frame (the desktop dialog's width), with some filters set. */
export const Wide: Story = {
  render: () => <Panel width={780} />,
};

/** The same parts at a 375 phone width: the count pills scroll sideways, amenity chips wrap. */
export const Narrow: Story = {
  render: () => <Panel width={375 - 48} />,
};

// ---------------------------------------------------------------------------
//  Each part alone
// ---------------------------------------------------------------------------

/** `FilterSection` stacked three times: heading, description, content, hairline. */
export const Section: Story = {
  render: function SectionStory() {
    const theme = useTheme();
    const [on, setOn] = useState(true);
    return (
      <View style={{ width: 560 }}>
        <FilterSection title="Heading only">
          <View style={{ height: 40, borderRadius: 12, backgroundColor: theme.colors.contrast50 }} />
        </FilterSection>
        <FilterSection title="With a description" description="A secondary line that explains the section.">
          <View style={{ height: 40, borderRadius: 12, backgroundColor: theme.colors.contrast50 }} />
        </FilterSection>
        <FilterSection title="Last section" divider={false}>
          <SwitchFilterRow title="Self check-in" value={on} onValueChange={setOn} />
        </FilterSection>
      </View>
    );
  },
};

/** Drag either thumb: the bars inside the range turn the text colour. Type in a field and blur to commit. */
export const PriceRange: Story = {
  render: function PriceRangeStory() {
    const [value, setValue] = useState<[number, number]>([80, 340]);
    return (
      <View style={{ width: 560, gap: 32 }}>
        <PriceRangeFilter
          buckets={BUCKETS}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5}
          value={value}
          onValueChange={setValue}
          formatPrice={formatPrice}
          testID="price"
        />
      </View>
    );
  },
};

/** `PriceHistogram` alone at three ranges: all, a middle slice, nothing selected. */
export const Histogram: Story = {
  render: () => (
    <View style={{ width: 480, gap: 24 }}>
      <PriceHistogram buckets={BUCKETS} min={PRICE_MIN} max={PRICE_MAX} value={[PRICE_MIN, PRICE_MAX]} />
      <PriceHistogram buckets={BUCKETS} min={PRICE_MIN} max={PRICE_MAX} value={[120, 300]} />
      <PriceHistogram buckets={BUCKETS} min={PRICE_MIN} max={PRICE_MAX} value={[PRICE_MIN, PRICE_MIN]} height={40} />
    </View>
  ),
};

/** `SegmentedFilter`, full width. */
export const Segmented: Story = {
  render: function SegmentedStory() {
    const [value, setValue] = useState<PlaceType>('any');
    return (
      <View style={{ width: 560 }}>
        <SegmentedFilter options={PLACE_TYPES} value={value} onValueChange={setValue} accessibilityLabel="Type of place" />
      </View>
    );
  },
};

/**
 * `CountFilter` for bedrooms, beds and bathrooms (one disabled), then the
 * `StepperRow` alternative for an exact count.
 */
export const Counts: Story = {
  render: function CountsStory() {
    const [bedrooms, setBedrooms] = useState<number | null>(2);
    const [beds, setBeds] = useState<number | null>(null);
    const [guests, setGuests] = useState(2);
    return (
      <View style={{ width: 560, gap: 24 }}>
        <CountFilter title="Bedrooms" value={bedrooms} onValueChange={setBedrooms} testID="bedrooms" />
        <CountFilter title="Beds" value={beds} onValueChange={setBeds} testID="beds" />
        <CountFilter title="Bathrooms" value={1} onValueChange={() => {}} disabled />
        <StepperRow title="Guests" description="The alternative: an exact count" value={guests} onValueChange={setGuests} min={1} max={16} />
      </View>
    );
  },
};

/** `AmenityFilter`: six amenities, "Show more" for the rest; a selected one past the fold stays visible. */
export const Amenities: Story = {
  render: function AmenitiesStory() {
    const [value, setValue] = useState<Amenity[]>(['wifi', 'fireplace']);
    return (
      <View style={{ width: 560 }}>
        <AmenityFilter options={AMENITIES} value={value} onValueChange={setValue} accessibilityLabel="Amenities" testID="amenities" />
      </View>
    );
  },
};

/** `SwitchFilterRow`: on, off, disabled. */
export const Switches: Story = {
  render: function SwitchesStory() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <View style={{ width: 560, gap: 24 }}>
        <SwitchFilterRow title="Instant Book" description="Listings you can book without waiting for host approval" value={a} onValueChange={setA} />
        <SwitchFilterRow title="Self check-in" description="Easy access to the property once you arrive" value={b} onValueChange={setB} />
        <SwitchFilterRow title="Allows pets" value={false} onValueChange={() => {}} disabled />
      </View>
    );
  },
};

/** `FilterFooter` at rest, loading, and with nothing to clear. */
export const Footer: Story = {
  render: () => (
    <View style={{ width: 560, gap: 16 }}>
      <FilterFooter resultsLabel="Show 1,000+ places" onApply={() => {}} onClear={() => {}} />
      <FilterFooter resultsLabel="Show 214 places" loading onApply={() => {}} onClear={() => {}} />
      <FilterFooter resultsLabel="Show 1,000+ places" clearDisabled onApply={() => {}} onClear={() => {}} />
    </View>
  ),
};

/** `FilterTriggerButton` without and with applied filters, at each size. */
export const Trigger: Story = {
  render: () => {
    const sizes = ['small', 'medium', 'large'] as const;
    return (
      <View style={{ gap: 16 }}>
        {sizes.map((size) => (
          <View key={size} style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
            <FilterTriggerButton size={size} />
            <FilterTriggerButton size={size} count={3} />
            <FilterTriggerButton size={size} count={12} />
          </View>
        ))}
      </View>
    );
  },
};
