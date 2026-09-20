/**
 * @jest-environment jsdom
 *
 * `LeadScoreCard` through the REAL react-native-web.
 *
 * The point of most of this file: react-native-web reads `aria-*` and NEVER
 * `accessibilityValue`, so a ring that set only the object would announce its
 * role and no value — plausibly, in a screenshot and in a prop-level test. The
 * only instrument that can tell them apart is the emitted attribute, which is
 * what every assertion below reads.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  LEAD_SCORE_THRESHOLDS,
  LeadScoreCard,
  factorScale,
  formatContribution,
  resolveLeadScoreBand,
  resolveLeadScorePaint,
} from '../lead-score';
import { resolveMeterColors } from '../stat-bar/shared';
import { AA_GRAPHICAL } from '../styles/surface-levels';
import { contrastRatio } from '../styles/color-contrast';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { LeadScoreFactor } from '../lead-score';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
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

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

/**
 * `react-native-svg` is mocked into host elements, so the arc's `testID` lands
 * as a plain `testid` attribute rather than `data-testid`. Reading the STROKE
 * off it is the only way to see what the ring is actually painted with.
 */
function ringStroke(id: string): string {
  const el = container.querySelector(`[testid="${id}"]`);
  if (el === null) throw new Error(`No svg element for testID "${id}"`);
  return el.getAttribute('stroke') ?? '';
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const FACTORS: LeadScoreFactor[] = [
  { label: 'Fits the ideal profile', contribution: 24 },
  { label: 'Opened the last five emails', contribution: 18 },
  { label: 'No decision-maker identified', contribution: -9, detail: 'Only one contact' },
];

describe('the score is a measurement, announced as one', () => {
  it('emits the FLAT aria-value props react-native-web actually reads', () => {
    mount(
      <LeadScoreCard
        score={82}
        accessibilityLabel="Lead score for Larkspur Freight"
        valueText="82 of 100, hot"
        testID="s"
      />,
    );
    const ring = byTestId('s-ring');
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-label')).toBe('Lead score for Larkspur Freight');
    expect(ring.getAttribute('aria-valuemin')).toBe('0');
    expect(ring.getAttribute('aria-valuemax')).toBe('100');
    expect(ring.getAttribute('aria-valuenow')).toBe('82');
    expect(ring.getAttribute('aria-valuetext')).toBe('82 of 100, hot');
  });

  it('carries the scale it was given, not a hardcoded hundred', () => {
    mount(<LeadScoreCard score={4} max={5} accessibilityLabel="Fit score" testID="s" />);
    const ring = byTestId('s-ring');
    expect(ring.getAttribute('aria-valuemax')).toBe('5');
    expect(ring.getAttribute('aria-valuenow')).toBe('4');
    expect(byTestId('s-score').textContent).toBe('4');
  });
});

describe('the band is derived, and it is a TONE', () => {
  it('falls where the thresholds say, on both scales', () => {
    expect(resolveLeadScoreBand(0, 100)).toBe('cold');
    expect(resolveLeadScoreBand(39, 100)).toBe('cold');
    // Inclusive upward: landing exactly on a threshold has reached it.
    expect(resolveLeadScoreBand(LEAD_SCORE_THRESHOLDS.warm * 100, 100)).toBe('warm');
    expect(resolveLeadScoreBand(69, 100)).toBe('warm');
    expect(resolveLeadScoreBand(LEAD_SCORE_THRESHOLDS.hot * 100, 100)).toBe('hot');
    expect(resolveLeadScoreBand(4, 5)).toBe('hot');
    expect(resolveLeadScoreBand(2, 5)).toBe('warm');
    // Data the card did not choose: no scale to divide, and no crash.
    expect(resolveLeadScoreBand(10, 0)).toBe('cold');
    expect(resolveLeadScoreBand(Number.NaN, 100)).toBe('cold');
  });

  it('draws the band as the VERDICT word, in the reading colour', () => {
    // The hierarchy every Bloom score card uses: a quiet label over a
    // `title-1-medium` verdict. The word is not a pill, so it carries no fill
    // and takes the text rung of the surface it lands on.
    mount(<LeadScoreCard score={91} accessibilityLabel="Lead score" testID="s" />);
    const band = byTestId('s-band');
    expect(band.textContent).toBe('Hot');
    const style = getComputedStyle(band);
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.color).toBe(normalise(resolveLeadScorePaint(theme, theme.colors.card).text));
    expect(style.fontSize).toBe('24px');

    mount(<LeadScoreCard score={21} accessibilityLabel="Lead score" testID="s" />);
    expect(byTestId('s-band').textContent).toBe('Cold');
  });

  it('lets an app with its own thresholds override the band and its word', () => {
    mount(<LeadScoreCard score={21} band="hot" bandLabel="Priority" accessibilityLabel="Lead score" testID="s" />);
    expect(byTestId('s-band').textContent).toBe('Priority');
  });

  it('fills the RING with the accent, never with a status colour', () => {
    // A green ring claims "healthy", which is a different claim from "91 of
    // 100". The meter's own fill is the accent, and the ring must take it
    // whatever band the score falls in.
    for (const score of [21, 55, 91]) {
      mount(<LeadScoreCard score={score} accessibilityLabel="Lead score" testID="s" />);
      const meter = resolveMeterColors(theme);
      expect([score, ringStroke('s-ring-arc')]).toEqual([score, meter.fill]);
      expect(ringStroke('s-ring-track')).toBe(meter.track);
      // Named negatives: the three tones this used to be painted with.
      for (const tone of ['success', 'warning', 'info'] as const) {
        expect(ringStroke('s-ring-arc')).not.toBe(
          resolveAccentColors(theme.colors, tone, 'solid').background,
        );
      }
    }
  });
});

