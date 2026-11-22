import { PlaceCard } from '@oxy.so/bloom/place-card';
import { PlaceHours, PlaceInfoList, PlaceTransit } from '@oxy.so/bloom/place-details';
import { PlaceList, PlaceListCard } from '@oxy.so/bloom/place-list';
import { DirectionsSteps } from '@oxy.so/bloom/directions';
import { PlacePicker } from '@oxy.so/bloom/place-picker';
import { Badge } from '@oxy.so/bloom/badge';
import { Button } from '@oxy.so/bloom/button';
import {
  RiRouteLine,
  RiHeartLine,
  RiMapPinLine,
  RiPhoneLine,
  RiTimeLine,
} from '@oxy.so/bloom/icons';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { Themed, type ParityCase } from './support/cases';

const press = () => {};
const pressId = (_id: string) => {};
const favorite = (_favorite: boolean) => {};

const PLACE = {
  category: 'Bakery · €€',
  rating: 4.6,
  reviewCount: 318,
  openState: 'closing-soon' as const,
  hours: 'Closes 20:00',
  address: 'Carrer del Roure 4',
  facts: [{ icon: RiTimeLine, label: '12 min' }],
  figure: '12 min',
  figureLabel: 'Drive from you',
  figureDetail: '1.4 km',
  stats: [
    { value: '€€', label: 'Price' },
    { value: '318', label: 'Reviews' },
  ],
  actions: [
    { id: 'directions', label: 'Directions', icon: RiRouteLine, onPress: press },
    { id: 'call', label: 'Call', icon: RiPhoneLine, onPress: press },
  ],
  favorite: false,
  onFavoriteChange: favorite,
};

const DAYS = [
  { label: 'Monday', intervals: [{ open: '07:30', close: '14:00' }] },
  {
    label: 'Tuesday',
    intervals: [
      { open: '07:30', close: '14:00' },
      { open: '17:00', close: '20:00' },
    ],
    today: true,
  },
  { label: 'Wednesday', exception: 'Public holiday' },
];

const INFO = [
  {
    id: 'address',
    value: 'Carrer del Roure 4, 08001 Barcelona',
    label: 'Address',
    icon: RiMapPinLine,
    action: 'copy' as const,
    onPress: pressId,
  },
  {
    id: 'phone',
    value: '+34 932 000 000',
    label: 'Phone',
    icon: RiPhoneLine,
    action: 'call' as const,
    onPress: pressId,
  },
];

const L4 = { name: 'L4', color: '#f5c518' };
const STOPS = [
  {
    id: 'bruixes',
    name: 'Plaça de les Bruixes',
    mode: 'metro' as const,
    distance: '120 m · 2 min',
    lines: [L4],
    departures: [
      { id: 'd1', line: L4, headsign: 'Pla del Bosc', time: '4 min', realtime: true },
      { id: 'd2', line: L4, headsign: 'Pla del Bosc', time: '11 min' },
    ],
  },
  { id: 'om', name: 'Carrer de l’Om', distance: '300 m · 4 min', note: 'Step-free access' },
];

const PLACES = [
  {
    id: 'p1',
    place: { name: 'Forner de la Plaça', category: 'Bakery' },
    note: 'Sourdough before noon',
  },
  { id: 'p2', place: { name: 'Cafè del Mar', category: 'Café', rating: 4.2 } },
];

const LEGS = [
  {
    title: 'Walk to Plaça de les Bruixes',
    meta: '6 min · 450 m',
    mode: 'walk' as const,
    steps: [
      { id: 's1', instruction: 'Head north on Carrer del Roure', maneuver: 'depart' as const },
      {
        id: 's2',
        instruction: 'Turn right onto Carrer de l’Om',
        maneuver: 'right' as const,
        distance: '200 m',
      },
    ],
  },
  {
    title: 'Ride L4',
    mode: 'transit' as const,
    line: L4,
    steps: [
      {
        id: 's3',
        instruction: 'Board towards Pla del Bosc',
        maneuver: 'board' as const,
        detail: '3 stops',
        line: L4,
      },
    ],
  },
];

const OPTIONS = [
  {
    id: 'roure',
    title: 'Carrer del Roure 4',
    subtitle: 'Barcelona',
    coordinate: { latitude: 41.38, longitude: 2.17 },
  },
];
const setPlace = (_place: (typeof OPTIONS)[number] | null) => {};
const setQuery = (_query: string) => {};

