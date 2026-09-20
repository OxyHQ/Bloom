/**
 * @jest-environment jsdom
 *
 * `RouteStops` through the REAL react-native-web.
 *
 * What this file is FOR: the shape and the colour of a marker carry two facts
 * on screen — which stop it is, and how far the journey got — and neither of
 * them reaches a screen reader. So the announced name of every row is measured
 * here in full, and so is the rule that decides whether the swap control exists
 * at all, because "offered only for exactly two stops" is a claim a prop-level
 * test would pass by simply passing `onSwap`.
 */
import React, { useCallback, useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RouteStops, ROUTE_STOP_STATE_LABELS } from '../route-stops';
import { resolveAccentColors } from '../theme/accent-colors';
import { hairlineOn, resolveSurfaceLevel } from '../styles/surface-levels';
import type { RouteStop } from '../route-stops';
import {
  allByRole,
  byLabel,
  byTestId,
  click,
  css,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const PAIR: RouteStop[] = [
  { id: 'a', title: 'Carrer de l’Om 14', subtitle: 'Pick-up' },
  { id: 'b', title: 'Mercat de la Serra', subtitle: 'Drop-off' },
];

const JOURNEY: RouteStop[] = [
  { id: 'a', title: 'First', state: 'reached' },
  { id: 'b', title: 'Second', state: 'reached' },
  { id: 'c', title: 'Third', state: 'current' },
  { id: 'd', title: 'Fourth', state: 'pending' },
];

/**
 * Every stop's announced name, in document order — read from wherever the
 * ACCESSIBLE name actually lands: the `listitem` itself for a read-only stop,
 * the button inside it for a pressable one. Placement is asserted separately;
 * this helper only has to find it.
 */
function names(count: number, testID = 'r'): string[] {
  return Array.from({ length: count }, (_unused, index) => {
    const item = byTestId(`${testID}-${index}-item`);
    const own = item.getAttribute('aria-label');
    if (own !== null) return own;
    return item.querySelector('[role="button"]')?.getAttribute('aria-label') ?? '';
  });
}

describe('every row announces its position and its state before its text', () => {
  it('names origin, the stops between and the destination', () => {
    mount(<RouteStops stops={JOURNEY} testID="r" />);
    expect(names(4)).toEqual([
      'Origin, Reached, First',
      'Stop 2, Reached, Second',
      'Stop 3, Current stop, Third',
      'Destination, Not reached, Fourth',
    ]);
    expect(ROUTE_STOP_STATE_LABELS.pending).toBe('Not reached');
  });

  it('includes the subtitle and the meta, in reading order', () => {
    mount(<RouteStops stops={[{ id: 'a', title: 'First', subtitle: 'Third floor', meta: '09:12', state: 'reached' }]} testID="r" />);
    expect(names(1)).toEqual(['Origin, Reached, First, Third floor, 09:12']);
  });

  it('takes every word from `labels`, including the per-stop remove name', () => {
    mount(
      <RouteStops
        stops={JOURNEY}
        onRemoveStop={noop}
        onSwap={noop}
        onAddStop={noop}
        labels={{
          origin: 'Desde',
          destination: 'Hasta',
          stop: (position) => `Parada ${position}`,
          state: { reached: 'Hecha', current: 'Ahora', pending: 'Pendiente' },
          remove: (stop) => `Quitar ${stop.title}`,
          addStop: 'Añadir parada',
        }}
        testID="r"
      />,
    );
    expect(names(4)).toEqual([
      'Desde, Hecha, First',
      'Parada 2, Hecha, Second',
      'Parada 3, Ahora, Third',
      'Hasta, Pendiente, Fourth',
    ]);
    // The remove control names the stop it removes — "Remove" five times names
    // nothing, which is why the default is a function of the stop.
    expect(byLabel('Quitar Third')).not.toBeNull();
    expect(byTestId('r-add').textContent).toContain('Añadir parada');
  });

  it('puts the name on the CONTROL when there is one, and on the listitem when there is not', () => {
    mount(<RouteStops stops={PAIR} testID="r" />);
    // Read-only: `Item`'s non-pressable branch renders `role="none"`, so a name
    // left there would be on the one element assistive technology ignores.
    expect(byTestId('r-0-item').getAttribute('aria-label')).toBe('Origin, Not reached, Carrer de l\u2019Om 14, Pick-up');
    expect(byTestId('r-0-item').querySelector('[role="button"]')).toBeNull();
    mount(<RouteStops stops={PAIR} onPressStop={noop} testID="r" />);
    // Pressable: the button carries it, and the listitem carries nothing — the
    // stop is announced once, not twice.
    expect(byTestId('r-0-item').getAttribute('aria-label')).toBeNull();
    expect(
      byTestId('r-0-item').querySelector('[role="button"]')?.getAttribute('aria-label'),
    ).toBe('Origin, Not reached, Carrer de l\u2019Om 14, Pick-up');
  });

  it('lets a stop override its own announced name', () => {
    mount(<RouteStops stops={[{ id: 'a', title: 'First', accessibilityLabel: 'Where it starts' }]} testID="r" />);
    expect(names(1)).toEqual(['Where it starts']);
  });
});

describe('structure', () => {
  it('is one named list of stops', () => {
    mount(<RouteStops stops={JOURNEY} accessibilityLabel="Trip" testID="r" />);
    const list = byTestId('r-list');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Trip');
    expect(allByRole('listitem')).toHaveLength(4);
  });

  it('draws no tile — the marker column IS the gutter', () => {
    mount(<RouteStops stops={PAIR} testID="r" />);
    expect(queryTestId('r-0-row-tile')).toBeNull();
    expect(queryTestId('r-0-marker')).not.toBeNull();
  });

  it('keeps the swap and add controls OUTSIDE the list', () => {
    mount(<RouteStops stops={PAIR} onSwap={noop} onAddStop={noop} testID="r" />);
    const list = byTestId('r-list');
    expect(list.contains(byTestId('r-swap'))).toBe(false);
    expect(list.contains(byTestId('r-add'))).toBe(false);
  });
});

describe('the marker column', () => {
  it('makes the first stop a ring and the last a square', () => {
    mount(<RouteStops stops={PAIR} testID="r" />);
    const origin = getComputedStyle(byTestId('r-0-marker'));
    const destination = getComputedStyle(byTestId('r-1-marker'));
    expect(origin.borderTopWidth).toBe('3px');
    expect(origin.borderTopLeftRadius).toBe('6px');
    expect(destination.borderTopLeftRadius).toBe('3px');
  });

  it('makes the CURRENT stop bigger, because a halo inside an 8px dot is not a halo', () => {
    mount(<RouteStops stops={JOURNEY} testID="r" />);
    const reached = getComputedStyle(byTestId('r-1-marker'));
    const current = getComputedStyle(byTestId('r-2-marker'));
    const pending = getComputedStyle(byTestId('r-3-marker'));
    expect(reached.width).toBe('8px');
    expect(current.width).toBe('14px');
    expect(current.borderTopWidth).toBe('3px');
    expect(reached.borderTopWidth).toBe('0px');
    // …and a pending stop is hollow rather than merely smaller.
    expect(pending.borderTopWidth).toBe('1.5px');
    expect(pending.backgroundColor).not.toBe(reached.backgroundColor);
  });

  it('fills the rail behind the journey and leaves the rest neutral', () => {
    mount(<RouteStops stops={JOURNEY} testID="r" />);
    const accent = css(resolveAccentColors(theme().colors, 'primary', 'solid').background);
    const neutral = css(hairlineOn(theme(), resolveSurfaceLevel(theme(), 0).background));
    expect(accent).not.toBe(neutral);
    // Into stop 2 (reached) and into stop 3 (current): travelled.
    expect(getComputedStyle(byTestId('r-1-rail-in')).backgroundColor).toBe(accent);
    expect(getComputedStyle(byTestId('r-2-rail-in')).backgroundColor).toBe(accent);
    // Into stop 4 (pending): not.
    expect(getComputedStyle(byTestId('r-3-rail-in')).backgroundColor).toBe(neutral);
    // …and the two halves of one gap agree, which is what makes the line join.
    expect(getComputedStyle(byTestId('r-2-rail-out')).backgroundColor).toBe(neutral);
  });

  it('makes the outer ends transparent so every marker sits the same way', () => {
    mount(<RouteStops stops={JOURNEY} testID="r" />);
    expect(getComputedStyle(byTestId('r-0-rail-in')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(byTestId('r-3-rail-out')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('the controls', () => {
  function Planner() {
    const [stops, setStops] = useState<RouteStop[]>(PAIR);
    const swap = useCallback(() => setStops((s) => [s[1]!, s[0]!]), []);
    return <RouteStops stops={stops} onSwap={swap} testID="r" />;
  }

  it('offers swap for exactly two stops and for no other count', () => {
    mount(<RouteStops stops={PAIR} onSwap={noop} testID="r" />);
    expect(queryTestId('r-swap')).not.toBeNull();
    mount(<RouteStops stops={JOURNEY} onSwap={noop} testID="r" />);
    expect(queryTestId('r-swap')).toBeNull();
    mount(<RouteStops stops={[PAIR[0]!]} onSwap={noop} testID="r" />);
    expect(queryTestId('r-swap')).toBeNull();
  });

  it('swaps the two stops, which moves both the text and the announced position', () => {
    mount(<Planner />);
    expect(names(2)).toEqual([
      'Origin, Not reached, Carrer de l’Om 14, Pick-up',
      'Destination, Not reached, Mercat de la Serra, Drop-off',
    ]);
    click(byTestId('r-swap'));
    expect(names(2)).toEqual([
      'Origin, Not reached, Mercat de la Serra, Drop-off',
      'Destination, Not reached, Carrer de l’Om 14, Pick-up',
    ]);
  });

  it('draws add and remove only when a handler exists, and can cap adding', () => {
    mount(<RouteStops stops={PAIR} testID="r" />);
    expect(queryTestId('r-add')).toBeNull();
    expect(queryTestId('r-0-remove')).toBeNull();
    const removed: string[] = [];
    mount(<RouteStops stops={PAIR} onAddStop={noop} onRemoveStop={(id) => removed.push(id)} canAddStop={false} testID="r" />);
    expect(byTestId('r-add').getAttribute('disabled')).not.toBeNull();
    click(byTestId('r-1-remove'));
    expect(removed).toEqual(['b']);
  });

  it('presses a stop through the row', () => {
    const pressed: string[] = [];
    mount(<RouteStops stops={PAIR} onPressStop={(id) => pressed.push(id)} testID="r" />);
    click(byLabel('Destination, Not reached, Mercat de la Serra, Drop-off'));
    expect(pressed).toEqual(['b']);
  });

  it('draws a stop’s own action beside the remove control', () => {
    mount(
      <RouteStops
        stops={[{ id: 'a', title: 'First', action: <span data-testid="own">go</span> }]}
        onRemoveStop={noop}
        testID="r"
      />,
    );
    expect(queryTestId('own')).not.toBeNull();
    expect(queryTestId('r-0-remove')).not.toBeNull();
    expect(root$().textContent).toContain('go');
  });
});
