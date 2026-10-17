import type React from 'react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useTheme } from '../theme/use-theme';
import { PlacePicker } from './PlacePicker';
import type { PlacePickerOption, PlacePickerStatus } from './types';

const meta: Meta = {
  title: 'Blocks/Places/Place Picker',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;
type Story = StoryObj;

/** A stand-in for the app's own search — a fixed gazetteer, answered after a delay. */
const GAZETTEER: PlacePickerOption[] = [
  {
    id: 'gran-via-28',
    title: 'Gran Vía 28',
    subtitle: '28013 Madrid, Spain',
    coordinate: { latitude: 40.42016, longitude: -3.70385 },
  },
  {
    id: 'gran-via-cortes',
    title: 'Gran Via de les Corts Catalanes 585',
    subtitle: '08007 Barcelona, Spain',
    coordinate: { latitude: 41.38652, longitude: 2.16383 },
  },
  {
    id: 'plaza-mayor',
    title: 'Plaza Mayor',
    subtitle: 'Madrid, Spain',
    coordinate: { latitude: 40.41553, longitude: -3.70742 },
  },
  {
    id: 'rambla',
    title: 'La Rambla 91',
    subtitle: '08001 Barcelona, Spain',
    coordinate: { latitude: 41.38176, longitude: 2.17168 },
  },
];

function useFakeSearch(term: string, fail = false) {
  const [state, setState] = useState<{
    term: string;
    results: PlacePickerOption[];
    status: PlacePickerStatus;
  }>({
    term: '',
    results: [],
    status: 'idle',
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (term.length < 3) return;
    setState((current) => ({ ...current, term, status: 'loading' }));
    const timer = setTimeout(() => {
      if (fail) {
        setState({ term, results: [], status: 'error' });
        return;
      }
      const needle = term.toLowerCase();
      setState({
        term,
        results: GAZETTEER.filter((place) =>
          `${place.title} ${place.subtitle ?? ''}`.toLowerCase().includes(needle),
        ),
        status: 'ready',
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [term, fail, attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

function Page({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, minHeight: 480 }}>
      <View style={{ maxWidth: 480, gap: 20 }}>{children}</View>
    </View>
  );
}

function Picker({ initialQuery = '', fail = false, inField = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [place, setPlace] = useState<PlacePickerOption | null>(null);
  const term = useDebouncedValue(query.trim(), 250);
  const search = useFakeSearch(term, fail);
  const current = search.term === query.trim();
  const picker = (
    <PlacePicker
      label="Pickup address"
      query={query}
      onQueryChange={setQuery}
      results={current ? search.results : []}
      status={current ? search.status : 'loading'}
      onRetry={search.retry}
      value={place}
      onValueChange={setPlace}
      testID="place-picker"
    />
  );
  return inField ? (
    <Field label="Pickup" description="Where the courier collects the parcel.">
      {picker}
    </Field>
  ) : (
    picker
  );
}

/** Type "gran" — the list arrives after the debounce and the search. */
export const Basic: Story = {
  render: () => (
    <Page>
      <Picker />
    </Page>
  ),
};

/** Opened on a query that already has results. */
export const WithResults: Story = {
  render: () => (
    <Page>
      <Picker initialQuery="gran" />
    </Page>
  ),
};

/** The search failed: the status says so and offers a retry. */
export const Failure: Story = {
  render: () => (
    <Page>
      <Picker initialQuery="gran" fail />
    </Page>
  ),
};

/** Inside a `Field`: the field's label names the combobox and its description is attached. */
export const InField: Story = {
  render: () => (
    <Page>
      <Picker inField />
    </Page>
  ),
};
