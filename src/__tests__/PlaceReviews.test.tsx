/**
 * @jest-environment jsdom
 *
 * The place-review parts rendered through the REAL react-native-web, so the
 * assertions read the emitted DOM: status colours, geometry and accessibility
 * attributes. Width-driven layouts need `onLayout` (a ResizeObserver jsdom does
 * not have), so every part is given an explicit `layout`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { PlaceReviewCard, PlaceReviewSummary, WriteReviewPrompt } from '../place-reviews';
import { resolveHousingPalette } from '../tenancy/shared';

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

/** A subtle badge paints the tone's tint behind the tone's text colour. */
function expectSubtle(el: HTMLElement, tone: AccentTone) {
  const accent = resolveAccentColors(theme.colors, tone, 'subtle');
  expect(getComputedStyle(el).backgroundColor).toBe(normalise(accent.background));
  expect(el.textContent).not.toBe('');
}

const noop = () => undefined;

describe('PlaceReviewCard', () => {
  const base = {
    authorLabel: 'Tenant, 2021–2023',
    authorInitial: 'T',
    date: 'March 2026',
    rating: 4,
    text: 'Quiet courtyard, slow repairs.',
  };

  it('draws the anonymised author, the overall Rating and category RatingBars', () => {
    mount(
      <PlaceReviewCard
        {...base}
        layout="narrow"
        categories={[
          { label: 'Maintenance', value: 3 },
          { label: 'Noise', value: 4.5, display: '4.5' },
        ]}
        testID="r"
      />,
    );
    expect(byTestId('r-author').textContent).toBe('Tenant, 2021–2023');
    expect(byTestId('r-rating').getAttribute('aria-label')).toBe('Rated 4.0 out of 5');
    const bar = byTestId('r-category-0-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Maintenance');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuetext')).toBe('3.0');
  });

  it('paints the deposit chip success when returned and error when not; recommend success or neutral', () => {
    mount(<PlaceReviewCard {...base} depositReturned wouldRecommend testID="r" />);
    expectSubtle(byTestId('r-deposit'), 'success');
    expect(byTestId('r-deposit').textContent).toBe('Deposit returned');
    expectSubtle(byTestId('r-recommend'), 'success');
    mount(<PlaceReviewCard {...base} depositReturned={false} wouldRecommend={false} testID="r" />);
    expectSubtle(byTestId('r-deposit'), 'error');
    expect(byTestId('r-deposit').textContent).toBe('Deposit not returned');
    expectSubtle(byTestId('r-recommend'), 'default');
    expect(byTestId('r-recommend').textContent).toBe("Wouldn't recommend");
    mount(<PlaceReviewCard {...base} testID="r" />);
    expect(queryTestId('r-deposit')).toBeNull();
  });

  it('the helpful toggle carries aria-pressed, its count in the name, and flips', () => {
    const onHelpfulChange = jest.fn();
    mount(<PlaceReviewCard {...base} helpfulCount={12} helpful onHelpfulChange={onHelpfulChange} onReport={noop} testID="r" />);
    const toggle = byTestId('r-helpful');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Helpful, 12');
    expect(toggle.textContent).toBe('Helpful · 12');
    act(() => toggle.click());
    expect(onHelpfulChange).toHaveBeenCalledWith(false);
    expect(byTestId('r-report').textContent).toBe('Report');
  });

  it('clamps the text to 4 lines by default', () => {
    mount(<PlaceReviewCard {...base} testID="r" />);
    const text = byTestId('r-text');
    expect(getComputedStyle(text).webkitLineClamp ?? text.style.webkitLineClamp).toBe('4');
  });
});

describe('PlaceReviewSummary', () => {
  it('reuses ReviewSummary with the review count and draws the rounded deposit stat', () => {
    mount(
      <PlaceReviewSummary
        rating={3.9}
        title="Rated by past tenants"
        reviewCount={46}
        categories={[{ label: 'Landlord responsiveness', value: 3.4 }]}
        depositReturnedRate={0.8249}
        recommendRate={0.71}
        testID="s"
      />,
    );
    expect(byTestId('s-summary-score').getAttribute('aria-label')).toBe(
      'Rated 3.9 out of 5, Rated by past tenants, 46 reviews',
    );
    expect(byTestId('s-summary-category-0-bar').getAttribute('aria-label')).toBe('Landlord responsiveness');
    expect(byTestId('s-deposit').getAttribute('aria-label')).toBe('Deposit returned in 82% of tenancies');
    expect(byTestId('s-recommend').textContent).toBe('71% would recommend living here');
  });

  it('says "1 review" and omits stats that are not given', () => {
    mount(<PlaceReviewSummary rating={5} reviewCount={1} testID="s" />);
    expect(byTestId('s-summary-score').getAttribute('aria-label')).toBe('Rated 5.0 out of 5, 1 review');
    expect(queryTestId('s-deposit')).toBeNull();
  });
});

describe('WriteReviewPrompt', () => {
  it('names the building in the default copy, and wires start and dismiss', () => {
    const onStart = jest.fn();
    const onDismiss = jest.fn();
    mount(<WriteReviewPrompt buildingTitle="Calle del Olmo 14" onStart={onStart} onDismiss={onDismiss} testID="w" />);
    expect(byTestId('w-title').getAttribute('role')).toBe('heading');
    expect(byTestId('w-title').textContent).toBe('Did you live here?');
    expect(byTestId('w-description').textContent).toBe(
      'Help future tenants of Calle del Olmo 14. Reviews are anonymous.',
    );
    act(() => byTestId('w-start').click());
    expect(onStart).toHaveBeenCalled();
    const dismiss = byTestId('w-dismiss');
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');
    act(() => dismiss.click());
    expect(onDismiss).toHaveBeenCalled();
    expect(getComputedStyle(byTestId('w')).backgroundColor).toBe(normalise(resolveHousingPalette(theme).surface));
  });
});
