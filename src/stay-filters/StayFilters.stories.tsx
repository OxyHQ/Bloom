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
import { Text } from '../typography';
import { AmenityFilter } from './AmenityFilter';
import { AreaRangeFilter } from './AreaRangeFilter';
import { AvailabilityFilter } from './AvailabilityFilter';
import { CountFilter } from './CountFilter';
import { EnergyRatingFilter } from './EnergyRatingFilter';
import { FeatureFilter } from './FeatureFilter';
import { FilterFooter } from './FilterFooter';
import { FilterSection } from './FilterSection';
import { FilterTriggerButton } from './FilterTriggerButton';
import { FloorFilter } from './FloorFilter';
import { PriceHistogram } from './PriceHistogram';
import { PriceRangeFilter } from './PriceRangeFilter';
import { PropertyTypeFilter } from './PropertyTypeFilter';
import { SegmentedFilter } from './SegmentedFilter';
import { SwitchFilterRow } from './SwitchFilterRow';
import type { EnergyRating, FloorOption, HousingFeature, PropertyType, ToggleChipOption } from './types';

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

// ---------------------------------------------------------------------------
//  Housing: the long-term rent and buy filters
// ---------------------------------------------------------------------------

const SALE_MIN = 50_000;
const SALE_MAX = 2_000_000;
const RENT_MIN = 300;
const RENT_MAX = 4_000;

/** 40 counts bucketed in LOG space for the sale scale: a hump around the mid-market. */
const SALE_BUCKETS = Array.from({ length: 40 }, (_, i) => {
  const x = i / 39;
  const hump = Math.exp(-((x - 0.45) ** 2) / 0.03) * 80;
  const wobble = ((i * 29) % 9) - 4;
  return Math.max(0, Math.round(hump + 6 + wobble));
});

const RENT_BUCKETS = Array.from({ length: 40 }, (_, i) => {
  const x = i / 39;
  const hump = Math.exp(-((x - 0.25) ** 2) / 0.018) * 90;
  const tail = Math.exp(-x * 4) * 20;
  const wobble = ((i * 31) % 7) - 3;
  return Math.max(0, Math.round(hump + tail + wobble));
});