const cards: ParityCase[] = [
  {
    name: 'PlaceCard',
    language: () => toElement(L.PlaceCard('Forner de la Plaça', { category: 'Bakery' })),
    bloom: () => <PlaceCard name="Forner de la Plaça" category="Bakery" />,
  },
  ...ENUMS.placeCardStyle.map((density) => ({
    name: `PlaceCard ${density}, every fact, a badge word`,
    language: () =>
      toElement(
        L.PlaceCard('Forner de la Plaça', { ...PLACE, badge: 'New' })
          .style(density)
          .onPress(press),
      ),
    bloom: () => (
      <PlaceCard
        name="Forner de la Plaça"
        {...PLACE}
        badge="New"
        density={density}
        onPress={press}
      />
    ),
  })),
  {
    name: 'PlaceCard with a badge view, named',
    language: () =>
      toElement(
        L.PlaceCard('Forner de la Plaça', { badge: L.Badge('Saved').tint('success') }).label(
          'Forner, saved',
        ),
      ),
    bloom: () => (
      <PlaceCard
        name="Forner de la Plaça"
        badge={<Badge content="Saved" tone="success" />}
        accessibilityLabel="Forner, saved"
      />
    ),
  },
  ...ENUMS.placeCardStyle.map((density) => ({
    name: `PlaceCard ${density} loading`,
    language: () => toElement(L.PlaceCard('Forner de la Plaça').style(density).loading()),
    bloom: () => <PlaceCard name="Forner de la Plaça" density={density} loading />,
  })),
];

const details: ParityCase[] = [
  {
    name: 'PlaceHours',
    language: () => toElement(L.PlaceHours(DAYS, { state: 'open', summary: 'Open until 20:00' })),
    bloom: () => <PlaceHours days={DAYS} state="open" summary="Open until 20:00" />,
  },
  {
    name: 'PlaceHours expanded, named',
    language: () =>
      toElement(
        L.PlaceHours(DAYS, {
          state: 'closed',
          summary: 'Opens 07:30',
          defaultExpanded: true,
        }).label('Hours'),
      ),
    bloom: () => (
      <PlaceHours
        days={DAYS}
        state="closed"
        summary="Opens 07:30"
        defaultExpanded
        accessibilityLabel="Hours"
      />
    ),
  },
  {
    name: 'PlaceInfoList',
    language: () =>
      toElement(L.PlaceInfoList(INFO, { title: 'Contact', footer: 'From the owner' })),
    bloom: () => <PlaceInfoList items={INFO} title="Contact" footer="From the owner" />,
  },
  {
    name: 'PlaceTransit',
    language: () => toElement(L.PlaceTransit(STOPS, { onPressStop: pressId })),
    bloom: () => <PlaceTransit stops={STOPS} onPressStop={pressId} />,
  },
  {
    name: 'PlaceTransit with a footer, a limit, named',
    language: () =>
      toElement(
        L.PlaceTransit(STOPS, {
          departureLimit: 1,
          footer: L.Button(L.Text('All stops')).style('plain').onPress(press),
        }).label('Transit'),
      ),
    bloom: () => (
      <PlaceTransit
        stops={STOPS}
        departureLimit={1}
        footer={
          <Button appearance="plain" onPress={press}>
            All stops
          </Button>
        }
        accessibilityLabel="Transit"
      />
    ),
  },
];

