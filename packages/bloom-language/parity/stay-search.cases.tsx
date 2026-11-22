import { RiFilter3Line, RiTimeLine } from '@oxy.so/bloom/icons';
import {
  DestinationSuggestions,
  GuestPicker,
  StaySearchCompact,
  StaySearchPanel,
  StaySearchStep,
} from '@oxy.so/bloom/stay-search';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const GUESTS = { adults: 2, children: 1, infants: 0, pets: 1 };
const PLACES = [
  { id: 'lisbon', title: 'Lisbon', description: 'Portugal' },
  { id: 'recent', title: 'Porto', description: 'Last week', icon: RiTimeLine },
  {
    id: 'here',
    title: 'Use my location',
    disabled: true,
    disabledReason: 'Location is off',
  },
];

export const STAY_SEARCH_CASES: ParityCase[] = [
  {
    name: 'StaySearchCompact',
    language: () => toElement(L.StaySearchCompact().onPress(press)),
    bloom: () => <StaySearchCompact onPress={press} />,
  },
  {
    name: 'StaySearchCompact with a summary and filters, named',
    language: () =>
      toElement(
        L.StaySearchCompact({
          title: 'Lisbon',
          summary: 'Oct 12 – 16 · 3 guests',
          onFilterPress: press,
          filterIcon: RiFilter3Line,
          filterLabel: 'Refine',
        })
          .label('Search Lisbon')
          .onPress(press),
      ),
    bloom: () => (
      <StaySearchCompact
        title="Lisbon"
        summary="Oct 12 – 16 · 3 guests"
        onFilterPress={press}
        filterIcon={RiFilter3Line}
        filterLabel="Refine"
        accessibilityLabel="Search Lisbon"
        onPress={press}
      />
    ),
  },
  {
    name: 'StaySearchPanel',
    language: () => toElement(L.StaySearchPanel(L.Text('Anywhere'))),
    bloom: () => <StaySearchPanel>{toElement(L.Text('Anywhere'))}</StaySearchPanel>,
  },
  {
    name: 'StaySearchPanel 320 wide, 24 padding, named',
    language: () =>
      toElement(
        L.StaySearchPanel(L.Text('Anywhere'), { width: '320', padding: '2xl' }).label('Where'),
      ),
    bloom: () => (
      <StaySearchPanel width={320} padding={24} accessibilityLabel="Where">
        {toElement(L.Text('Anywhere'))}
      </StaySearchPanel>
    ),
  },
  ...[false, true].map((expanded) => ({
    name: `StaySearchStep ${expanded ? 'expanded' : 'collapsed'}`,
    language: () =>
      toElement(
        L.StaySearchStep('Where', L.Text('Search destinations'), {
          expanded,
          summary: "I'm flexible",
          title: 'Where to?',
        }).onPress(press),
      ),
    bloom: () => (
      <StaySearchStep
        label="Where"
        summary="I'm flexible"
        title="Where to?"
        expanded={expanded}
        onPress={press}
      >
        {toElement(L.Text('Search destinations'))}
      </StaySearchStep>
    ),
  })),
  {
    name: 'DestinationSuggestions',
    language: () => toElement(L.DestinationSuggestions(PLACES, { onSelect: set })),
    bloom: () => <DestinationSuggestions items={PLACES} onSelect={set} />,
  },
  {
    name: 'DestinationSuggestions with a heading and a highlight, named',
    language: () =>
      toElement(
        L.DestinationSuggestions(PLACES, {
          onSelect: set,
          heading: 'Suggested destinations',
          highlightedIndex: 1,
          onHighlightedIndexChange: set,
        }).label('Places'),
      ),
    bloom: () => (
      <DestinationSuggestions
        items={PLACES}
        onSelect={set}
        heading="Suggested destinations"
        highlightedIndex={1}
        onHighlightedIndexChange={set}
        accessibilityLabel="Places"
      />
    ),
  },
  {
    name: 'GuestPicker',
    language: () => toElement(L.GuestPicker([GUESTS, set])),
    bloom: () => <GuestPicker value={GUESTS} onChange={set} />,
  },
  ...ENUMS.guestPickerSize.map((size) => ({
    name: `GuestPicker ${size}, two kinds, a note, closable`,
    language: () =>
      toElement(
        L.GuestPicker([GUESTS, set], {
          kinds: ['adults', 'children'],
          maxGuests: 4,
          note: L.Text('At most 4 guests'),
          onClose: press,
          labels: { adults: 'Grown-ups' },
        }).size(size),
      ),
    bloom: () => (
      <GuestPicker
        value={GUESTS}
        onChange={set}
        kinds={['adults', 'children']}
        maxGuests={4}
        note={toElement(L.Text('At most 4 guests'))}
        onClose={press}
        labels={{ adults: 'Grown-ups' }}
        size={size}
      />
    ),
  })),
];
