/**
 * @jest-environment jsdom
 *
 * `LeadScoreCard` through the REAL react-native-web.
 *
 * Two things here are invisible to a prop-level test and to a screenshot.
 * react-native-web reads `aria-*` and NEVER `accessibilityValue`, so a ring
 * that set only the object would announce its role and no value — plausibly.
 * And a colour is only right relative to what it lands on: the card paints TWO
 * panels, a tinted one and a neutral one, and every rung inside each is read
 * off that panel rather than off the card.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  LEAD_SCORE_BAND,
  LEAD_SCORE_RING_SIZE,
  LEAD_SCORE_THRESHOLDS,
  LeadScoreCard,
  factorLine,
  formatContribution,
  resolveLeadScoreBand,
  resolveLeadScorePaint,
} from '../lead-score';
import { resolveMeterColors } from '../stat-bar/shared';
import { AA_GRAPHICAL, AA_TEXT, surfaceFillOn } from '../styles/surface-levels';
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

/** The paint the card resolves for one band, so a test never guesses a colour. */
function paintFor(band: 'cold' | 'warm' | 'hot') {
  return resolveLeadScorePaint(theme, theme.colors.card, LEAD_SCORE_BAND[band].tone);
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

  it('draws the ring LARGE and the number at display size', () => {
    // The one fact the card exists to state. At 72 in a corner it was a widget
    // beside the verdict and the number inside it was smaller than the word
    // next to it — which renders perfectly well, and says the wrong thing.
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" testID="s" />);
    const ring = getComputedStyle(byTestId('s-ring'));
    expect(ring.width).toBe(`${LEAD_SCORE_RING_SIZE}px`);
    expect(ring.height).toBe(`${LEAD_SCORE_RING_SIZE}px`);
    expect(LEAD_SCORE_RING_SIZE).toBeGreaterThanOrEqual(120);
    // `display-4-medium` is 32/44 — bigger than the `title-1` verdict beside it.
    expect(getComputedStyle(byTestId('s-score')).fontSize).toBe('32px');
    expect(
      Number.parseFloat(getComputedStyle(byTestId('s-score')).fontSize),
    ).toBeGreaterThan(Number.parseFloat(getComputedStyle(byTestId('s-band')).fontSize));
  });

  it('centres the ring rather than parking it beside the verdict', () => {
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" testID="s" />);
    const centring = byTestId('s-ring').parentElement;
    expect(centring).not.toBeNull();
    expect(getComputedStyle(centring!).alignItems).toBe('center');
  });
});

describe('the header is a TINTED panel, and the tint is the band', () => {
  it('washes the panel in the band tone, through the accent PAIR, FLATTENED', () => {
    const washes = new Set<string>();
    for (const [score, band] of [[21, 'cold'], [55, 'warm'], [91, 'hot']] as const) {
      mount(<LeadScoreCard score={score} accessibilityLabel="Lead score" testID="s" />);
      const painted = getComputedStyle(byTestId('s-header')).backgroundColor;
      washes.add(painted);
      expect([band, painted]).toEqual([band, normalise(paintFor(band).header)]);

      // It is the tone's SUBTLE member, composited over the card — the tint
      // itself is `rgba()`, and every reader in `color-contrast.ts` treats a
      // colour as opaque, so painting the raw token means the rungs derived
      // from it are measured against solid emerald.
      const raw = resolveAccentColors(theme.colors, LEAD_SCORE_BAND[band].tone, 'subtle').background;
      expect(raw).toMatch(/rgba|\//);
      expect([band, painted]).not.toEqual([band, normalise(raw)]);
      expect(getComputedStyle(byTestId('s-header')).backgroundColor).not.toContain('rgba');

      // And it is a real step off the card, not a wash nobody can see.
      expect([
        band,
        contrastRatio(paintFor(band).header, theme.colors.card) > 1.02,
      ]).toEqual([band, true]);
    }
    // Three bands, three different washes — the tint IS the band.
    expect(washes.size).toBe(3);
  });

  it('reads the label and the verdict off the WASH, not off the card', () => {
    // The whole point of publishing the panel as a surface. A rung read off the
    // card renders, and measures wrong on the tint underneath it.
    for (const mode of ['light', 'dark'] as const) {
      mount(<LeadScoreCard score={91} accessibilityLabel="Lead score" testID="s" />, mode);
      const paint = paintFor('hot');
      expect([mode, getComputedStyle(byTestId('s-band')).color]).toEqual([
        mode,
        normalise(paint.headerText.text),
      ]);
      expect([mode, getComputedStyle(byTestId('s-title')).color]).toEqual([
        mode,
        normalise(paint.headerText.textSecondary),
      ]);
      // And it clears AA on the fill it actually lands on.
      expect([mode, contrastRatio(paint.headerText.textSecondary, paint.header) >= AA_TEXT]).toEqual(
        [mode, true],
      );
    }
  });

  it('draws the band as the VERDICT word, at title size, carrying no pill of its own', () => {
    mount(<LeadScoreCard score={91} accessibilityLabel="Lead score" testID="s" />);
    const band = byTestId('s-band');
    expect(band.textContent).toBe('Hot');
    const style = getComputedStyle(band);
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.fontSize).toBe('24px');

    mount(<LeadScoreCard score={21} accessibilityLabel="Lead score" testID="s" />);
    expect(byTestId('s-band').textContent).toBe('Cold');
  });

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

  it('lets an app with its own thresholds override the band and its word', () => {
    mount(<LeadScoreCard score={21} band="hot" bandLabel="Priority" accessibilityLabel="Lead score" testID="s" />);
    expect(byTestId('s-band').textContent).toBe('Priority');
    // The override moves the WASH too — the tint is the band, not the score.
    expect(getComputedStyle(byTestId('s-header')).backgroundColor).toBe(
      normalise(paintFor('hot').header),
    );
    expect(getComputedStyle(byTestId('s-header')).backgroundColor).not.toBe(
      normalise(paintFor('cold').header),
    );
  });

  it('fills the RING with the accent and reads its TRACK off the wash', () => {
    // A green ring claims "healthy", which is a different claim from "91 of
    // 100". The arc is the meter's own fill whatever band the score falls in;
    // the unearned part is a step off the panel it sits on, because
    // `stat-bar`'s default rail is a neutral computed for the PAGE.
    for (const score of [21, 55, 91]) {
      mount(<LeadScoreCard score={score} accessibilityLabel="Lead score" testID="s" />);
      const band = score === 21 ? 'cold' : score === 55 ? 'warm' : 'hot';
      const paint = paintFor(band);
      expect([score, ringStroke('s-ring-arc')]).toEqual([score, resolveMeterColors(theme).fill]);
      expect([score, ringStroke('s-ring-track')]).toEqual([score, paint.track]);
      expect([score, ringStroke('s-ring-track')]).not.toEqual([
        score,
        resolveMeterColors(theme).track,
      ]);
      // Named negatives: the three tones the arc used to be painted with.
      for (const tone of ['success', 'warning', 'info'] as const) {
        expect(ringStroke('s-ring-arc')).not.toBe(
          resolveAccentColors(theme.colors, tone, 'solid').background,
        );
      }
    }
  });
});