const formatSale = (n: number) =>
  n >= SALE_MAX
    ? '€2M+'
    : n >= 1_000_000
      ? `€${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
      : `€${Math.round(n / 1000)}K`;
const formatRent = (n: number) => (n >= RENT_MAX ? `€${n.toLocaleString('en-US')}+` : `€${n.toLocaleString('en-US')}`);

interface HousingFilterState {
  price: [number, number];
  types: PropertyType[];
  bedrooms: number | null;
  bathrooms: number | null;
  area: [number | null, number | null];
  features: HousingFeature[];
  energy: EnergyRating | null;
  floors: FloorOption[];
  availableNow: boolean;
  availableFrom: Date | null;
  newBuild: boolean;
}

function housingInitial(kind: 'buy' | 'rent'): HousingFilterState {
  return {
    price: kind === 'buy' ? [SALE_MIN, SALE_MAX] : [RENT_MIN, RENT_MAX],
    types: [],
    bedrooms: null,
    bathrooms: null,
    area: [null, null],
    features: [],
    energy: null,
    floors: [],
    availableNow: false,
    availableFrom: null,
    newBuild: false,
  };
}

function housingCount(kind: 'buy' | 'rent', s: HousingFilterState): number {
  const base = housingInitial(kind);
  return (
    (s.price[0] !== base.price[0] || s.price[1] !== base.price[1] ? 1 : 0) +
    s.types.length +
    (s.bedrooms != null ? 1 : 0) +
    (s.bathrooms != null ? 1 : 0) +
    (s.area[0] != null || s.area[1] != null ? 1 : 0) +
    s.features.length +
    (s.energy ? 1 : 0) +
    s.floors.length +
    (s.availableNow || s.availableFrom ? 1 : 0) +
    (s.newBuild ? 1 : 0)
  );
}

function HousingSections({
  kind,
  state,
  set,
}: {
  kind: 'buy' | 'rent';
  state: HousingFilterState;
  set: (patch: Partial<HousingFilterState>) => void;
}) {
  const buy = kind === 'buy';
  return (
    <>
      <FilterSection title="Property type" description="Pick any number; none means every type.">
        <PropertyTypeFilter value={state.types} onValueChange={(types) => set({ types })} testID="types" />
      </FilterSection>
      <FilterSection
        title={buy ? 'Price' : 'Monthly rent'}
        description={buy ? 'Total asking price. The scale widens as prices grow.' : 'Rent per month, before bills'}
      >
        {buy ? (
          <PriceRangeFilter
            buckets={SALE_BUCKETS}
            min={SALE_MIN}
            max={SALE_MAX}
            scale="log"
            step={5000}
            value={state.price}
            onValueChange={(price) => set({ price })}
            formatPrice={formatSale}
            testID="price"
          />
        ) : (
          <PriceRangeFilter
            buckets={RENT_BUCKETS}
            min={RENT_MIN}
            max={RENT_MAX}
            step={50}
            value={state.price}
            onValueChange={(price) => set({ price })}
            formatPrice={formatRent}
            testID="price"
          />
        )}
      </FilterSection>
      <FilterSection title="Rooms">
        <View style={{ gap: 24 }}>
          <CountFilter title="Bedrooms" value={state.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} max={5} />
          <CountFilter title="Bathrooms" value={state.bathrooms} onValueChange={(bathrooms) => set({ bathrooms })} max={4} />
        </View>
      </FilterSection>
      <FilterSection title="Area" description="Usable floor area">
        <AreaRangeFilter value={state.area} onValueChange={(area) => set({ area })} slider={buy} max={buy ? 500 : 250} testID="area" />
      </FilterSection>
      {buy ? null : (
        <FilterSection title="Availability">
          <AvailabilityFilter
            availableNow={state.availableNow}
            onAvailableNowChange={(availableNow) => set({ availableNow })}
            date={state.availableFrom}
            onDateChange={(availableFrom) => set({ availableFrom })}
            testID="availability"
          />
        </FilterSection>
      )}
      <FilterSection title="Features">
        <FeatureFilter
          variant={buy ? 'chips' : 'checkboxes'}
          value={state.features}
          onValueChange={(features) => set({ features })}
          testID="features"
        />
      </FilterSection>
      <FilterSection title="Energy rating" description="The worst rating you would accept">
        <EnergyRatingFilter value={state.energy} onValueChange={(energy) => set({ energy })} testID="energy" />
      </FilterSection>
      <FilterSection title="Floor" divider={!buy ? false : true}>
        <FloorFilter value={state.floors} onValueChange={(floors) => set({ floors })} testID="floors" />
      </FilterSection>
      {buy ? (
        <FilterSection title="Condition" divider={false}>
          <SwitchFilterRow
            title="New builds only"
            description="Homes that have never been lived in"
            value={state.newBuild}
            onValueChange={(newBuild) => set({ newBuild })}
          />
        </FilterSection>
      ) : null}
    </>
  );
}

function HousingFiltersDialogDemo({ kind, openOnMount = false }: { kind: 'buy' | 'rent'; openOnMount?: boolean }) {
  const control = useDialogControl();
  const [state, setState] = useState(() => housingInitial(kind));
  const [applied, setApplied] = useState(() => housingInitial(kind));
  const set = (patch: Partial<HousingFilterState>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    if (openOnMount) control.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = Math.max(0, 2400 - housingCount(kind, state) * 310);
  return (
    <>
      <FilterTriggerButton count={housingCount(kind, applied)} onPress={() => control.open()} testID="filters-trigger" />
      <Dialog
        control={control}
        label="Filters"
        header={{ title: kind === 'buy' ? 'Filters · Buy' : 'Filters · Rent', largeTitle: false }}
        placement={{ base: 'bottom', md: 'center' }}
        maxWidth={780}
        scrollable={false}
        contentPadding={0}
        testID="filters-dialog"
      >
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}>
          <HousingSections kind={kind} state={state} set={set} />
        </ScrollView>
        <FilterFooter
          resultsLabel={n >= 1000 ? `Show ${n.toLocaleString('en-US')} homes` : `Show ${n} homes`}
          clearDisabled={housingCount(kind, state) === 0}
          onClear={() => setState(housingInitial(kind))}
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

/** The Buy filters dialog: type tiles, a LOG-scale sale price, rooms, area with a slider, feature chips, energy, floor. */
export const HousingFiltersBuy: Story = {
  render: () => <HousingFiltersDialogDemo kind="buy" openOnMount />,
};

/** The Rent filters dialog: type tiles, monthly rent, rooms, area fields, availability, feature checkboxes, energy, floor. */
export const HousingFiltersRent: Story = {
  render: () => <HousingFiltersDialogDemo kind="rent" openOnMount />,
};

function HousingPanel({ kind, width }: { kind: 'buy' | 'rent'; width: number }) {
  const theme = useTheme();
  const [state, setState] = useState<HousingFilterState>(() => ({
    ...housingInitial(kind),
    types: ['apartment', 'duplex'],
    area: [60, null],
    features: ['elevator', 'terrace'],
    energy: 'C',
    floors: ['top'],
    price: kind === 'buy' ? [250_000, 600_000] : [900, 1_600],
  }));
  const set = (patch: Partial<HousingFilterState>) => setState((s) => ({ ...s, ...patch }));
  return (
    <View
      style={{
        width,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingLeft: 24, paddingRight: 24 }}>
        <HousingSections kind={kind} state={state} set={set} />
      </View>
      <FilterFooter resultsLabel="Show 214 homes" onApply={() => {}} onClear={() => setState(housingInitial(kind))} />
    </View>
  );
}

/** The Buy sections inline, with filters set, at 780 (desktop dialog width). */
export const HousingBuyWide: Story = {
  render: () => <HousingPanel kind="buy" width={780} />,
};

/** The Rent sections inline at a 375 phone width. */
export const HousingRentNarrow: Story = {
  render: () => <HousingPanel kind="rent" width={375 - 16} />,
};

/** `PriceRangeFilter` on a sale scale: linear and log over €50K – €2M, side by side. */
export const SalePriceScale: Story = {
  render: function SalePriceStory() {
    const theme = useTheme();
    const [log, setLog] = useState<[number, number]>([200_000, 650_000]);
    const [linear, setLinear] = useState<[number, number]>([200_000, 650_000]);
    return (
      <View style={{ width: 560, gap: 32 }}>
        <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
          scale="log", step 5,000
        </Text>
        <PriceRangeFilter buckets={SALE_BUCKETS} min={SALE_MIN} max={SALE_MAX} scale="log" step={5000} value={log} onValueChange={setLog} formatPrice={formatSale} testID="log" />
        <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
          scale="linear", step 5,000 — most of the width sits above the market
        </Text>
        <PriceRangeFilter min={SALE_MIN} max={SALE_MAX} step={5000} value={linear} onValueChange={setLinear} formatPrice={formatSale} testID="linear" />
      </View>
    );
  },
};

/** `PropertyTypeFilter` at 560 (four per row) and 327 (two per row). */
export const PropertyTypes: Story = {
  render: function PropertyTypesStory() {
    const [value, setValue] = useState<PropertyType[]>(['apartment', 'studio']);
    return (
      <View style={{ gap: 32 }}>
        <View style={{ width: 560 }}>
          <PropertyTypeFilter value={value} onValueChange={setValue} testID="types" />
        </View>
        <View style={{ width: 327 }}>
          <PropertyTypeFilter value={value} onValueChange={setValue} />
        </View>
      </View>
    );
  },
};

/** `FeatureFilter` as chips and as checkboxes. */
export const Features: Story = {
  render: function FeaturesStory() {
    const [value, setValue] = useState<HousingFeature[]>(['elevator', 'pets']);
    return (
      <View style={{ width: 560, gap: 40 }}>
        <FeatureFilter value={value} onValueChange={setValue} testID="features" />
        <FeatureFilter variant="checkboxes" value={value} onValueChange={setValue} />
      </View>
    );
  },
};

/** `EnergyRatingFilter`: any rating, "C and better", "A only", disabled. */
export const EnergyRatings: Story = {
  render: function EnergyStory() {
    const [value, setValue] = useState<EnergyRating | null>('C');
    return (
      <View style={{ width: 400, gap: 32 }}>
        <EnergyRatingFilter value={null} onValueChange={() => {}} />
        <EnergyRatingFilter value={value} onValueChange={setValue} testID="energy" />
        <EnergyRatingFilter value="A" onValueChange={() => {}} />
        <EnergyRatingFilter value="E" onValueChange={() => {}} disabled />
      </View>
    );
  },
};

/** `AreaRangeFilter` with fields only and with a slider; `AvailabilityFilter`; `FloorFilter`. */
export const AreaAvailabilityFloor: Story = {
  render: function AreaStory() {
    const [area, setArea] = useState<[number | null, number | null]>([50, 120]);
    const [open, setOpen] = useState<[number | null, number | null]>([null, null]);
    const [now, setNow] = useState(false);
    const [date, setDate] = useState<Date | null>(new Date(2026, 10, 1));
    const [floors, setFloors] = useState<FloorOption[]>(['middle', 'elevator']);
    return (
      <View style={{ width: 560 }}>
        <FilterSection title="Area">
          <View style={{ gap: 24 }}>
            <AreaRangeFilter value={open} onValueChange={setOpen} testID="area-fields" />
            <AreaRangeFilter value={area} onValueChange={setArea} slider max={300} testID="area" />
          </View>
        </FilterSection>
        <FilterSection title="Availability">
          <AvailabilityFilter availableNow={now} onAvailableNowChange={setNow} date={date} onDateChange={setDate} testID="availability" />
        </FilterSection>
        <FilterSection title="Floor" divider={false}>
          <FloorFilter value={floors} onValueChange={setFloors} testID="floors" />
        </FilterSection>
      </View>
    );
  },
};
