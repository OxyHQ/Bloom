import { RiParkingBoxLine, RiWifiLine } from '@oxy.so/bloom/icons';
import {
  AmenityFilter,
  AreaRangeFilter,
  AvailabilityFilter,
  CountFilter,
  FeatureFilter,
  FilterFooter,
  FilterSection,
  FilterTriggerButton,
  FloorFilter,
  PriceRangeFilter,
  SwitchFilterRow,
  ToggleChipGroup,
} from '@oxy.so/bloom/stay-filters';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const press = () => {};
const BUCKETS = [2, 5, 9, 14, 11, 7, 4, 2, 1, 1];
const CHIPS = [
  { value: 'wifi', label: 'Wifi', icon: RiWifiLine },
  { value: 'parking', label: 'Parking', icon: RiParkingBoxLine },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'washer', label: 'Washer', disabled: true },
];
const AMENITIES = [
  ...CHIPS,
  { value: 'dryer', label: 'Dryer' },
  { value: 'heating', label: 'Heating' },
  { value: 'tv', label: 'TV' },
  { value: 'gym', label: 'Gym' },
];
const DAY = new Date(2026, 9, 12);

const sections: ParityCase[] = [
  {
    name: 'FilterSection',
    language: () => toElement(L.FilterSection('Price range', L.Text('Any price'))),
    bloom: () => (
      <FilterSection title="Price range">{toElement(L.Text('Any price'))}</FilterSection>
    ),
  },
  {
    name: 'FilterSection with a description, no divider, named',
    language: () =>
      toElement(
        L.FilterSection('Rooms', L.Text('Any'), { description: 'Bedrooms and beds' })
          .dividers(false)
          .label('Rooms and beds'),
      ),
    bloom: () => (
      <FilterSection
        title="Rooms"
        description="Bedrooms and beds"
        divider={false}
        accessibilityLabel="Rooms and beds"
      >
        {toElement(L.Text('Any'))}
      </FilterSection>
    ),
  },
  {
    name: 'FilterFooter',
    language: () =>
      toElement(L.FilterFooter('Show 1,000+ places', { onApply: press, onClear: press })),
    bloom: () => <FilterFooter resultsLabel="Show 1,000+ places" onApply={press} onClear={press} />,
  },
  {
    name: 'FilterFooter loading, nothing to clear',
    language: () =>
      toElement(
        L.FilterFooter('Show 12 places', {
          onApply: press,
          onClear: press,
          clearDisabled: true,
          clearLabel: 'Reset',
        }).loading(),
      ),
    bloom: () => (
      <FilterFooter
        resultsLabel="Show 12 places"
        onApply={press}
        onClear={press}
        clearDisabled
        clearLabel="Reset"
        loading
      />
    ),
  },
  {
    name: 'FilterFooter, apply disabled',
    language: () =>
      toElement(
        L.FilterFooter('No places', { onApply: press, onClear: press, applyDisabled: true }),
      ),
    bloom: () => (
      <FilterFooter resultsLabel="No places" onApply={press} onClear={press} applyDisabled />
    ),
  },
  ...[0, 3].map((count) => ({
    name: `FilterTriggerButton, ${count} applied`,
    language: () => toElement(L.FilterTriggerButton(count).onPress(press)),
    bloom: () => <FilterTriggerButton count={count} onPress={press} />,
  })),
  ...ENUMS.filterTriggerSize.map((size) => ({
    name: `FilterTriggerButton ${size}`,
    language: () => toElement(L.FilterTriggerButton(2).size(size).onPress(press)),
    bloom: () => <FilterTriggerButton count={2} size={size} onPress={press} />,
  })),
  {
    name: 'FilterTriggerButton disabled, its own words, named',
    language: () =>
      toElement(
        L.FilterTriggerButton(1, { label: 'Refine' })
          .disabled()
          .label('Refine, 1 applied')
          .onPress(press),
      ),
    bloom: () => (
      <FilterTriggerButton
        count={1}
        label="Refine"
        disabled
        accessibilityLabel="Refine, 1 applied"
        onPress={press}
      />
    ),
  },
];

