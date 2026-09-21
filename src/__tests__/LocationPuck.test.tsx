/**
 * @jest-environment jsdom
 *
 * The puck, rendered through the REAL react-native-web so the assertions read
 * the emitted DOM: the name it announces, the cone's gradient stops, its
 * geometry, and which layers exist in which state.
 *
 * TWO RENDERERS, on purpose and for one node. Everything here is read off the
 * DOM except the dot's own paint: the dot is an `Animated.View`, which the jest
 * reanimated mock renders as a bare host string, and React DOM drops an ARRAY
 * `style` on an unrecognised element — the node arrives with no `style`
 * attribute at all. So the dot's fill and ring are read from the element tree
 * with `react-test-renderer`, where the style prop survives as it was written.
 * Asserting them off a DOM node would assert nothing, silently.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TestRenderer from 'react-test-renderer';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { LOCATION_PUCK_CONE_STOPS, LOCATION_PUCK_GEOMETRY, LocationPuck } from '../location-puck';
import {
  chevronPoints,
  coneHalfAngle,
  conePath,
  describeLocationPuck,
  normalizeHeading,
  puckBoxSize,
  puckRotation,
  resolveLocationPuckPaint,
  type LocationPuckPaint,
} from '../location-puck/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import { findHost, resolvedStyle } from './support/rendered-style';

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

/**
 * react-native-web emits `data-testid`; a bare host string (the reanimated and
 * react-native-svg mocks) gets the prop through React's attribute path, which
 * lands as `testid`. Both spellings are the SAME testID, so a query that knew
 * only one would report "the layer is absent" for a layer that is there.
 */
function query(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"], [testid="${id}"]`);
}

