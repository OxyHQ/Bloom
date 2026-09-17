/**
 * @jest-environment jsdom
 *
 * `Rating` and `RatingBar`, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: text, colours and accessibility attributes.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Rating, RatingBar } from '../rating';
import { formatRatingValue } from '../rating/Rating';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let colors: { text: string; textSecondary: string } = { text: '', textSecondary: '' };

function ReadColors() {
  const theme = useTheme();
  colors = theme.colors;
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadColors />
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
  probe.style.color = color;
  return probe.style.color;
}

describe('formatRatingValue', () => {
  it('draws up to two decimals and keeps one on a whole number', () => {
    expect(formatRatingValue(5)).toBe('5.0');
    expect(formatRatingValue(4.9)).toBe('4.9');
    expect(formatRatingValue(4.923)).toBe('4.92');
    expect(formatRatingValue('4.8')).toBe('4.8');
  });
});

describe('Rating', () => {
  it('draws the value and a parenthesised count, and reads as one named image', () => {
    mount(<Rating value={4.92} count={128} testID="r" />);
    const el = byTestId('r');
    expect(el.textContent).toBe('4.92(128)');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Rated 4.92 out of 5, 128 reviews');
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('the reviews style and a translated reviews label', () => {
    mount(<Rating value={5} count={12} countStyle="reviews" reviewsLabel="avis" testID="r" />);
    expect(byTestId('r').textContent).toBe('5.0· 12 avis');
    expect(byTestId('r').getAttribute('aria-label')).toBe('Rated 5.0 out of 5, 12 avis');
  });

  it('no count: value only, and the name drops the count', () => {
    mount(<Rating value="4.7" testID="r" />);
    expect(byTestId('r').textContent).toBe('4.7');
    expect(byTestId('r').getAttribute('aria-label')).toBe('Rated 4.7 out of 5');
  });

  it('no rating yet: draws and announces newLabel, never a count', () => {
    mount(<Rating value={null} count={3} testID="r" />);
    expect(byTestId('r').textContent).toBe('New');
    expect(byTestId('r').getAttribute('aria-label')).toBe('New');
    mount(<Rating value="" newLabel="Nuevo" testID="r" />);
    expect(byTestId('r').textContent).toBe('Nuevo');
  });

  it('an explicit accessibilityLabel replaces the composed English sentence', () => {
    mount(<Rating value={4.5} count={9} accessibilityLabel="Note 4,5 sur 5" testID="r" />);
    expect(byTestId('r').getAttribute('aria-label')).toBe('Note 4,5 sur 5');
  });

  it.each(['light', 'dark'] as const)('value is text-primary and count text-secondary (%s)', (mode) => {
    mount(<Rating value={4.92} count={128} testID="r" />, mode);
    const [value, count] = Array.from(byTestId('r').querySelectorAll('[dir="auto"]')) as HTMLElement[];
    expect(getComputedStyle(value as HTMLElement).color).toBe(normalise(colors.text));
    expect(getComputedStyle(count as HTMLElement).color).toBe(normalise(colors.textSecondary));
  });

  it('sizes the star 16 at medium and 14 at small', () => {
    mount(<Rating value={4.9} testID="r" />);
    expect(byTestId('r').querySelector('svg')?.getAttribute('width')).toBe('16');
    mount(<Rating value={4.9} size="small" testID="r" />);
    expect(byTestId('r').querySelector('svg')?.getAttribute('width')).toBe('14');
  });
});

describe('RatingBar', () => {
  it('is a named progressbar with the value on its scale and the display as valuetext', () => {
    mount(<RatingBar label="Cleanliness" value={4.9} display="4.9" testID="b" />);
    const bar = byTestId('b-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Cleanliness');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('5');
    expect(bar.getAttribute('aria-valuenow')).toBe('4.9');
    expect(bar.getAttribute('aria-valuetext')).toBe('4.9');
    expect(byTestId('b').textContent).toBe('Cleanliness4.9');
  });

  it('fills value / max of the track, clamped', () => {
    mount(<RatingBar label="5" value={0.86} max={1} testID="b" />);
    expect(byTestId('b-fill').style.width || getComputedStyle(byTestId('b-fill')).width).toBe('86%');
    mount(<RatingBar label="x" value={9} testID="b" />);
    expect(byTestId('b-bar').getAttribute('aria-valuenow')).toBe('5');
    expect(getComputedStyle(byTestId('b-fill')).width).toBe('100%');
    mount(<RatingBar label="x" value={-1} testID="b" />);
    expect(getComputedStyle(byTestId('b-fill')).width).toBe('0%');
  });

  it('the bar is 96 wide by default and flexes when the label has a width', () => {
    mount(<RatingBar label="Value" value={4} testID="b" />);
    expect(getComputedStyle(byTestId('b-bar')).width).toBe('96px');
    mount(<RatingBar label="5" labelWidth={12} value={4} testID="b" />);
    expect(getComputedStyle(byTestId('b-bar')).width).not.toBe('96px');
    expect(getComputedStyle(byTestId('b-bar')).flexGrow).toBe('1');
  });
});
