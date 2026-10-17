/**
 * @jest-environment jsdom
 *
 * `PlacePicker` through the REAL react-native-web: the combobox wiring a
 * screen reader reads, the keyboard choosing a place, and "Change" giving the
 * field back. Assertions read emitted attributes, never props.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PlacePicker, type PlacePickerOption } from '../place-picker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PLACES: PlacePickerOption[] = [
  {
    id: 'a',
    title: 'Gran Vía 28',
    subtitle: 'Madrid',
    coordinate: { latitude: 40.42016, longitude: -3.70385 },
  },
  {
    id: 'b',
    title: 'Gran Via 585',
    subtitle: 'Barcelona',
    coordinate: { latitude: 41.38652, longitude: 2.16383 },
  },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function Harness({ onChoose }: { onChoose: (place: PlacePickerOption | null) => void }) {
  const [query, setQuery] = useState('');
  const [value, setValue] = useState<PlacePickerOption | null>(null);
  return (
    <PlacePicker
      label="Pickup address"
      query={query}
      onQueryChange={setQuery}
      results={query.length >= 3 ? PLACES : []}
      status="ready"
      value={value}
      onValueChange={(next) => {
        onChoose(next);
        setValue(next);
      }}
      testID="pp"
    />
  );
}

it('is a combobox whose arrows and Enter choose a place, and Change gives the field back', () => {
  const onChoose = jest.fn();
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Harness onChoose={onChoose} />
      </BloomThemeProvider>,
    );
  });

  const input = byTestId('pp-input') as HTMLInputElement;
  expect(input.getAttribute('role')).toBe('combobox');
  expect(input.getAttribute('aria-expanded')).toBe('false');

  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, 'gran');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const list = byTestId('pp-results');
  expect(list.getAttribute('role')).toBe('listbox');
  expect(input.getAttribute('aria-expanded')).toBe('true');
  expect(input.getAttribute('aria-controls')).toBe(list.id);
  expect(byTestId('pp-status').getAttribute('aria-live')).toBe('polite');
  expect(byTestId('pp-status').textContent).toBe('2 places');

  for (const k of ['ArrowDown', 'ArrowDown']) {
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
      );
    });
  }
  const active = byTestId('pp-result-b');
  expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
  expect(active.getAttribute('aria-selected')).toBe('true');

  act(() => {
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
  });
  expect(onChoose).toHaveBeenLastCalledWith(PLACES[1]);
  expect(byTestId('pp-selected').textContent).toContain('41.38652, 2.16383');

  act(() => {
    byTestId('pp-change').dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  });
  expect(onChoose).toHaveBeenLastCalledWith(null);
  expect(document.activeElement).toBe(byTestId('pp-input'));
});
