import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Dialog, type DialogControlProps } from '../../src/dialog';
import type { HomeSearchMode } from '../../src/home-search';
import {
  AmenityFilter,
  AreaRangeFilter,
  AvailabilityFilter,
  CountFilter,
  EnergyRatingFilter,
  FeatureFilter,
  FilterFooter,
  FilterSection,
  FloorFilter,
  PriceRangeFilter,
  PropertyTypeFilter,
  SegmentedFilter,
  SwitchFilterRow,
} from '../../src/stay-filters';
import {
  PLACE_TYPES,
  PRICE_BOUNDS,
  STAY_AMENITIES,
  SWAP_KINDS,
  appliedFilterCount,
  euro,
  euroShort,
  filterResultsLabel,
  noFilters,
  type Filters,
} from './data';

type Set = (patch: Partial<Filters>) => void;

function PriceSection({ mode, value, set }: { mode: HomeSearchMode; value: Filters; set: Set }) {
  const bounds = PRICE_BOUNDS[mode];
  const sale = mode === 'buy';
  const format = (n: number) => {
    const text = sale ? euroShort(n) : euro(n);
    return n >= bounds.max ? `${text}+` : text;
  };
  const description = { rent: 'Monthly rent, before bills', buy: 'Asking price', stays: 'Nightly prices before fees and taxes', swap: '' }[mode];
  return (
    <FilterSection title={sale ? 'Price' : 'Price range'} description={description}>
      <PriceRangeFilter
        buckets={bounds.buckets}
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        scale={sale ? 'log' : 'linear'}
        value={value.price}
        onValueChange={(price) => set({ price })}
        formatPrice={format}
        testID="housing-filter-price"
      />
    </FilterSection>
  );
}

function Rooms({ value, set, beds = false }: { value: Filters; set: Set; beds?: boolean }) {
  return (
    <FilterSection title="Rooms">
      <View style={{ gap: 24 }}>
        <CountFilter title="Bedrooms" value={value.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} max={5} />
        {beds ? <CountFilter title="Beds" value={value.beds} onValueChange={(n) => set({ beds: n })} /> : null}
        <CountFilter title="Bathrooms" value={value.bathrooms} onValueChange={(bathrooms) => set({ bathrooms })} max={4} />
      </View>
    </FilterSection>
  );
}