const ranges: ParityCase[] = [
  ...ENUMS.priceScale.map((scale) => ({
    name: `PriceRangeFilter ${scale}`,
    language: () =>
      toElement(
        L.PriceRangeFilter([[80, 420], set], { min: 20, max: 1000, buckets: BUCKETS }).style(scale),
      ),
    bloom: () => (
      <PriceRangeFilter
        min={20}
        max={1000}
        buckets={BUCKETS}
        value={[80, 420]}
        onValueChange={set}
        scale={scale}
      />
    ),
  })),
  {
    name: 'PriceRangeFilter, no histogram, disabled, named',
    language: () =>
      toElement(
        L.PriceRangeFilter([[0, 500], set], {
          min: 0,
          max: 500,
          formatPrice: (n) => `€${n}`,
          minLabel: 'From',
          maxLabel: 'To',
        })
          .disabled()
          .label('Nightly price'),
      ),
    bloom: () => (
      <PriceRangeFilter
        min={0}
        max={500}
        value={[0, 500]}
        onValueChange={set}
        formatPrice={(n) => `€${n}`}
        minLabel="From"
        maxLabel="To"
        disabled
        accessibilityLabel="Nightly price"
      />
    ),
  },
  {
    name: 'PriceRangeFilter, a 48 histogram',
    language: () =>
      toElement(
        L.PriceRangeFilter([[100, 300], set], {
          min: 0,
          max: 1000,
          buckets: BUCKETS,
          histogramHeight: '48',
        }),
      ),
    bloom: () => (
      <PriceRangeFilter
        min={0}
        max={1000}
        buckets={BUCKETS}
        value={[100, 300]}
        onValueChange={set}
        histogramHeight={48}
      />
    ),
  },
  {
    name: 'AreaRangeFilter',
    language: () => toElement(L.AreaRangeFilter([[null, 120], set])),
    bloom: () => <AreaRangeFilter value={[null, 120]} onValueChange={set} />,
  },
  {
    name: 'AreaRangeFilter with its slider, disabled, named',
    language: () =>
      toElement(
        L.AreaRangeFilter([[40, 200], set], { slider: true, min: 20, max: 300, step: 10 })
          .disabled()
          .label('Floor area'),
      ),
    bloom: () => (
      <AreaRangeFilter
        value={[40, 200]}
        onValueChange={set}
        slider
        min={20}
        max={300}
        step={10}
        disabled
        accessibilityLabel="Floor area"
      />
    ),
  },
];

