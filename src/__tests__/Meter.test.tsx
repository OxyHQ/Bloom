/**
 * @jest-environment jsdom
 *
 * `Meter` and `MeterRing` — the ONE determinate bar and ring behind every
 * progress bar in Bloom — rendered through the REAL react-native-web, so the
 * assertions read the emitted DOM rather than the props that went in. That
 * distinction is the whole point for the accessibility half: a prop-level test
 * cannot see that react-native-web drops `accessibilityValue` on the floor.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { resolveButtonRamps } from '../button/shared';
import { Meter, MeterRing, meterFraction, meterValue, resolveMeterColors } from '../stat-bar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
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

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

/** The colour jsdom normalises a theme colour to, for comparison with computed styles. */
function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

describe('meterValue / meterFraction', () => {
  it('clamps into [0, max]', () => {
    expect(meterValue(-4, 10)).toBe(0);
    expect(meterValue(4, 10)).toBe(4);
    expect(meterValue(40, 10)).toBe(10);
    expect(meterFraction(4, 10)).toBeCloseTo(0.4, 6);
    expect(meterFraction(40, 10)).toBe(1);
  });

  it('reads a non-finite value or a non-positive max as empty, never NaN', () => {
    // A `NaN` width is the one failure the browser does not report: the fill
    // simply does not paint, and a bar with no fill looks like a bar at zero.
    expect(meterValue(Number.NaN, 10)).toBe(0);
    expect(meterFraction(Number.NaN, 10)).toBe(0);
    expect(meterFraction(5, 0)).toBe(0);
    expect(meterFraction(5, -1)).toBe(0);
    expect(meterFraction(5, Number.NaN)).toBe(0);
  });
});

describe('resolveMeterColors', () => {
  it('is the accent over neutral-200, neutral-700 in dark', () => {
    // Pinned against the ramps rather than restated as hex, so a preset change
    // moves both together — and pinned to the STOPS, so the unification that
    // produced them (seven families at 200/700, two at 200/800, one at 300/700
    // and one at 100/800) cannot drift back apart one family at a time.
    for (const mode of ['light', 'dark'] as const) {
      mount(<Meter value={1} max={2} accessibilityLabel="Probe" testID="m" />, mode);
      const { accent, neutral } = resolveButtonRamps(theme);
      const colors = resolveMeterColors(theme);
      expect(colors.fill).toBe(accent[500]);
      expect(colors.track).toBe(mode === 'dark' ? neutral[700] : neutral[200]);
    }
  });

  it('paints those two colours, and NOT colors.text', () => {
    mount(<Meter value={1} max={2} accessibilityLabel="Probe" testID="m" />);
    const colors = resolveMeterColors(theme);
    expect(getComputedStyle(byTestId('m')).backgroundColor).toBe(normalise(colors.track));
    expect(getComputedStyle(byTestId('m-fill')).backgroundColor).toBe(normalise(colors.fill));
    // Three families painted the fill `colors.text` — a near-black bar reading
    // as ink rather than as a measurement. The negative is the assertion.
    expect(getComputedStyle(byTestId('m-fill')).backgroundColor).not.toBe(normalise(theme.colors.text));
  });
});