describe('the factors are ROWS on their own panel — there are no bars', () => {
  it('draws exactly ONE progressbar in the whole card: the score', () => {
    // Five bars down a card is a chart pretending to be a measurement, and it
    // announces the same role five more times. The contribution is a NUMBER.
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />);
    expect(container.querySelectorAll('[role="progressbar"]').length).toBe(1);
    expect(container.querySelectorAll('[role="progressbar"]')[0]).toBe(byTestId('s-ring'));
  });

  it('paints the factors panel a real step off the card, and reads its text off THAT', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(
        <LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />,
        mode,
      );
      const paint = paintFor('hot');
      expect([mode, getComputedStyle(byTestId('s-factors')).backgroundColor]).toEqual([
        mode,
        normalise(surfaceFillOn(theme, theme.colors.card)),
      ]);
      // The panel is NOT the header: two panels, two fills, two sets of rungs.
      expect([mode, paint.panel]).not.toEqual([mode, paint.header]);
      expect([mode, getComputedStyle(byTestId('s-factor-Fits the ideal profile-points')).color]).toEqual([
        mode,
        normalise(paint.panelText.text),
      ]);
    }
  });

  it('reads the label and its detail as ONE line, right-aligning the number', () => {
    mount(<LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />);
    const row = byTestId('s-factor-No decision-maker identified');
    expect(row.textContent).toContain('No decision-maker identified: Only one contact');
    expect(getComputedStyle(row).justifyContent).toBe('space-between');
    expect(byTestId('s-factor-No decision-maker identified-points').textContent).toBe('-9');
    expect(byTestId('s-factor-Fits the ideal profile-points').textContent).toBe('+24');
    // The pure rule, at the boundary the row reads it from.
    expect(factorLine('Budget', 'unconfirmed')).toBe('Budget: unconfirmed');
    expect(factorLine('Budget')).toBe('Budget');
    expect(factorLine('Budget', '')).toBe('Budget');
  });

  it('marks a positive factor with the accent and a negative one with the quiet neutral', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(
        <LeadScoreCard score={82} accessibilityLabel="Lead score" factors={FACTORS} testID="s" />,
        mode,
      );
      const paint = paintFor('hot');
      const positive = getComputedStyle(byTestId('s-factor-Fits the ideal profile-mark')).backgroundColor;
      const negative = getComputedStyle(
        byTestId('s-factor-No decision-maker identified-mark'),
      ).backgroundColor;

      expect([mode, positive]).toEqual([mode, normalise(resolveMeterColors(theme).fill)]);
      expect([mode, negative]).toEqual([mode, normalise(paint.negativeMark)]);
      expect(positive).not.toBe(negative);

      // Neither is a status fill — named, so a revert goes red.
      for (const tone of ['success', 'error'] as const) {
        const status = normalise(resolveAccentColors(theme.colors, tone, 'solid').background);
        expect([mode, tone, positive]).not.toEqual([mode, tone, status]);
        expect([mode, tone, negative]).not.toEqual([mode, tone, status]);
      }

      // And the quiet mark READS on the panel it is drawn on, which is not the
      // card and not the rail either.
      expect([mode, contrastRatio(paint.negativeMark, paint.panel) >= AA_GRAPHICAL]).toEqual([
        mode,
        true,
      ]);
    }
  });

  it('formats a contribution the way it is drawn', () => {
    expect(formatContribution(24)).toBe('+24');
    expect(formatContribution(-9)).toBe('-9');
    expect(formatContribution(0)).toBe('0');
  });

  it('draws no factor panel at all when there are none', () => {
    mount(<LeadScoreCard score={38} accessibilityLabel="Lead score" testID="s" />);
    expect(queryTestId('s-factors')).toBeNull();
  });
});

describe('the trend', () => {
  it('is a QUIET line on the wash — the arrow carries the direction', () => {
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
        normalise(paintFor('hot').headerText.textSecondary),
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
