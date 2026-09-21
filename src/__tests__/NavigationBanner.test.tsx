/**
 * @jest-environment jsdom
 *
 * The guidance surfaces, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: what each one announces, which glyph it
 * draws, which tone it paints, and what it does when the route is gone.
 *
 * Two things are NOT assertable here and are named rather than faked:
 * `fontVariant: ['tabular-nums']` reaches react-native-web and jsdom's CSS
 * parser drops it (a real browser keeps it), and the glass island's blur is an
 * `expo-blur` mock. Both are browser checks.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { DIRECTIONS_MANEUVER_ICON } from '../directions/maneuvers';
import { DIRECTIONS_MANEUVER_LABELS } from '../directions/constants';
import {
  ArrivalBar,
  LaneGuidance,
  NAVIGATION_BANNER_GEOMETRY,
  NAVIGATION_STATE_TONE,
  NavigationBanner,
  SpeedLimitPill,
  describeArrival,
  describeLanes,
  describeNavigationBanner,
  describeSpeedLimit,
} from '../navigation-banner';
import { resolveNavigationPaint } from '../navigation-banner/shared';
import type { NavigationLane } from '../navigation-banner/types';
import { resolveAccentColors } from '../theme/accent-colors';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function query(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"], [testid="${id}"]`);
}

function byTestId(id: string): HTMLElement {
  const el = query(id);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function pathOf(el: Element | null): string | null {
  return el?.querySelector('path')?.getAttribute('d') ?? null;
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

/** The `d` a `directions` glyph draws, rendered on its own for comparison. */
function glyphPath(maneuver: keyof typeof DIRECTIONS_MANEUVER_ICON): string {
  const Icon = DIRECTIONS_MANEUVER_ICON[maneuver];
  const probe = document.createElement('div');
  document.body.appendChild(probe);
  const probeRoot = createRoot(probe);
  act(() => {
    probeRoot.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Icon width={40} height={40} fill="#000" />
      </BloomThemeProvider>,
    );
  });
  const d = probe.querySelector('path')!.getAttribute('d')!;
  act(() => probeRoot.unmount());
  probe.remove();
  return d;
}

// ---------------------------------------------------------------------------
//  NavigationBanner
// ---------------------------------------------------------------------------

