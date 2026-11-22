import {
  HomeSearchBar,
  PropertyTypePicker,
  SavedSearchCard,
  SearchModeTabs,
} from '@oxy.so/bloom/home-search';
import { RiHome4Line } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const SEGMENTS = [
  { key: 'location', label: 'Location', placeholder: 'Search a city', flex: 2 },
  { key: 'moveIn', label: 'Move in', placeholder: 'Add date', value: 'Sep 1' },
  { key: 'budget', label: 'Budget', placeholder: 'Add budget' },
];

export const HOME_SEARCH_CASES: ParityCase[] = [
  {
    name: 'HomeSearchBar at rest',
    language: () =>
      toElement(L.HomeSearchBar(SEGMENTS, [null, set], { onSearch: press, searchLabel: 'Find' })),
    bloom: () => (
      <HomeSearchBar
        segments={SEGMENTS}
        activeSegment={null}
        onActiveSegmentChange={set}
        onSearch={press}
        searchLabel="Find"
      />
    ),
  },
  {
    name: 'HomeSearchBar with a segment open, its panel',
    language: () =>
      toElement(
        L.HomeSearchBar(SEGMENTS, ['budget', set], {
          onSearch: press,
          panel: L.Text('Budget panel'),
        }),
      ),
    bloom: () => (
      <HomeSearchBar
        segments={SEGMENTS}
        activeSegment="budget"
        onActiveSegmentChange={set}
        onSearch={press}
        panel={<Text>Budget panel</Text>}
      />
    ),
  },
  {
    name: 'SearchModeTabs',
    language: () => toElement(L.SearchModeTabs(['rent', set])),
    bloom: () => <SearchModeTabs value="rent" onValueChange={set} />,
  },
  ...ENUMS.searchModeTabsStyle.map((variant) => ({
    name: `SearchModeTabs ${variant}, its modes and words, named`,
    language: () =>
      toElement(
        L.SearchModeTabs(['buy', set], {
          modes: ['rent', 'buy'],
          labels: { buy: 'For sale' },
        })
          .style(variant)
          .label('Looking to'),
      ),
    bloom: () => (
      <SearchModeTabs
        value="buy"
        onValueChange={set}
        modes={['rent', 'buy']}
        labels={{ buy: 'For sale' }}
        variant={variant}
        accessibilityLabel="Looking to"
      />
    ),
  })),
  {
    name: 'PropertyTypePicker',
    language: () => toElement(L.PropertyTypePicker([['house'], set])),
    bloom: () => <PropertyTypePicker value={['house']} onValueChange={set} />,
  },
  {
    name: 'PropertyTypePicker in 2 columns, disabled, named',
    language: () =>
      toElement(
        L.PropertyTypePicker([['apartment', 'room'], set], { labels: { room: 'A room' } })
          .columns(2)
          .disabled()
          .label('Kind of home'),
      ),
    bloom: () => (
      <PropertyTypePicker
        value={['apartment', 'room']}
        onValueChange={set}
        labels={{ room: 'A room' }}
        columns={2}
        disabled
        accessibilityLabel="Kind of home"
      />
    ),
  },
  {
    name: 'SavedSearchCard',
    language: () =>
      toElement(
        L.SavedSearchCard('2-bed flats in Old Halden', {
          criteria: ['€800 – €1,200', '2+ bedrooms'],
          newCount: 3,
          alertFrequency: 'Daily alerts',
          onEdit: press,
          onDelete: press,
        }).onPress(press),
      ),
    bloom: () => (
      <SavedSearchCard
        title="2-bed flats in Old Halden"
        criteria={['€800 – €1,200', '2+ bedrooms']}
        newCount={3}
        alertFrequency="Daily alerts"
        onEdit={press}
        onDelete={press}
        onPress={press}
      />
    ),
  },
  {
    name: 'SavedSearchCard with its icon, alerts off',
    language: () =>
      toElement(
        L.SavedSearchCard('Houses near the coast', { icon: RiHome4Line, alertsOffLabel: 'Muted' }),
      ),
    bloom: () => (
      <SavedSearchCard title="Houses near the coast" icon={RiHome4Line} alertsOffLabel="Muted" />
    ),
  },
];

/**
 * The location segment open: its field takes focus as it mounts, so of two side
 * by side in Chrome only one holds it. Compared by Jest, left out of the story.
 */
export const HOME_SEARCH_CASES_FOCUSED: ParityCase[] = [
  {
    name: 'HomeSearchBar typing a location',
    language: () =>
      toElement(L.HomeSearchBar(SEGMENTS, ['location', set], { query: 'Lis', onQueryChange: set })),
    bloom: () => (
      <HomeSearchBar
        segments={SEGMENTS}
        activeSegment="location"
        onActiveSegmentChange={set}
        query="Lis"
        onQueryChange={set}
      />
    ),
  },
];
