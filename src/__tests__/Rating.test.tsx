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
import { Rating, RatingBar, RatingInput } from '../rating';
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

// ---------------------------------------------------------------------------

/** A real `keydown` on the node, the way a browser delivers one. */
function keyDown(el: HTMLElement, key: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function stars(): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="radio"]')) as HTMLElement[];
}

/**
 * The `d` of the FILLED star glyph, read off `Rating` — which draws
 * `RiStarFill` — rather than hard-coded, so the count below survives the icon
 * being redrawn. Comparing FILL COLOURS would not: with every star chosen there
 * is no unfilled one to compare against.
 */
let filledPath = '';

beforeAll(() => {
  const probe = document.createElement('div');
  document.body.appendChild(probe);
  const probeRoot = createRoot(probe);
  act(() => {
    probeRoot.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Rating value={5} testID="probe" />
      </BloomThemeProvider>,
    );
  });
  filledPath = probe.querySelector('[data-testid="probe"] svg path')?.getAttribute('d') ?? '';
  act(() => probeRoot.unmount());
  probe.remove();
});

/** How many stars draw the filled glyph. */
function filledCount(): number {
  return stars().filter((star) => star.querySelector('svg path')?.getAttribute('d') === filledPath)
    .length;
}

describe('RatingInput', () => {
  it('is a named radiogroup of named radios, one checked', () => {
    mount(<RatingInput value={4} onChange={() => {}} accessibilityLabel="Overall rating" testID="ri" />);
    const group = byTestId('ri');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Overall rating');
    const options = stars();
    expect(options).toHaveLength(5);
    expect(options.map((o) => o.getAttribute('aria-label'))).toEqual([
      '1 star',
      '2 stars',
      '3 stars',
      '4 stars',
      '5 stars',
    ]);
    expect(options.map((o) => o.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'false',
      'true',
      'false',
    ]);
  });

  it('nothing chosen: no star is checked', () => {
    mount(<RatingInput value={null} onChange={() => {}} accessibilityLabel="Cleanliness" testID="ri" />);
    expect(stars().map((o) => o.getAttribute('aria-checked'))).toEqual(Array(5).fill('false'));
  });

  it('a press chooses that star, and re-choosing the chosen one is a no-op', () => {
    const onChange = jest.fn();
    mount(<RatingInput value={3} onChange={onChange} accessibilityLabel="Overall" testID="ri" />);
    click(byTestId('ri-star-5'));
    expect(onChange).toHaveBeenCalledWith(5);
    onChange.mockClear();
    click(byTestId('ri-star-3'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('the arrow keys, Home and End move AND choose', () => {
    const onChange = jest.fn();
    mount(<RatingInput value={3} onChange={onChange} accessibilityLabel="Overall" testID="ri" />);
    const tabStop = byTestId('ri-star-3');
    keyDown(tabStop, 'ArrowRight');
    expect(onChange).toHaveBeenLastCalledWith(4);
    keyDown(tabStop, 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith(4);
    keyDown(tabStop, 'ArrowLeft');
    expect(onChange).toHaveBeenLastCalledWith(2);
    keyDown(tabStop, 'ArrowDown');
    expect(onChange).toHaveBeenLastCalledWith(2);
    keyDown(tabStop, 'Home');
    expect(onChange).toHaveBeenLastCalledWith(1);
    keyDown(tabStop, 'End');
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('the arrow keys stop at the ends instead of wrapping', () => {
    const onChange = jest.fn();
    mount(<RatingInput value={1} onChange={onChange} accessibilityLabel="Overall" testID="ri" />);
    keyDown(byTestId('ri-star-1'), 'ArrowLeft');
    expect(onChange).not.toHaveBeenCalled();
    mount(<RatingInput value={5} onChange={onChange} accessibilityLabel="Overall" testID="ri" />);
    keyDown(byTestId('ri-star-5'), 'ArrowRight');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('with nothing chosen, ArrowRight starts at one star', () => {
    const onChange = jest.fn();
    mount(<RatingInput value={null} onChange={onChange} accessibilityLabel="Overall" testID="ri" />);
    keyDown(byTestId('ri-star-1'), 'ArrowRight');
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('the tab stop roves onto the chosen star, and is the first one while nothing is chosen', () => {
    mount(<RatingInput value={4} onChange={() => {}} accessibilityLabel="Overall" testID="ri" />);
    expect(stars().map((o) => o.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0', '-1']);
    mount(<RatingInput value={null} onChange={() => {}} accessibilityLabel="Overall" testID="ri" />);
    expect(stars().map((o) => o.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1']);
  });

  it('draws one filled star per chosen star, and none while nothing is chosen', () => {
    mount(<RatingInput value={3} onChange={() => {}} accessibilityLabel="Overall" testID="ri" />);
    expect(filledCount()).toBe(3);
    mount(<RatingInput value={null} onChange={() => {}} accessibilityLabel="Overall" testID="ri" />);
    expect(filledCount()).toBe(0);
  });

  it('disabled: no tab stop, aria-disabled on the group, and a press changes nothing', () => {
    const onChange = jest.fn();
    mount(<RatingInput value={2} onChange={onChange} disabled accessibilityLabel="Overall" testID="ri" />);
    expect(byTestId('ri').getAttribute('aria-disabled')).toBe('true');
    expect(stars().map((o) => o.getAttribute('tabindex'))).toEqual(Array(5).fill('-1'));
    click(byTestId('ri-star-5'));
    keyDown(byTestId('ri-star-2'), 'ArrowRight');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('max sets the number of stars, and the value is clamped into it', () => {
    mount(<RatingInput max={10} value={7} onChange={() => {}} accessibilityLabel="Score" testID="ri" />);
    expect(stars()).toHaveLength(10);
    expect(filledCount()).toBe(7);
    mount(<RatingInput max={5} value={99} onChange={() => {}} accessibilityLabel="Score" testID="ri" />);
    expect(filledCount()).toBe(5);
    expect(stars()[4]!.getAttribute('aria-checked')).toBe('true');
  });

  it('formatStarLabel replaces the English star names', () => {
    mount(
      <RatingInput
        value={2}
        onChange={() => {}}
        accessibilityLabel="Nota"
        formatStarLabel={(n) => (n === 1 ? '1 estrella' : `${n} estrellas`)}
        testID="ri"
      />,
    );
    expect(stars().map((o) => o.getAttribute('aria-label'))).toEqual([
      '1 estrella',
      '2 estrellas',
      '3 estrellas',
      '4 estrellas',
      '5 estrellas',
    ]);
  });

  it('sizes the star 24 / 32 / 40', () => {
    mount(<RatingInput size="small" value={1} onChange={() => {}} accessibilityLabel="a" testID="ri" />);
    expect(byTestId('ri-star-1').querySelector('svg')?.getAttribute('width')).toBe('24');
    mount(<RatingInput value={1} onChange={() => {}} accessibilityLabel="a" testID="ri" />);
    expect(byTestId('ri-star-1').querySelector('svg')?.getAttribute('width')).toBe('32');
    mount(<RatingInput size="large" value={1} onChange={() => {}} accessibilityLabel="a" testID="ri" />);
    expect(byTestId('ri-star-1').querySelector('svg')?.getAttribute('width')).toBe('40');
  });
});