describe('the factors are meters, one scale for the set', () => {
  it('names each bar and announces its SIGNED contribution', () => {
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />);
    const top = byTestId('s-factor-Fits the ideal profile');
    expect(top.getAttribute('role')).toBe('progressbar');
    expect(top.getAttribute('aria-label')).toBe('Fits the ideal profile');
    expect(top.getAttribute('aria-valuetext')).toBe('+24 points');
    const negative = byTestId('s-factor-No decision-maker identified');
    expect(negative.getAttribute('aria-valuetext')).toBe('-9 points');
    // The bar measures the MAGNITUDE; the sign is in the text and the tone.
    expect(negative.getAttribute('aria-valuenow')).toBe('9');
    expect(byTestId('s-factor-No decision-maker identified-points').textContent).toBe('-9');
  });

  it('measures every bar against the widest contribution in the set', () => {
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />);
    // 24 is the widest, so it fills; 18 and 9 are fractions of the SAME scale.
    expect(byTestId('s-factor-Fits the ideal profile-fill').style.width).toBe('100%');
    expect(byTestId('s-factor-Opened the last five emails-fill').style.width).toBe('75%');
    expect(byTestId('s-factor-No decision-maker identified-fill').style.width).toBe('37.5%');
    expect(byTestId('s-factor-Fits the ideal profile').getAttribute('aria-valuemax')).toBe('24');
    expect(factorScale(FACTORS)).toBe(24);
    // A set of zeroes still has a scale, so nothing divides by nothing.
    expect(factorScale([{ label: 'none', contribution: 0 }])).toBe(1);
    expect(factorScale([])).toBe(1);
  });

  it('fills a positive bar with the ACCENT and a negative one with the quiet neutral', () => {
    // One measured language. Five saturated green and red bars down a card is a
    // chart pretending to be a measurement; the SIGN carries the direction and
    // the length carries the size.
    for (const mode of ['light', 'dark'] as const) {
      mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />, mode);
      const paint = resolveLeadScorePaint(theme, theme.colors.card);
      const meter = resolveMeterColors(theme);
      const positive = getComputedStyle(byTestId('s-factor-Fits the ideal profile-fill')).backgroundColor;
      const negative = getComputedStyle(
        byTestId('s-factor-No decision-maker identified-fill'),
      ).backgroundColor;

      expect([mode, positive]).toEqual([mode, normalise(meter.fill)]);
      expect([mode, negative]).toEqual([mode, normalise(paint.negativeFill)]);
      expect(positive).not.toBe(negative);

      // Neither is a status fill any more — named, so a revert goes red.
      for (const tone of ['success', 'error'] as const) {
        const status = normalise(resolveAccentColors(theme.colors, tone, 'solid').background);
        expect([mode, tone, positive]).not.toEqual([mode, tone, status]);
        expect([mode, tone, negative]).not.toEqual([mode, tone, status]);
      }

      // And the quiet fill READS on the rail it is drawn on. `neutralSeries`
      // would not: it is `neutral-800` in dark, which is the rail's own colour.
      expect([mode, contrastRatio(paint.negativeFill, meter.track) >= AA_GRAPHICAL]).toEqual([
        mode,
        true,
      ]);
    }
  });

  it('prints both signs in the reading colour — the number says the direction', () => {
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />);
    const paint = resolveLeadScorePaint(theme, theme.colors.card);
    for (const key of ['Fits the ideal profile', 'No decision-maker identified']) {
      expect(getComputedStyle(byTestId(`s-factor-${key}-points`)).color).toBe(
        normalise(paint.text),
      );
    }
  });

  it('formats a contribution the way it is drawn and announced', () => {
    expect(formatContribution(24)).toBe('+24');
    expect(formatContribution(-9)).toBe('-9');
    expect(formatContribution(0)).toBe('0');
  });

  it('draws no factor section at all when there are none', () => {
    mount(<LeadScoreCard score={38} accessibilityLabel="Lead score" testID="s" />);
    expect(queryTestId('s-factors')).toBeNull();
  });
});

describe('the trend', () => {
  it('is a QUIET line — the arrow carries the direction, not a status colour', () => {
    const paint = () => resolveLeadScorePaint(theme, theme.colors.card);
    for (const direction of ['up', 'down', 'flat'] as const) {
      mount(
        <LeadScoreCard
          score={82}
          accessibilityLabel="Lead score"
          trend={{ label: '+8 against last week', direction }}
          testID="s"
        />,
      );
      expect(byTestId('s-trend').textContent).toBe('+8 against last week');
      expect([direction, getComputedStyle(byTestId('s-trend')).color]).toEqual([
        direction,
        normalise(paint().textSecondary),
      ]);
      // Named negatives: the two tones the line used to be painted with.
      for (const tone of ['success', 'error'] as const) {
        expect(getComputedStyle(byTestId('s-trend')).color).not.toBe(
          normalise(resolveAccentColors(theme.colors, tone, 'subtle').foreground),
        );
      }
    }

    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" testID="s" />);
    expect(queryTestId('s-trend')).toBeNull();
  });
});