const lists: ParityCase[] = [
  {
    name: 'PlaceListCard',
    language: () => toElement(L.PlaceListCard('Want to go', { count: 12 }).onPress(press)),
    bloom: () => <PlaceListCard name="Want to go" count={12} onPress={press} />,
  },
  {
    name: 'PlaceListCard shared, tinted, empty',
    language: () =>
      toElement(
        L.PlaceListCard('Coffee, ranked', {
          count: 0,
          icon: RiHeartLine,
          visibility: 'shared',
          collaborators: [{ name: 'Ana Lima' }, { name: 'Joan Puig' }],
          empty: L.Text('No places yet'),
        }).tint('primary'),
      ),
    bloom: () => (
      <Themed>
        {(colors) => (
          <PlaceListCard
            name="Coffee, ranked"
            count={0}
            icon={RiHeartLine}
            visibility="shared"
            collaborators={[{ name: 'Ana Lima' }, { name: 'Joan Puig' }]}
            empty={L.toElement(L.Text('No places yet'))}
            color={colors.primary}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'PlaceList',
    language: () => toElement(L.PlaceList(PLACES)),
    bloom: () => <PlaceList places={PLACES} />,
  },
  {
    name: 'PlaceList reorderable, removable, disabled, named',
    language: () =>
      toElement(
        L.PlaceList(PLACES, { onReorder: () => {}, onRemove: pressId })
          .disabled()
          .label('Saved'),
      ),
    bloom: () => (
      <PlaceList
        places={PLACES}
        onReorder={() => {}}
        onRemove={pressId}
        disabled
        accessibilityLabel="Saved"
      />
    ),
  },
  {
    name: 'PlaceList empty',
    language: () => toElement(L.PlaceList([], { empty: L.Text('Nothing saved') })),
    bloom: () => <PlaceList places={[]} empty={L.toElement(L.Text('Nothing saved'))} />,
  },
];

const directions: ParityCase[] = [
  {
    name: 'DirectionsSteps',
    language: () => toElement(L.DirectionsSteps(LEGS, { currentStepId: 's2' })),
    bloom: () => <DirectionsSteps legs={LEGS} currentStepId="s2" />,
  },
  ...ENUMS.directionsDensity.map((density) => ({
    name: `DirectionsSteps ${density}, pressable, named`,
    language: () =>
      toElement(L.DirectionsSteps(LEGS, { onPressStep: pressId }).size(density).label('Route')),
    bloom: () => (
      <DirectionsSteps
        legs={LEGS}
        onPressStep={pressId}
        density={density}
        accessibilityLabel="Route"
      />
    ),
  })),
];

const pickers: ParityCase[] = [
  {
    name: 'PlacePicker',
    language: () =>
      toElement(L.PlacePicker('Address', [null, setPlace], ['', setQuery], { results: [] })),
    bloom: () => (
      <PlacePicker
        label="Address"
        value={null}
        onValueChange={setPlace}
        query=""
        onQueryChange={setQuery}
        results={[]}
      />
    ),
  },
  {
    name: 'PlacePicker with results',
    language: () =>
      toElement(
        L.PlacePicker('Address', [null, setPlace], ['Carrer', setQuery], { results: OPTIONS }),
      ),
    bloom: () => (
      <PlacePicker
        label="Address"
        value={null}
        onValueChange={setPlace}
        query="Carrer"
        onQueryChange={setQuery}
        results={OPTIONS}
      />
    ),
  },
  {
    name: 'PlacePicker chosen',
    language: () =>
      toElement(L.PlacePicker('Address', [OPTIONS[0]!, setPlace], ['', setQuery], { results: [] })),
    bloom: () => (
      <PlacePicker
        label="Address"
        value={OPTIONS[0]!}
        onValueChange={setPlace}
        query=""
        onQueryChange={setQuery}
        results={[]}
      />
    ),
  },
  ...(['loading', 'error'] as const).map((status) => ({
    name: `PlacePicker ${status}`,
    language: () =>
      toElement(
        L.PlacePicker('Address', [null, setPlace], ['Carrer', setQuery], {
          results: [],
          status,
          onRetry: press,
        }),
      ),
    bloom: () => (
      <PlacePicker
        label="Address"
        value={null}
        onValueChange={setPlace}
        query="Carrer"
        onQueryChange={setQuery}
        results={[]}
        status={status}
        onRetry={press}
      />
    ),
  })),
  ...ENUMS.controlSize.map((size) => ({
    name: `PlacePicker ${size}, disabled, named`,
    language: () =>
      toElement(
        L.PlacePicker('Address', [null, setPlace], ['', setQuery], {
          results: [],
          placeholder: 'Search',
        })
          .size(size)
          .disabled()
          .label('Delivery address'),
      ),
    bloom: () => (
      <PlacePicker
        label="Address"
        value={null}
        onValueChange={setPlace}
        query=""
        onQueryChange={setQuery}
        results={[]}
        placeholder="Search"
        size={size}
        disabled
        accessibilityLabel="Delivery address"
      />
    ),
  })),
];

export const PLACE_CASES: ParityCase[] = [
  ...cards,
  ...details,
  ...lists,
  ...directions,
  ...pickers,
];