describe('Meter geometry', () => {
  it('fills value / max of the width', () => {
    mount(<Meter value={3} max={4} accessibilityLabel="Three quarters" testID="m" />);
    expect(getComputedStyle(byTestId('m-fill')).width).toBe('75%');
  });

  it('clamps both ends rather than overflowing', () => {
    mount(<Meter value={9} max={4} accessibilityLabel="Over" testID="m" />);
    expect(getComputedStyle(byTestId('m-fill')).width).toBe('100%');
    mount(<Meter value={-2} max={4} accessibilityLabel="Under" testID="m" />);
    expect(getComputedStyle(byTestId('m-fill')).width).toBe('0%');
  });

  it('takes its radius from the height, and lets a caller override it', () => {
    mount(<Meter value={1} max={2} height={8} accessibilityLabel="Capsule" testID="m" />);
    expect(getComputedStyle(byTestId('m')).height).toBe('8px');
    expect(getComputedStyle(byTestId('m')).borderTopLeftRadius).toBe('4px');
    mount(<Meter value={1} max={2} height={12} radius={2} accessibilityLabel="Square" testID="m" />);
    expect(getComputedStyle(byTestId('m')).borderTopLeftRadius).toBe('2px');
  });

  it('fills its parent unless given a width, and clips the fill', () => {
    mount(<Meter value={1} max={2} accessibilityLabel="Wide" testID="m" />);
    expect(getComputedStyle(byTestId('m')).width).toBe('100%');
    // react-native-web emits the two axes, not the shorthand, and jsdom does
    // not fold them back — so read what is actually there.
    expect(getComputedStyle(byTestId('m')).overflowX).toBe('hidden');
    mount(<Meter value={1} max={2} width={56} accessibilityLabel="Narrow" testID="m" />);
    expect(getComputedStyle(byTestId('m')).width).toBe('56px');
  });

  it('takes an explicit fill and track', () => {
    mount(
      <Meter value={1} max={2} fill="rgb(255, 0, 0)" track="rgb(0, 0, 255)" accessibilityLabel="Custom" testID="m" />,
    );
    expect(getComputedStyle(byTestId('m-fill')).backgroundColor).toBe('rgb(255, 0, 0)');
    expect(getComputedStyle(byTestId('m')).backgroundColor).toBe('rgb(0, 0, 255)');
  });
});

describe('Meter accessibility', () => {
  it('emits a named progressbar with the FLAT aria-value attributes', () => {
    // The flat props are the whole reason this is a runtime suite:
    // react-native-web's `createDOMProps` reads `aria-*` and has no handling
    // for `accessibilityValue` at all, so a bar setting only the object
    // announces its role and no value. React Native folds these back, so
    // native keeps what it had.
    mount(<Meter value={4} max={5} accessibilityLabel="Cleanliness" valueText="4 of 5" testID="m" />);
    const bar = byTestId('m');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Cleanliness');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('5');
    expect(bar.getAttribute('aria-valuenow')).toBe('4');
    expect(bar.getAttribute('aria-valuetext')).toBe('4 of 5');
  });

  it('reports a CLAMPED aria-valuenow, never a value past its own max', () => {
    mount(<Meter value={9} max={5} accessibilityLabel="Over" testID="m" />);
    expect(byTestId('m').getAttribute('aria-valuenow')).toBe('5');
  });

  it('gives a decorative meter no role at all, and hides it', () => {
    // A segment of a larger progressbar. Two nested progressbars announce the
    // same measurement twice; an unnamed one announces it with no subject.
    mount(<Meter decorative value={1} max={2} testID="m" />);
    const bar = byTestId('m');
    expect(bar.getAttribute('role')).toBeNull();
    expect(bar.getAttribute('aria-hidden')).toBe('true');
    expect(bar.getAttribute('aria-valuenow')).toBeNull();
  });
});