function byTestId(id: string): HTMLElement {
  const el = query(id);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

// ---------------------------------------------------------------------------
//  The geometry, as pure functions
// ---------------------------------------------------------------------------

describe('cone geometry', () => {
  const { coneMinHalfAngle, coneMaxHalfAngle } = LOCATION_PUCK_GEOMETRY;

  it('takes the device reading as the half-width, clamped both ways', () => {
    expect(coneHalfAngle(30)).toBe(30);
    expect(coneHalfAngle(2)).toBe(coneMinHalfAngle);
    expect(coneHalfAngle(180)).toBe(coneMaxHalfAngle);
  });

  it('falls back to the NARROWEST cone when the device says nothing', () => {
    // Not to zero: a cone of no width is a claim of perfect certainty.
    expect(coneHalfAngle(undefined)).toBe(coneMinHalfAngle);
    expect(coneHalfAngle(Number.NaN)).toBe(coneMinHalfAngle);
    expect(coneHalfAngle(-10)).toBe(coneMinHalfAngle);
  });

  it('draws the wedge from the box centre, pointing up', () => {
    const d = conePath(72, 14);
    expect(d.startsWith('M 72 72 L ')).toBe(true);
    const [, x1, y1] = /L ([\d.-]+) ([\d.-]+)/.exec(d)!;
    // 14° off vertical at r=72: the arc end is above the centre and left of it.
    expect(Number(y1)).toBeLessThan(72);
    expect(Number(x1)).toBeLessThan(72);
    expect(Math.hypot(Number(x1) - 72, Number(y1) - 72)).toBeCloseTo(72, 1);
  });

  it('widens the chord as the half-angle grows', () => {
    const chord = (half: number) => {
      const m = /L ([\d.-]+) [\d.-]+ A [\d.-]+ [\d.-]+ 0 0 1 ([\d.-]+)/.exec(conePath(72, half))!;
      return Number(m[2]) - Number(m[1]);
    };
    expect(chord(40)).toBeGreaterThan(chord(14));
    expect(chord(55)).toBeGreaterThan(chord(40));
  });

  it('folds a heading into one turn, and reads a non-finite one as north', () => {
    expect(normalizeHeading(-90)).toBe(270);
    expect(normalizeHeading(450)).toBe(90);
    expect(normalizeHeading(undefined)).toBe(0);
  });

  it('turns the puck in `following` and leaves it alone in `compass`', () => {
    // The map itself has already turned in compass mode; turning the cone too
    // would apply the rotation twice.
    expect(puckRotation('following', 120)).toBe(120);
    expect(puckRotation('navigating', 120)).toBe(120);
    expect(puckRotation('compass', 120)).toBe(0);
  });

  it('sizes the box to whichever layer reaches furthest', () => {
    const puck = LOCATION_PUCK_GEOMETRY.dot + LOCATION_PUCK_GEOMETRY.ring * 2;
    expect(puckBoxSize({ cone: false })).toBe(puck);
    expect(puckBoxSize({ cone: false, accuracyRadius: 90 })).toBe(180);
    expect(puckBoxSize({ cone: true, coneLength: 72, accuracyRadius: 20 })).toBe(144);
    expect(puckBoxSize({ cone: true, coneLength: 40, accuracyRadius: 90 })).toBe(180);
  });

  it('gives the chevron a notch, so it is not a triangle', () => {
    const points = chevronPoints(34).split(' ').map((p) => p.split(',').map(Number));
    expect(points).toHaveLength(4);
    // tip at the top centre, base corners at the bottom, notch between them
    expect(points[0]).toEqual([17, 0]);
    expect(points[2]![1]).toBeLessThan(points[1]![1]!);
    expect(points[2]![1]).toBeGreaterThan(points[0]![1]!);
  });
});

// ---------------------------------------------------------------------------
//  The paint
// ---------------------------------------------------------------------------

describe('resolveLocationPuckPaint', () => {
  it.each(['light', 'dark'] as const)('rings the live dot with that fill OWN on-colour (%s)', (mode) => {
    const theme = buildTheme('teal', mode);
    const paint = resolveLocationPuckPaint(theme);
    const accent = resolveAccentColors(theme.colors, 'primary', 'solid');
    expect(paint.dot).toBe(accent.background);
    expect(paint.ring).toBe(accent.foreground);
    expect(paint.ring).not.toBe(paint.dot);
  });

  it.each(['light', 'dark'] as const)('drops the accent for a stale fix (%s)', (mode) => {
    const paint = resolveLocationPuckPaint(buildTheme('teal', mode));
    expect(paint.staleDot).not.toBe(paint.dot);
    expect(paint.staleRing).not.toBe(paint.staleDot);
  });
});

// ---------------------------------------------------------------------------
//  The announcement
// ---------------------------------------------------------------------------

describe('what it announces', () => {
  it('names the state, and says when the fix is stale', () => {
    mount(<LocationPuck state="stale" testID="p" />);
    expect(byTestId('p').getAttribute('role')).toBe('img');
    expect(byTestId('p').getAttribute('aria-label')).toBe('Your last known location');
  });

  it('adds the bearing when there is one', () => {
    mount(<LocationPuck state="located" heading={41.4} testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('Your location, facing 41 degrees');
  });

  it('speaks no bearing the device did not measure', () => {
    mount(<LocationPuck heading={41} headingUnknown testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('Your location');
  });

  it('takes the caller words', () => {
    mount(<LocationPuck state="locating" stateLabels={{ locating: 'Cercant' }} testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('Cercant');
    expect(describeLocationPuck({ state: 'located', mode: 'following' })).toBe('Your location');
  });

  it('lets an explicit name win outright', () => {
    mount(<LocationPuck state="stale" heading={10} accessibilityLabel="You, roughly" testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe('You, roughly');
  });
});

// ---------------------------------------------------------------------------
//  The layers
// ---------------------------------------------------------------------------

describe('the layers it draws', () => {
  it('draws the halo only when the app measured one, at the radius it gave', () => {
    mount(<LocationPuck accuracyRadius={50} testID="p" />);
    expect(byTestId('p-halo').style.width).toBe('100px');
    expect(byTestId('p-halo').style.height).toBe('100px');
  });

  it('draws no halo without a radius', () => {
    mount(<LocationPuck testID="p" />);
    expect(query('p-halo')).toBeNull();
  });

  it('sizes its own box to the furthest layer', () => {
    mount(<LocationPuck accuracyRadius={90} coneLength={40} testID="p" />);
    expect(byTestId('p').style.width).toBe('180px');
  });

  it('draws no cone when the heading is unknown', () => {
    mount(<LocationPuck headingUnknown accuracyRadius={30} testID="p" />);
    expect(query('p-cone')).toBeNull();
    expect(query('p-halo')).not.toBeNull();
    expect(query('p-dot')).not.toBeNull();
  });

  it('swaps the dot for a chevron while navigating, and drops the cone with it', () => {
    mount(<LocationPuck mode="navigating" heading={30} testID="p" />);
    expect(query('p-dot')).toBeNull();
    expect(query('p-cone')).toBeNull();
    expect(query('p-chevron')).not.toBeNull();
  });

  it('turns the cone by the heading in `following` and not at all in `compass`', () => {
    mount(<LocationPuck mode="following" heading={120} testID="p" />);
    expect(byTestId('p-cone').parentElement!.style.transform).toContain('rotate(120deg)');
    mount(<LocationPuck mode="compass" heading={120} testID="p" />);
    expect(byTestId('p-cone').parentElement!.style.transform).toContain('rotate(0deg)');
  });
});

// ---------------------------------------------------------------------------
//  The gradient — the one that renders correctly on web and opaque on native
// ---------------------------------------------------------------------------

describe('the cone gradient', () => {
  function stops(): Element[] {
    return Array.from(byTestId('p-cone').querySelectorAll('stop'));
  }

  it('puts every stop OPACITY in `stop-opacity`, never inside the colour', () => {
    mount(<LocationPuck heading={0} testID="p" />);
    const all = stops();
    expect(all).toHaveLength(2);
    for (const stop of all) {
      const color = stop.getAttribute('stop-color') ?? '';
      // react-native-svg reads `stopColor` for RGB and DISCARDS any alpha in
      // it, so a colour carrying one paints at FULL strength on a device while
      // web renders it correctly — and a gate that only compared the two forks'
      // tokens would agree with itself.
      expect(color).not.toMatch(/rgba|hsla/i);
      expect(color).not.toMatch(/^#[0-9a-f]{8}$/i);
      expect(stop.getAttribute('stop-opacity')).not.toBeNull();
    }
    expect(all[0]!.getAttribute('stop-opacity')).toBe(String(LOCATION_PUCK_CONE_STOPS.inner.opacity));
    expect(all[1]!.getAttribute('stop-opacity')).toBe(String(LOCATION_PUCK_CONE_STOPS.outer.opacity));
  });

  it('fades to nothing at the far end, from the accent at the dot', () => {
    expect(LOCATION_PUCK_CONE_STOPS.inner.opacity).toBeGreaterThan(0);
    expect(LOCATION_PUCK_CONE_STOPS.outer.opacity).toBe(0);
  });

  it('measures the ramp in USER SPACE, so it runs along the cone rather than across its bounding box', () => {
    mount(<LocationPuck heading={0} coneLength={72} testID="p" />);
    const gradient = byTestId('p-cone').querySelector('radialGradient, radialgradient')!;
    expect(gradient.getAttribute('gradientUnits') ?? gradient.getAttribute('gradientunits')).toBe(
      'userSpaceOnUse',
    );
    expect(gradient.getAttribute('cx')).toBe('72');
    expect(gradient.getAttribute('cy')).toBe('72');
    expect(gradient.getAttribute('r')).toBe('72');
  });

  /**
   * THE NATIVE HALF of the same rule, and it cannot be read off a DOM node.
   *
   * The assertions above read the attribute a browser emitted. `react-native-svg`
   * never sees an attribute — it is handed the PROP, reads `stopColor` for its
   * RGB and drops any alpha inside it. So the thing that has to be true on a
   * device is that the VALUE reaching `stopColor` carries no alpha channel to
   * lose, for every preset and both modes, and that every `<Stop>` in this
   * family states its opacity in the prop SVG defines for it.
   *
   * There is no `.web` fork here, so one file serves both platforms and these
   * two checks are the whole native path.
   */
  it('hands `stopColor` an OPAQUE colour in every preset and mode', () => {
    for (const preset of ['teal', 'blue', 'mono', 'yellow', 'rose'] as const) {
      for (const mode of ['light', 'dark'] as const) {
        const { cone } = resolveLocationPuckPaint(buildTheme(preset, mode));
        const where = `${preset} ${mode}`;
        expect([where, /rgba|hsla/i.test(cone)]).toEqual([where, false]);
        expect([where, /^#[0-9a-f]{8}$/i.test(cone)]).toEqual([where, false]);
      }
    }
  });

  it('states every stop opacity in `stopOpacity`, in the source', () => {
    const dir = join(__dirname, '..', 'location-puck');
    const sources = readdirSync(dir)
      .filter((name) => /\.tsx?$/.test(name) && !/\.stories\./.test(name))
      .map((name) => readFileSync(join(dir, name), 'utf8'));
    const stops = sources.flatMap((text) => text.match(/<Stop\b[\s\S]*?\/>/g) ?? []);
    // Positive control: a scan that found nothing would pass every claim below.
    expect(stops.length).toBeGreaterThanOrEqual(2);
    for (const stop of stops) {
      expect(stop).toContain('stopOpacity');
      expect(stop).not.toMatch(/stopColor=\{?["`']?rgba/i);
    }
  });

  it('widens the painted wedge as the device gets less sure', () => {
    const chordOf = (accuracy: number) => {
      mount(<LocationPuck heading={0} headingAccuracy={accuracy} testID="p" />);
      const d = byTestId('p-cone').querySelector('path')!.getAttribute('d')!;
      const m = /L ([\d.-]+) [\d.-]+ A [\d.-]+ [\d.-]+ 0 0 1 ([\d.-]+)/.exec(d)!;
      return Number(m[2]) - Number(m[1]);
    };
    expect(chordOf(50)).toBeGreaterThan(chordOf(15));
  });
});

// ---------------------------------------------------------------------------
//  The dot's own paint — read from the element tree; see the file comment
// ---------------------------------------------------------------------------

describe('the dot', () => {
  function dotStyle(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <BloomThemeProvider mode={mode} colorPreset="teal">
          {ui}
        </BloomThemeProvider>,
      );
    });
    const node = findHost(tree!.toJSON(), 'p-dot');
    expect(node).not.toBeNull();
    const style = resolvedStyle(node!.props.style);
    act(() => tree!.unmount());
    return style;
  }

  const paintFor = (mode: 'light' | 'dark'): LocationPuckPaint =>
    resolveLocationPuckPaint(buildTheme('teal', mode));

  it.each(['light', 'dark'] as const)('fills with the accent and rings it with its on-colour (%s)', (mode) => {
    const style = dotStyle(<LocationPuck testID="p" />, mode);
    const paint = paintFor(mode);
    expect(style.backgroundColor).toBe(paint.dot);
    expect(style.borderColor).toBe(paint.ring);
    expect(style.borderWidth).toBe(LOCATION_PUCK_GEOMETRY.ring);
    expect(style.width).toBe(LOCATION_PUCK_GEOMETRY.dot + LOCATION_PUCK_GEOMETRY.ring * 2);
  });

  it.each(['light', 'dark'] as const)('goes quiet when the fix is stale (%s)', (mode) => {
    const style = dotStyle(<LocationPuck state="stale" testID="p" />, mode);
    const paint = paintFor(mode);
    expect(style.backgroundColor).toBe(paint.staleDot);
    expect(style.borderColor).toBe(paint.staleRing);
  });

  it('stands still under reduced motion', () => {
    expect(dotStyle(<LocationPuck state="locating" reducedMotion testID="p" />).transform).toEqual([
      { scale: 1 },
    ]);
  });
});

describe('the pulse', () => {
  /**
   * The HALO is where the pulse is measurable here, and the dot is not.
   *
   * The jest reanimated mock resolves `withSequence(...)` to its LAST value, so
   * the driver reads 0 whether or not it was started — and the dot's scale is
   * `1 + 0 * 0.18` either way. The halo's opacity is not symmetric like that:
   * an ANIMATING halo starts at the trough of its breath (0.6 of its resting
   * opacity) and a still one sits at the resting value, so the two are
   * distinguishable without a clock. The motion itself — that the driver
   * actually ticks on web, which reanimated silently declines to do when it is
   * started from a mapper — is measured in a real browser, by sampling the
   * dot's box across ten frames of the `LocationPuck` stories.
   *
   * This reads the emitted `opacity`, which survives because `useAnimatedStyle`
   * returns one OBJECT: React DOM applies it and drops only the array the dot's
   * style is written as.
   */
  function haloOpacity(ui: React.ReactElement): string {
    mount(ui);
    return byTestId('p-halo').parentElement!.style.opacity;
  }

  it('breathes only while locating', () => {
    expect(haloOpacity(<LocationPuck state="located" accuracyRadius={40} testID="p" />)).toBe('1');
    expect(haloOpacity(<LocationPuck state="locating" accuracyRadius={40} testID="p" />)).not.toBe(
      '1',
    );
  });

  it('stops for a reader who asked for less motion', () => {
    expect(
      haloOpacity(<LocationPuck state="locating" reducedMotion accuracyRadius={40} testID="p" />),
    ).toBe('1');
  });

  it('dims the halo for a stale fix, and still does not breathe it', () => {
    expect(haloOpacity(<LocationPuck state="stale" accuracyRadius={40} testID="p" />)).toBe('0.5');
  });
});