/** The sections each mode filters by. */
function FilterSections({ mode, value, set }: { mode: HomeSearchMode; value: Filters; set: Set }) {
  switch (mode) {
    case 'rent':
      return (
        <>
          <PriceSection mode={mode} value={value} set={set} />
          <FilterSection title="Property type">
            <PropertyTypeFilter value={value.types} onValueChange={(types) => set({ types })} testID="housing-filter-types" />
          </FilterSection>
          <Rooms value={value} set={set} />
          <FilterSection title="Floor area">
            <AreaRangeFilter value={value.area} onValueChange={(area) => set({ area })} max={300} />
          </FilterSection>
          <FilterSection title="Availability">
            <AvailabilityFilter
              availableNow={value.availableNow}
              onAvailableNowChange={(availableNow) => set({ availableNow })}
              date={value.availableFrom}
              onDateChange={(availableFrom) => set({ availableFrom })}
            />
          </FilterSection>
          <FilterSection title="Features">
            <FeatureFilter value={value.features} onValueChange={(features) => set({ features })} />
          </FilterSection>
          <FilterSection title="Floor" divider={false}>
            <FloorFilter value={value.floors} onValueChange={(floors) => set({ floors })} />
          </FilterSection>
        </>
      );
    case 'buy':
      return (
        <>
          <PriceSection mode={mode} value={value} set={set} />
          <FilterSection title="Property type">
            <PropertyTypeFilter value={value.types} onValueChange={(types) => set({ types })} />
          </FilterSection>
          <Rooms value={value} set={set} />
          <FilterSection title="Floor area">
            <AreaRangeFilter value={value.area} onValueChange={(area) => set({ area })} max={500} slider />
          </FilterSection>
          <FilterSection title="Energy rating" description="The worst rating you would accept">
            <EnergyRatingFilter value={value.energy} onValueChange={(energy) => set({ energy })} />
          </FilterSection>
          <FilterSection title="Features">
            <FeatureFilter variant="checkboxes" value={value.features} onValueChange={(features) => set({ features })} />
          </FilterSection>
          <FilterSection title="Floor" divider={false}>
            <FloorFilter value={value.floors} onValueChange={(floors) => set({ floors })} />
          </FilterSection>
        </>
      );
    case 'stays':
      return (
        <>
          <FilterSection title="Type of place" description="Search rooms, entire homes, or any type of place.">
            <SegmentedFilter
              options={PLACE_TYPES}
              value={value.placeType}
              onValueChange={(placeType) => set({ placeType })}
              accessibilityLabel="Type of place"
            />
          </FilterSection>
          <PriceSection mode={mode} value={value} set={set} />
          <Rooms value={value} set={set} beds />
          <FilterSection title="Amenities">
            <AmenityFilter
              options={STAY_AMENITIES}
              value={value.amenities}
              onValueChange={(amenities) => set({ amenities })}
              accessibilityLabel="Amenities"
            />
          </FilterSection>
          <FilterSection title="Booking options" divider={false}>
            <SwitchFilterRow
              title="Instant booking"
              description="Places you can book without waiting for the host"
              value={value.instant}
              onValueChange={(instant) => set({ instant })}
            />
          </FilterSection>
        </>
      );
    case 'swap':
      return (
        <>
          <FilterSection title="Kind of exchange" description="Swap homes at the same time, or stay with guest points.">
            <SegmentedFilter
              options={SWAP_KINDS}
              value={value.swapKind}
              onValueChange={(swapKind) => set({ swapKind })}
              accessibilityLabel="Kind of exchange"
            />
          </FilterSection>
          <Rooms value={value} set={set} />
          <FilterSection title="Features">
            <FeatureFilter value={value.features} onValueChange={(features) => set({ features })} />
          </FilterSection>
          <FilterSection title="Members" divider={false}>
            <SwitchFilterRow
              title="Verified members only"
              description="Homes and identities checked"
              value={value.verifiedOnly}
              onValueChange={(verifiedOnly) => set({ verifiedOnly })}
            />
          </FilterSection>
        </>
      );
  }
}

const MODE_LABEL: Record<HomeSearchMode, string> = {
  rent: 'Rental filters',
  buy: 'Sale filters',
  stays: 'Filters',
  swap: 'Swap filters',
};

export interface FiltersDialogProps {
  control: DialogControlProps;
  mode: HomeSearchMode;
  applied: Filters;
  onApply: (filters: Filters) => void;
}

/** The filters for the selected mode, in a centred dialog from `md` and a sheet below. */
export function FiltersDialog({ control, mode, applied, onApply }: FiltersDialogProps) {
  const [draft, setDraft] = useState(applied);
  const set: Set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // A mode switch (or an outside apply) resets the draft to what is applied.
  useEffect(() => {
    setDraft(applied);
  }, [applied, mode]);

  // Stand-in for refetching the result count while filters change.
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(draft);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [key]);

  return (
    <Dialog
      control={control}
      label={MODE_LABEL[mode]}
      header={{ title: MODE_LABEL[mode], largeTitle: false }}
      placement={{ base: 'bottom', md: 'center' }}
      maxWidth={780}
      scrollable={false}
      contentPadding={0}
      testID="housing-filters"
    >
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}>
        <FilterSections mode={mode} value={draft} set={set} />
      </ScrollView>
      <FilterFooter
        resultsLabel={filterResultsLabel(mode, draft)}
        loading={loading}
        clearDisabled={appliedFilterCount(mode, draft) === 0}
        onClear={() => setDraft(noFilters(mode))}
        onApply={() => {
          onApply(draft);
          control.close();
        }}
        testID="housing-filters-footer"
      />
    </Dialog>
  );
}