describe('MeterRing', () => {
  it('occupies exactly size x size and draws the stroke inside it', () => {
    mount(<MeterRing value={1} max={2} size={72} thickness={6} accessibilityLabel="Quality" testID="r" />);
    expect(getComputedStyle(byTestId('r')).width).toBe('72px');
    expect(getComputedStyle(byTestId('r')).height).toBe('72px');
    const circles = byTestId('r').querySelectorAll('circle');
    expect(circles).toHaveLength(2);
    expect(Number(circles[0]!.getAttribute('r'))).toBeCloseTo((72 - 6) / 2, 6);
  });

  it('offsets the arc by the MISSING share', () => {
    mount(<MeterRing value={1} max={4} size={56} thickness={5} accessibilityLabel="Quarter" testID="r" />);
    const circumference = 2 * Math.PI * ((56 - 5) / 2);
    const arc = byTestId('r').querySelectorAll('circle')[1]!;
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.75, 3);
  });

  it('drops the round cap at zero, so an empty ring is not a dot', () => {
    mount(<MeterRing value={0} max={4} accessibilityLabel="Empty" testID="r" />);
    expect(byTestId('r').querySelectorAll('circle')[1]!.getAttribute('stroke-linecap')).toBe('butt');
    mount(<MeterRing value={1} max={4} accessibilityLabel="Some" testID="r" />);
    expect(byTestId('r').querySelectorAll('circle')[1]!.getAttribute('stroke-linecap')).toBe('round');
  });

  it('paints the meter colours and takes overrides', () => {
    mount(<MeterRing value={1} max={2} accessibilityLabel="Default" testID="r" />);
    const colors = resolveMeterColors(theme);
    const circles = () => byTestId('r').querySelectorAll('circle');
    expect(circles()[0]!.getAttribute('stroke')).toBe(colors.track);
    expect(circles()[1]!.getAttribute('stroke')).toBe(colors.fill);
    mount(
      <MeterRing value={1} max={2} fill="rgb(255, 0, 0)" track="rgb(0, 0, 255)" accessibilityLabel="Custom" testID="r" />,
    );
    expect(circles()[0]!.getAttribute('stroke')).toBe('rgb(0, 0, 255)');
    expect(circles()[1]!.getAttribute('stroke')).toBe('rgb(255, 0, 0)');
  });

  it('is a named progressbar with the flat aria-value attributes', () => {
    mount(<MeterRing value={50} max={100} accessibilityLabel="Listing quality" valueText="50, Good" testID="r" />);
    const ring = byTestId('r');
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-label')).toBe('Listing quality');
    expect(ring.getAttribute('aria-valuemin')).toBe('0');
    expect(ring.getAttribute('aria-valuemax')).toBe('100');
    expect(ring.getAttribute('aria-valuenow')).toBe('50');
    expect(ring.getAttribute('aria-valuetext')).toBe('50, Good');
  });

  it('renders centred children and hides them from assistive technology', () => {
    mount(
      <MeterRing value={50} max={100} accessibilityLabel="Score" testID="r">
        <span>50</span>
      </MeterRing>,
    );
    // The number is drawn, and it is the same one `aria-valuetext` carries —
    // announcing it twice is noise, so the wrapper is `aria-hidden`.
    expect(byTestId('r').textContent).toBe('50');
    const label = byTestId('r').querySelector('[aria-hidden="true"]');
    expect(label?.textContent).toBe('50');
  });
});

describe('the folded call sites keep their geometry', () => {
  it('a 4-tall bar is 4 tall with a radius of 2', () => {
    mount(<Meter value={1} max={2} height={4} accessibilityLabel="Rating" testID="m" />);
    expect(getComputedStyle(byTestId('m')).height).toBe('4px');
    expect(getComputedStyle(byTestId('m')).borderTopLeftRadius).toBe('2px');
  });

  it('a style override wins over the defaults it overlaps', () => {
    // `RatingBar` sizes the bar this way, and `ApplicationChecklist` adds its
    // own `marginTop` — a base that could not be overridden would silently
    // change both.
    mount(<Meter value={1} max={2} accessibilityLabel="Sized" testID="m" style={{ width: 96, marginTop: 12 }} />);
    expect(getComputedStyle(byTestId('m')).width).toBe('96px');
    expect(getComputedStyle(byTestId('m')).marginTop).toBe('12px');
  });

  it('names the fill separately when a family already published a testID', () => {
    mount(<Meter value={1} max={2} accessibilityLabel="Named" testID="b-bar" fillTestID="b-fill" />);
    expect(byTestId('b-bar')).toBeTruthy();
    expect(byTestId('b-fill')).toBeTruthy();
  });
});
