/**
 * @jest-environment jsdom
 *
 * `OfferingBadge`, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM: labels, icons, geometry, the tint pair per offering and
 * the over-a-photo variant.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { resolveButtonRamps } from '../button/shared';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import type { Offering } from '../listing-card/types';
import { OfferingBadge } from '../offering-badge';
import {
  OFFERING_BADGE_GEOMETRY,
  OFFERING_LABELS,
  OFFERING_TONES,
  OFFERINGS,
  resolveOfferingBadgePaint,
} from '../offering-badge/shared';
import { resolveAccentColors } from '../theme/accent-colors';
import { APP_COLOR_NAMES } from '../theme/color-presets';
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

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light', colorPreset = 'teal') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset={colorPreset as 'teal'}>
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
const maybe = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const label = (el: HTMLElement) => el.querySelector('[dir="auto"]') as HTMLElement;

describe('OfferingBadge', () => {
  it.each(OFFERINGS.map((o) => [o, OFFERING_LABELS[o]] as const))('%s reads "%s", with its icon hidden', (offering, text) => {
    mount(<OfferingBadge offering={offering} testID="b" />);
    const el = byTestId('b');
    expect(el.textContent).toBe(text);
    expect(el.getAttribute('role')).toBeNull();
    const icon = byTestId('b-icon');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('the four default labels are the housing vocabulary', () => {
    expect(OFFERING_LABELS).toEqual({
      long_term_rent: 'For rent',
      sale: 'For sale',
      short_term_rent: 'Vacation rental',
      exchange: 'Swap',
    });
  });

  it.each([
    ['small', 20, '8px', '12'],
    ['medium', 24, '10px', '14'],
  ] as const)('%s: %ipx full pill, %s side padding, %spx icon', (size, height, padding, icon) => {
    mount(<OfferingBadge offering="sale" size={size} icon={false} testID="b" />);
    const style = getComputedStyle(byTestId('b'));
    expect(style.height).toBe(`${height}px`);
    expect(style.paddingLeft).toBe(padding);
    expect(style.paddingRight).toBe(padding);
    expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(height / 2);
    expect(parseFloat(getComputedStyle(label(byTestId('b'))).fontSize)).toBe(size === 'small' ? 12 : 13);
    mount(<OfferingBadge offering="sale" size={size} testID="b" />);
    expect(byTestId('b-icon').querySelector('svg')?.getAttribute('width')).toBe(icon);
    // An icon tucks the leading padding in by 2.
    expect(getComputedStyle(byTestId('b')).paddingLeft).toBe(`${OFFERING_BADGE_GEOMETRY[size].paddingHorizontal - 2}px`);
  });

  it('label, icon={false} and a custom icon override the defaults', () => {
    mount(<OfferingBadge offering="long_term_rent" label="En alquiler" icon={false} testID="b" />);
    expect(byTestId('b').textContent).toBe('En alquiler');
    expect(maybe('b-icon')).toBeNull();
    mount(<OfferingBadge offering="long_term_rent" icon={RiHome4Line} testID="b" />);
    expect(byTestId('b-icon').querySelector('svg')).not.toBeNull();
  });

  it('each offering has its own FIXED tone', () => {
    expect(OFFERING_TONES).toEqual({
      long_term_rent: 'info',
      sale: 'success',
      short_term_rent: 'warning',
      exchange: 'default',
    });
    expect(new Set(Object.values(OFFERING_TONES)).size).toBe(4);
  });

  it.each(['light', 'dark'] as const)('tinted paints the tone\'s subtle pair, distinct per offering, on every preset (%s)', (mode) => {
    for (const preset of APP_COLOR_NAMES) {
      mount(<></>, mode, preset);
      const backgrounds = new Set<string>();
      for (const offering of OFFERINGS) {
        const pair = resolveAccentColors(theme.colors, OFFERING_TONES[offering], 'subtle');
        const paint = resolveOfferingBadgePaint(theme, offering, 'tinted');
        expect(paint.background).toBe(pair.background);
        expect(paint.foreground).toBe(pair.foreground);
        expect(paint.shadow).toBeNull();
        backgrounds.add(paint.background);
      }
      expect(backgrounds.size).toBe(4);
    }
  });

  it.each(['light', 'dark'] as const)('renders the tint on the pill and the label (%s)', (mode) => {
    mount(<OfferingBadge offering="short_term_rent" testID="b" />, mode);
    const paint = resolveOfferingBadgePaint(theme, 'short_term_rent', 'tinted');
    expect(getComputedStyle(byTestId('b')).backgroundColor).toBe(normalise(paint.background));
    expect(getComputedStyle(label(byTestId('b'))).color).toBe(normalise(paint.foreground));
    expect(byTestId('b-icon').innerHTML).toContain(paint.icon);
  });

  it.each(['light', 'dark'] as const)('onMedia is the same light pill with shadow in both modes (%s)', (mode) => {
    mount(<OfferingBadge offering="exchange" variant="onMedia" testID="b" />, mode);
    const { neutral: n } = resolveButtonRamps(theme);
    const style = getComputedStyle(byTestId('b'));
    expect(style.backgroundColor).toBe(normalise(n[50]));
    expect(getComputedStyle(label(byTestId('b'))).color).toBe(normalise(n[900]));
    expect(byTestId('b').style.boxShadow || style.boxShadow).not.toBe('');
  });

  it('is never a control and never animates', () => {
    const offerings: Offering[] = [...OFFERINGS];
    mount(
      <>
        {offerings.map((o) => (
          <OfferingBadge key={o} offering={o} testID={o} />
        ))}
      </>,
    );
    expect(container.querySelectorAll('[role="button"], button, a')).toHaveLength(0);
    for (const o of offerings) {
      const t = getComputedStyle(byTestId(o)).transform;
      expect(t === '' || t === 'none').toBe(true);
    }
  });
});