const choices: ParityCase[] = [
  ...[null, 3].map((count) => ({
    name: `CountFilter ${count ?? 'any'}`,
    language: () => toElement(L.CountFilter('Bedrooms', [count, set])),
    bloom: () => <CountFilter title="Bedrooms" value={count} onValueChange={set} />,
  })),
  {
    name: 'CountFilter 1 to 5, disabled, named',
    language: () =>
      toElement(
        L.CountFilter('Beds', [5, set], { min: 1, max: 5, anyLabel: 'Whatever' })
          .disabled()
          .label('Number of beds'),
      ),
    bloom: () => (
      <CountFilter
        title="Beds"
        value={5}
        onValueChange={set}
        min={1}
        max={5}
        anyLabel="Whatever"
        disabled
        accessibilityLabel="Number of beds"
      />
    ),
  },
  {
    name: 'ToggleChipGroup',
    language: () => toElement(L.ToggleChipGroup(CHIPS, [['wifi'], set]).label('Essentials')),
    bloom: () => (
      <ToggleChipGroup
        options={CHIPS}
        value={['wifi']}
        onValueChange={set}
        accessibilityLabel="Essentials"
      />
    ),
  },
  {
    name: 'ToggleChipGroup disabled',
    language: () =>
      toElement(
        L.ToggleChipGroup(CHIPS, [['parking'], set])
          .label('Essentials')
          .disabled(),
      ),
    bloom: () => (
      <ToggleChipGroup
        options={CHIPS}
        value={['parking']}
        onValueChange={set}
        accessibilityLabel="Essentials"
        disabled
      />
    ),
  },
  {
    name: 'AmenityFilter folded',
    language: () =>
      toElement(
        L.AmenityFilter(AMENITIES, [['kitchen'], set], { collapsedCount: 4 }).label('Amenities'),
      ),
    bloom: () => (
      <AmenityFilter
        options={AMENITIES}
        value={['kitchen']}
        onValueChange={set}
        collapsedCount={4}
        accessibilityLabel="Amenities"
      />
    ),
  },
  {
    name: 'AmenityFilter expanded, its own words, disabled',
    language: () =>
      toElement(
        L.AmenityFilter(AMENITIES, [[], set], {
          defaultExpanded: true,
          showLessLabel: 'Fewer',
        })
          .label('Amenities')
          .disabled(),
      ),
    bloom: () => (
      <AmenityFilter
        options={AMENITIES}
        value={[]}
        onValueChange={set}
        defaultExpanded
        showLessLabel="Fewer"
        accessibilityLabel="Amenities"
        disabled
      />
    ),
  },
  ...[false, true].map((on) => ({
    name: `SwitchFilterRow ${on ? 'on' : 'off'}`,
    language: () => toElement(L.SwitchFilterRow('Instant book', [on, set])),
    bloom: () => <SwitchFilterRow title="Instant book" value={on} onValueChange={set} />,
  })),
  {
    name: 'SwitchFilterRow with a description, disabled, named',
    language: () =>
      toElement(
        L.SwitchFilterRow('Self check-in', [true, set], { description: 'Lockbox or keypad' })
          .disabled()
          .label('Self check-in only'),
      ),
    bloom: () => (
      <SwitchFilterRow
        title="Self check-in"
        description="Lockbox or keypad"
        value
        onValueChange={set}
        disabled
        accessibilityLabel="Self check-in only"
      />
    ),
  },
  {
    name: 'AvailabilityFilter now',
    language: () => toElement(L.AvailabilityFilter([true, set], [null, set])),
    bloom: () => (
      <AvailabilityFilter availableNow onAvailableNowChange={set} date={null} onDateChange={set} />
    ),
  },
  {
    name: 'AvailabilityFilter from a day, its own words, disabled',
    language: () =>
      toElement(
        L.AvailabilityFilter([false, set], [DAY, set], {
          dateLabel: 'Move in from',
          locale: 'en-GB',
        }).disabled(),
      ),
    bloom: () => (
      <AvailabilityFilter
        availableNow={false}
        onAvailableNowChange={set}
        date={DAY}
        onDateChange={set}
        dateLabel="Move in from"
        locale="en-GB"
        disabled
      />
    ),
  },
  ...ENUMS.featureFilterStyle.map((variant) => ({
    name: `FeatureFilter ${variant}`,
    language: () => toElement(L.FeatureFilter([['parking', 'pool'], set]).style(variant)),
    bloom: () => (
      <FeatureFilter value={['parking', 'pool']} onValueChange={set} variant={variant} />
    ),
  })),
  {
    name: 'FeatureFilter of its own choices, relabelled, disabled, named',
    language: () =>
      toElement(
        L.FeatureFilter([['wifi'], set], { choices: CHIPS, labels: { kitchen: 'Cooking' } })
          .disabled()
          .label('Extras'),
      ),
    bloom: () => (
      <FeatureFilter<string>
        options={CHIPS}
        labels={{ kitchen: 'Cooking' }}
        value={['wifi']}
        onValueChange={set}
        disabled
        accessibilityLabel="Extras"
      />
    ),
  },
  {
    name: 'FloorFilter',
    language: () => toElement(L.FloorFilter([['top'], set])),
    bloom: () => <FloorFilter value={['top']} onValueChange={set} />,
  },
  {
    name: 'FloorFilter relabelled, disabled, named',
    language: () =>
      toElement(
        L.FloorFilter([[], set], { labels: { ground: 'Street level' } })
          .disabled()
          .label('Which floor'),
      ),
    bloom: () => (
      <FloorFilter
        value={[]}
        onValueChange={set}
        labels={{ ground: 'Street level' }}
        disabled
        accessibilityLabel="Which floor"
      />
    ),
  },
];

export const STAY_FILTER_CASES: ParityCase[] = [...sections, ...ranges, ...choices];
