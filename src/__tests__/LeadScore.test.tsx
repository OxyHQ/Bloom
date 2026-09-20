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
} from '../lead-score';
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

  it('draws the band pill in the tone PAIR, and hot is the SUCCESS tone', () => {
    mount(<LeadScoreCard score={91} accessibilityLabel="Lead score" testID="s" />);
    const accent = resolveAccentColors(theme.colors, 'success', 'subtle');
    expect(byTestId('s-band').textContent).toContain('Hot');
    expect(getComputedStyle(byTestId('s-band')).backgroundColor).toBe(normalise(accent.background));

    mount(<LeadScoreCard score={21} accessibilityLabel="Lead score" testID="s" />);
    const cold = resolveAccentColors(theme.colors, 'info', 'subtle');
    expect(byTestId('s-band').textContent).toContain('Cold');
    expect(getComputedStyle(byTestId('s-band')).backgroundColor).toBe(normalise(cold.background));
  });

  it('lets an app with its own thresholds override the band and its word', () => {
    mount(<LeadScoreCard score={21} band="hot" bandLabel="Priority" accessibilityLabel="Lead score" testID="s" />);
    expect(byTestId('s-band').textContent).toContain('Priority');
    const accent = resolveAccentColors(theme.colors, 'success', 'subtle');
    expect(getComputedStyle(byTestId('s-band')).backgroundColor).toBe(normalise(accent.background));
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

  it('paints a positive factor and a negative one in different tones', () => {
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />);
    const positive = resolveAccentColors(theme.colors, 'success', 'solid').background;
    const negative = resolveAccentColors(theme.colors, 'error', 'solid').background;
    expect(getComputedStyle(byTestId('s-factor-Fits the ideal profile-fill')).backgroundColor).toBe(
      normalise(positive),
    );
    expect(
      getComputedStyle(byTestId('s-factor-No decision-maker identified-fill')).backgroundColor,
    ).toBe(normalise(negative));
    expect(positive).not.toBe(negative);
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
  it('takes the direction TONE, and is absent when there is nothing to say', () => {
    mount(
      <LeadScoreCard
        score={82}
        accessibilityLabel="Lead score"
        trend={{ label: '+8 against last week', direction: 'up' }}
        testID="s"
      />,
    );
    const up = resolveAccentColors(theme.colors, 'success', 'subtle').foreground;
    expect(byTestId('s-trend').textContent).toBe('+8 against last week');
    expect(getComputedStyle(byTestId('s-trend')).color).toBe(normalise(up));

    mount(
      <LeadScoreCard
        score={82}
        accessibilityLabel="Lead score"
        trend={{ label: '-4 against last week', direction: 'down' }}
        testID="s"
      />,
    );
    const down = resolveAccentColors(theme.colors, 'error', 'subtle').foreground;
    expect(getComputedStyle(byTestId('s-trend')).color).toBe(normalise(down));
    expect(up).not.toBe(down);

    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" testID="s" />);
    expect(queryTestId('s-trend')).toBeNull();
  });
});