describe('NavigationBanner', () => {
  it('draws the distance as the figure and the street under it', () => {
    mount(
      <NavigationBanner maneuver="right" distance="400 m" instruction="Carrer del Roure" testID="b" />,
    );
    expect(byTestId('b-headline').textContent).toBe('400 m');
    expect(byTestId('b-instruction').textContent).toBe('Carrer del Roure');
    expect(byTestId('b-headline').style.fontSize).toBe('20px');
    expect(byTestId('b-instruction').style.fontSize).toBe('16px');
  });

  it('promotes the street to the figure rung when there is no distance', () => {
    mount(<NavigationBanner maneuver="arrive" instruction="Plaça de les Bruixes" testID="b" />);
    expect(query('b-headline')).toBeNull();
    expect(byTestId('b-instruction').style.fontSize).toBe('20px');
  });

  it('draws `directions`’ OWN maneuver glyph, not a second set', () => {
    mount(<NavigationBanner maneuver="roundabout" instruction="Ronda del Nord" testID="b" />);
    expect(pathOf(byTestId('b-glyph'))).toBe(glyphPath('roundabout'));
    mount(<NavigationBanner maneuver="uturn" instruction="Ronda del Nord" testID="b" />);
    expect(pathOf(byTestId('b-glyph'))).toBe(glyphPath('uturn'));
  });

  it('sizes the glyph tile so it is readable without focusing', () => {
    mount(<NavigationBanner maneuver="right" instruction="X" testID="b" />);
    expect(byTestId('b-glyph').style.width).toBe(`${NAVIGATION_BANNER_GEOMETRY.glyph}px`);
    expect(byTestId('b-glyph').querySelector('svg')!.getAttribute('width')).toBe(
      String(NAVIGATION_BANNER_GEOMETRY.glyphIcon),
    );
  });

  it('draws the following maneuver behind a rule, and nothing when there is none', () => {
    mount(
      <NavigationBanner maneuver="right" distance="400 m" instruction="A" thenManeuver="left" then="onto B" testID="b" />,
    );
    expect(byTestId('b-then').textContent).toBe('then turn left onto B');
    expect(byTestId('b-then').style.borderTopWidth).toBe('1px');
    expect(pathOf(byTestId('b-then'))).toBe(glyphPath('left'));

    mount(<NavigationBanner maneuver="right" distance="400 m" instruction="A" testID="b" />);
    expect(query('b-then')).toBeNull();
  });

  it('puts children behind a second rule, OUTSIDE the announcement', () => {
    mount(
      <NavigationBanner maneuver="right" instruction="A" testID="b">
        <SpeedLimitPill limit="50" testID="sp" />
      </NavigationBanner>,
    );
    expect(byTestId('b-extras').style.borderTopWidth).toBe('1px');
    // The pill carries its own name, so it must not be swallowed by the
    // banner's `aria-hidden` block.
    expect(byTestId('b-guidance').contains(byTestId('sp'))).toBe(false);
    expect(byTestId('sp').getAttribute('aria-label')).toBe('Speed limit 50');

    mount(<NavigationBanner maneuver="right" instruction="A" testID="b" />);
    expect(query('b-extras')).toBeNull();
  });

  it('is one utterance, with the drawn text hidden so nothing is read twice', () => {
    mount(
      <NavigationBanner maneuver="right" distance="400 m" instruction="Carrer del Roure" thenManeuver="left" then="onto Om" testID="b" />,
    );
    const guidance = byTestId('b-guidance');
    expect(guidance.getAttribute('role')).toBe('img');
    expect(guidance.getAttribute('aria-label')).toBe(
      '400 m, Turn right, Carrer del Roure, then turn left onto Om',
    );
    expect(guidance.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });

  it('names the maneuver aloud — the glyph says it and says nothing', () => {
    // Every maneuver in the vocabulary has a word, so a banner can never
    // announce an arrow nobody can see.
    for (const maneuver of Object.keys(DIRECTIONS_MANEUVER_ICON) as (keyof typeof DIRECTIONS_MANEUVER_ICON)[]) {
      expect(
        describeNavigationBanner({ maneuver, instruction: 'X' }),
      ).toContain(DIRECTIONS_MANEUVER_LABELS[maneuver]);
    }
  });

  it.each(['off-route', 'rerouting'] as const)('stops claiming the maneuver when %s', (state) => {
    mount(<NavigationBanner state={state} maneuver="right" instruction="Head back" testID="b" />);
    const label = byTestId('b-guidance').getAttribute('aria-label')!;
    expect(label).not.toContain('Turn right');
    expect(label).toContain('Head back');
    expect(pathOf(byTestId('b-glyph'))).not.toBe(glyphPath('right'));
  });

  it('says off route, and is finding a new one', () => {
    mount(<NavigationBanner state="off-route" maneuver="right" instruction="Head back" testID="b" />);
    expect(byTestId('b-headline').textContent).toBe('Off route');
    mount(<NavigationBanner state="rerouting" maneuver="right" instruction="Keep going" testID="b" />);
    expect(byTestId('b-headline').textContent).toBe('Finding a new route');
  });

  it.each(['off-route', 'rerouting'] as const)('paints %s in its own tone', (state) => {
    const theme = buildTheme('teal', 'light');
    mount(<NavigationBanner state={state} maneuver="right" instruction="X" testID="b" />);
    const expected = resolveAccentColors(theme.colors, NAVIGATION_STATE_TONE[state], 'subtle');
    expect(normalise(byTestId('b-glyph').style.backgroundColor)).toBe(
      normalise(expected.background),
    );
  });

  it('keeps rerouting OFF the error tone — nothing is wrong while it works', () => {
    expect(NAVIGATION_STATE_TONE.rerouting).toBe('warning');
    expect(NAVIGATION_STATE_TONE['off-route']).toBe('error');
  });

  it('takes the caller words', () => {
    mount(
      <NavigationBanner
        state="off-route"
        maneuver="right"
        instruction="Torna enrere"
        labels={{ offRoute: 'Fora de ruta' }}
        testID="b"
      />,
    );
    expect(byTestId('b-headline').textContent).toBe('Fora de ruta');
  });
});

// ---------------------------------------------------------------------------
//  LaneGuidance
// ---------------------------------------------------------------------------

describe('LaneGuidance', () => {
  const LANES: NavigationLane[] = [
    { directions: ['left'] },
    { directions: ['straight', 'right'], allowed: true, preferred: 'right' },
    { directions: ['right'], allowed: true },
  ];

  it('tints the lanes you may use and leaves the rest bare', () => {
    const theme = buildTheme('teal', 'light');
    const tint = resolveAccentColors(theme.colors, 'primary', 'subtle');
    mount(<LaneGuidance lanes={LANES} testID="l" />);
    // jsdom serialises `transparent` as the computed `rgba(0, 0, 0, 0)`.
    expect(normalise(byTestId('l-lane-0').style.backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    expect(normalise(byTestId('l-lane-1').style.backgroundColor)).toBe(normalise(tint.background));
  });

  it('draws the ARROW you want at full strength and its siblings quiet', () => {
    const theme = buildTheme('teal', 'light');
    const accent = resolveAccentColors(theme.colors, 'primary', 'subtle').foreground;
    const quiet = resolveNavigationPaint(theme).textGraphical;
    mount(<LaneGuidance lanes={LANES} testID="l" />);
    const arrows = Array.from(byTestId('l-lane-1').querySelectorAll('path'));
    expect(arrows).toHaveLength(2);
    const fills = arrows.map((p) => normalise(p.getAttribute('fill')!));
    expect(fills).toEqual([normalise(quiet), normalise(accent)]);
    // Nothing in a lane you may not use is ever at full strength.
    expect(
      Array.from(byTestId('l-lane-0').querySelectorAll('path')).map((p) =>
        normalise(p.getAttribute('fill')!),
      ),
    ).toEqual([normalise(quiet)]);
  });

  it('gives every arrow the accent when an allowed lane names no preference', () => {
    const theme = buildTheme('teal', 'light');
    const accent = resolveAccentColors(theme.colors, 'primary', 'subtle').foreground;
    mount(<LaneGuidance lanes={[{ directions: ['straight', 'right'], allowed: true }]} testID="l" />);
    expect(
      Array.from(byTestId('l-lane-0').querySelectorAll('path')).map((p) =>
        normalise(p.getAttribute('fill')!),
      ),
    ).toEqual([normalise(accent), normalise(accent)]);
  });

  it('reuses the maneuver glyphs rather than drawing a second set of arrows', () => {
    mount(<LaneGuidance lanes={[{ directions: ['sharp-left'] }]} testID="l" />);
    expect(pathOf(byTestId('l-lane-0'))).toBe(glyphPath('sharp-left'));
  });

  it('says which lane to be in — a row of arrows says nothing aloud', () => {
    mount(<LaneGuidance lanes={LANES} testID="l" />);
    expect(byTestId('l').getAttribute('role')).toBe('img');
    expect(byTestId('l').getAttribute('aria-label')).toBe(
      'Lane guidance, 3 lanes, use lane 2 and lane 3',
    );
  });

  it('still counts the lanes when none of them is yours', () => {
    expect(describeLanes([{ directions: ['left'] }, { directions: ['right'] }], undefined)).toBe(
      'Lane guidance, 2 lanes',
    );
    expect(describeLanes([{ directions: ['left'] }], undefined)).toBe('Lane guidance, 1 lane');
  });
});

// ---------------------------------------------------------------------------
//  SpeedLimitPill
// ---------------------------------------------------------------------------

describe('SpeedLimitPill', () => {
  it('rings the sign in its tone and leaves the face on the map surface', () => {
    const theme = buildTheme('teal', 'light');
    const solid = resolveAccentColors(theme.colors, 'error', 'solid');
    mount(<SpeedLimitPill limit="50" unit="km/h" testID="s" />);
    const sign = byTestId('s-sign');
    expect(normalise(sign.style.borderTopColor)).toBe(normalise(solid.background));
    expect(normalise(sign.style.backgroundColor)).not.toBe(normalise(solid.background));
    expect(sign.style.width).toBe(`${NAVIGATION_BANNER_GEOMETRY.sign}px`);
    expect(byTestId('s-unit').textContent).toBe('km/h');
  });

  it('FILLS the sign over the limit — a brighter ring is the same sign', () => {
    const theme = buildTheme('teal', 'light');
    const solid = resolveAccentColors(theme.colors, 'error', 'solid');
    mount(<SpeedLimitPill limit="50" unit="km/h" exceeded testID="s" />);
    const sign = byTestId('s-sign');
    expect(normalise(sign.style.backgroundColor)).toBe(normalise(solid.background));
    expect(normalise(sign.querySelector('[dir="auto"]')!.getAttribute('style')!.match(/color: ([^;]+)/)![1]!)).toBe(
      normalise(solid.foreground),
    );
  });

  it('announces the figure, the unit and the fact that it is exceeded', () => {
    mount(<SpeedLimitPill limit={120} unit="km/h" exceeded testID="s" />);
    expect(byTestId('s').getAttribute('aria-label')).toBe('Speed limit 120 km/h, over the limit');
    expect(describeSpeedLimit({ limit: 30, unit: 'mph' })).toBe('Speed limit 30 mph');
  });

  it('takes another tone when a country posts one', () => {
    const theme = buildTheme('teal', 'light');
    const warning = resolveAccentColors(theme.colors, 'warning', 'solid');
    mount(<SpeedLimitPill limit="20" tone="warning" testID="s" />);
    expect(normalise(byTestId('s-sign').style.borderTopColor)).toBe(normalise(warning.background));
  });
});

// ---------------------------------------------------------------------------
//  ArrivalBar
// ---------------------------------------------------------------------------

describe('ArrivalBar', () => {
  it('draws three readings of EQUAL weight', () => {
    mount(
      <ArrivalBar arrival="18:42" remainingTime="24 min" remainingDistance="8.2 km" testID="a" />,
    );
    const sizes = ['a-arrival', 'a-time', 'a-distance'].map((id) => byTestId(id).style.fontSize);
    expect(sizes).toEqual(['18px', '18px', '18px']);
    expect(byTestId('a-arrival').textContent).toBe('18:42');
    expect(byTestId('a-time').textContent).toBe('24 min');
    expect(byTestId('a-distance').textContent).toBe('8.2 km');
  });

  it('reads the three as one utterance, each with its own word', () => {
    mount(
      <ArrivalBar arrival="18:42" remainingTime="24 min" remainingDistance="8.2 km" testID="a" />,
    );
    const named = container.querySelector('[role="img"]')!;
    expect(named.getAttribute('aria-label')).toBe('Arrival 18:42, Left 24 min, Distance 8.2 km');
    expect(
      describeArrival({
        arrival: '09:05',
        remainingTime: '2 h',
        remainingDistance: '1 km',
        labels: { arrival: 'Arribada' },
      }),
    ).toBe('Arribada 09:05, Left 2 h, Distance 1 km');
  });

  it('draws the way out only when there is one, at a 44 target', () => {
    mount(<ArrivalBar arrival="1" remainingTime="2" remainingDistance="3" testID="a" />);
    expect(query('a-end')).toBeNull();

    mount(
      <ArrivalBar arrival="1" remainingTime="2" remainingDistance="3" onEnd={() => {}} testID="a" />,
    );
    const end = byTestId('a-end');
    expect(end.getAttribute('role')).toBe('button');
    expect(end.textContent).toContain('End');
    // A control pressed by a thumb in a moving car.
    expect(Number.parseFloat(end.style.height)).toBeGreaterThanOrEqual(44);
  });

  it('lets an app supply its own trailing control instead', () => {
    mount(
      <ArrivalBar
        arrival="1"
        remainingTime="2"
        remainingDistance="3"
        onEnd={() => {}}
        action={<SpeedLimitPill limit="50" testID="mine" />}
        testID="a"
      />,
    );
    expect(query('a-end')).toBeNull();
    expect(query('mine')).not.toBeNull();
  });

  it('calls back when the way out is pressed', () => {
    const onEnd = jest.fn();
    mount(<ArrivalBar arrival="1" remainingTime="2" remainingDistance="3" onEnd={onEnd} testID="a" />);
    act(() => {
      byTestId('a-end').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
