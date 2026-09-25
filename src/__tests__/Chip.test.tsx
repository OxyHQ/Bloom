/**
 * @jest-environment jsdom
 *
 * `Chip`, rendered through the REAL react-native-web so the assertions read the
 * emitted DOM: the rung geometry, the four fills, the state ARIA each role
 * carries, and the focus-ring colour — which is the one property of this
 * component that nothing could see.
 *
 * THE RING. `Chip` set `--bloom-chip-ring` to its own LABEL colour, which is
 * the one colour guaranteed to be invisible against the chip: on a solid chip
 * the label is white and so was the ring (measured 1.09:1 in light mode; black
 * on black in dark). It renders, the custom property is present and spelled
 * correctly, and it carries a real colour — so a prop-level test, a snapshot
 * and a screenshot with a mouse all agree it is fine. Only a keyboard user on a
 * solid chip ever saw it, and only as "the ring did not appear".
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Chip, ChipRow, CHIP_GEOMETRY, chipRowOverflow, resolveChipPaint, resolveChipRing } from '../chip';
import { resolveButtonRamps } from '../button/shared';
import { resolveAccentColors } from '../theme/accent-colors';
import { APP_COLOR_NAMES } from '../theme/color-presets';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { ChipSize } from '../chip';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light', colorPreset = 'blue') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset={colorPreset as 'blue'}>
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

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

/** Relative luminance, for a contrast ratio. */
function luminance(color: string): number {
  const [r, g, b] = normalise(color)
    .replace(/[^0-9,.]/g, '')
    .split(',')
    .slice(0, 3)
    .map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05);
}

describe('Chip rungs', () => {
  it.each([
    ['small', 24, 6],
    ['medium', 24, 6],
    ['large', 28, 6],
    ['xl', 32, 12],
    ['2xl', 40, 16],
  ] as const)('%s is %ipx tall with %ipx sides', (size, height, padding) => {
    mount(
      <Chip size={size} onPress={() => {}} testID="c">
        Filter
      </Chip>,
    );
    const style = getComputedStyle(byTestId('c'));
    expect(style.height).toBe(`${height}px`);
    expect(style.paddingLeft).toBe(`${padding}px`);
    expect(style.paddingRight).toBe(`${padding}px`);
    expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(height / 2);
  });

  it('the two new rungs are the ones five families had drawn by hand', () => {
    // 32 with 12px sides (the filter/segment pill) and 40 with 16 (the filters
    // sheet). Written as an EQUALITY: a rung drifting by a pixel puts every
    // folded family back where it started, silently.
    expect(CHIP_GEOMETRY.xl).toMatchObject({ height: 32, paddingHorizontal: 12, iconGap: 8, icon: 16, minWidth: 0 });
    expect(CHIP_GEOMETRY['2xl']).toMatchObject({ height: 40, paddingHorizontal: 16, iconGap: 8, icon: 18, minWidth: 48 });
  });

  it('the 2xl rung keeps a one-character label from collapsing to a dot', () => {
    mount(
      <Chip size="2xl" variant="inverted" onPress={() => {}} testID="c">
        1
      </Chip>,
    );
    expect(parseFloat(getComputedStyle(byTestId('c')).minWidth)).toBe(48);
  });

  it('sizes the icon slot to the rung, not to the icon the caller passed', () => {
    for (const size of ['small', 'xl', '2xl'] as ChipSize[]) {
      mount(
        <Chip size={size} startIcon={<span data-testid="glyph" />} onPress={() => {}} testID="c">
          Filter
        </Chip>,
      );
      const slot = byTestId('glyph').parentElement as HTMLElement;
      expect(getComputedStyle(slot).width).toBe(`${CHIP_GEOMETRY[size].icon}px`);
    }
  });
});

describe('Chip focus ring', () => {
  it('reads the ACCENT ramp, never the chip label', () => {
    mount(
      <Chip variant="solid" color="primary" onPress={() => {}} testID="c">
        Filter
      </Chip>,
    );
    const { accent } = resolveButtonRamps(theme);
    const ring = byTestId('c').style.getPropertyValue('--bloom-chip-ring');
    expect(normalise(ring)).toBe(normalise(accent[500]));
    expect(resolveChipRing(theme)).toBe(accent[500]);
  });

  it.each(['light', 'dark'] as const)(
    'clears 4.2:1 against the PAGE on every preset — which is where an offset ring sits (%s)',
    (mode) => {
      // The ring is `outline-offset: 2px`, so it is drawn OUTSIDE the pill: what
      // it has to be visible against is the page, not the chip. The worst pair
      // over 64 presets x 2 modes measures 4.24 (dark `mono`), so the floor is a
      // LITERAL 4.2 rather than anything derived from the ramp — a change that
      // moved both sides together would otherwise measure nothing.
      const worst: Array<{ preset: string; ratio: number }> = [];
      for (const preset of APP_COLOR_NAMES) {
        mount(<></>, mode, preset);
        worst.push({ preset, ratio: contrast(resolveChipRing(theme), theme.colors.background) });
      }
      expect(worst.filter((w) => w.ratio < 4.2)).toEqual([]);
    },
  );

  it('the colour it used to read is the one that could not work', () => {
    // `--bloom-chip-ring` was `colors.foreground` — the chip's own LABEL. On a
    // solid chip the label is white, so the ring was white on a white page:
    // measured 1.09 in light mode. Pinned as an inequality against the fix so
    // the two cannot be swapped back without this going red.
    mount(<></>, 'light', 'blue');
    const solid = resolveChipPaint(theme, { tone: 'primary', variant: 'solid', selected: false });
    const old = contrast(solid.foreground, theme.colors.background);
    const now = contrast(resolveChipRing(theme), theme.colors.background);
    expect(old).toBeLessThan(1.2);
    expect(now).toBeGreaterThan(4.2);
  });
});

describe('Chip inverted', () => {
  it.each(['light', 'dark'] as const)(
    'turns the page reading pair over when selected, and is a hairline at rest (%s)',
    (mode) => {
      mount(
        <>
          <Chip size="2xl" variant="inverted" onPress={() => {}} testID="rest">
            Any
          </Chip>
          <Chip size="2xl" variant="inverted" selected onPress={() => {}} testID="on">
            Any
          </Chip>
        </>,
        mode,
      );
      const rest = getComputedStyle(byTestId('rest'));
      const on = getComputedStyle(byTestId('on'));
      expect(rest.backgroundColor).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
      expect(rest.borderTopWidth).toBe('1px');
      expect(on.backgroundColor).toBe(normalise(theme.colors.text));
      // Legible by construction: it is the page's own pair, inverted.
      expect(contrast(theme.colors.text, theme.colors.background)).toBeGreaterThan(4.5);
    },
  );

  it('does not promote to the brand tone the way the accent fills do', () => {
    mount(<></>);
    const inverted = resolveChipPaint(theme, { tone: 'default', variant: 'inverted', selected: true });
    const promoted = resolveAccentColors(theme.colors, 'primary', 'subtle');
    expect(inverted.background).not.toBe(promoted.background);
    expect(inverted.background).toBe(theme.colors.text);
  });

  it('answers hover with its border, which is the only state a fill-less pill can show', () => {
    mount(<></>);
    expect(resolveChipPaint(theme, { tone: 'default', variant: 'inverted', selected: false }).hoveredBorder).toBe(
      theme.colors.text,
    );
    expect(resolveChipPaint(theme, { tone: 'default', variant: 'subtle', selected: false }).hoveredBorder).toBeNull();
  });
});

describe('Chip role and state', () => {
  it.each([
    ['button', 'aria-pressed'],
    ['checkbox', 'aria-checked'],
    ['radio', 'aria-checked'],
    ['tab', 'aria-selected'],
  ] as const)('a %s carries %s and nothing else', (role, attribute) => {
    mount(
      <Chip role={role} selected onPress={() => {}} accessibilityLabel="Songs" testID="c">
        Songs
      </Chip>,
    );
    const el = byTestId('c');
    expect(el.getAttribute('role')).toBe(role);
    expect(el.getAttribute(attribute)).toBe('true');
    // The state attribute is a property of the ROLE: `aria-pressed` on a radio
    // or a tab is invalid, and so is `aria-selected` on a button.
    for (const other of ['aria-pressed', 'aria-checked', 'aria-selected']) {
      if (other !== attribute) expect(el.getAttribute(other)).toBeNull();
    }
  });

  it.each([true, false])('a checkbox chip spells aria-checked="%s" and toggles through onCheckedChange', (checked) => {
    const onCheckedChange = jest.fn();
    mount(
      <Chip role="checkbox" checked={checked} onCheckedChange={onCheckedChange} testID="c">
        Wi-Fi
      </Chip>,
    );
    const el = byTestId('c');
    expect(el.getAttribute('role')).toBe('checkbox');
    expect(el.getAttribute('aria-checked')).toBe(String(checked));
    expect(el.getAttribute('aria-pressed')).toBeNull();
    act(() => {
      el.click();
    });
    expect(onCheckedChange).toHaveBeenCalledWith(!checked);
  });

  it('is not a control at all without onPress', () => {
    mount(
      <Chip testID="c" accessibilityLabel="Tag">
        Tag
      </Chip>,
    );
    expect(byTestId('c').getAttribute('role')).toBeNull();
    expect(byTestId('c').getAttribute('aria-pressed')).toBeNull();
  });
});

describe('ChipRow', () => {
  it('names the row on the element the caller can find, and puts the pills in it', () => {
    mount(
      <ChipRow role="radiogroup" accessibilityLabel="Bedrooms" testID="row">
        <Chip role="radio" onPress={() => {}} testID="row-any">
          Any
        </Chip>
      </ChipRow>,
    );
    const row = byTestId('row');
    expect(row.getAttribute('role')).toBe('radiogroup');
    expect(row.getAttribute('aria-label')).toBe('Bedrooms');
    expect(row.contains(byTestId('row-any'))).toBe(true);
  });

  it('names the close button after the chip, not "Remove" five times', () => {
    mount(
      <ChipRow testID="row">
        <Chip onClose={() => {}}>Furnished</Chip>
        <Chip onClose={() => {}} closeLabel="Clear the date filter">
          {'Oct 3 – 9'}
        </Chip>
      </ChipRow>,
    );
    const names = [...container.querySelectorAll('[role="button"]')].map((n) => n.getAttribute('aria-label'));
    expect(names).toContain('Remove Furnished');
    expect(names).toContain('Clear the date filter');
  });

  it('cannot widen the column it sits in — the row scrolls, not the page', () => {
    // A flex item's automatic minimum size is its content's width, so without
    // `min-width: 0` a row of pills wider than the screen pushes its PARENT
    // wide and the document scrolls sideways. Measured at 390: 1552px.
    mount(
      <ChipRow testID="row">
        <Chip onPress={() => {}}>All</Chip>
      </ChipRow>,
    );
    expect(byTestId('row').style.minWidth).toBe('0px');
  });

  it('shows no fade until there is something behind it', () => {
    // jsdom lays nothing out, so every measurement is 0 — which is exactly the
    // first-render state the fade must not appear in.
    mount(
      <ChipRow testID="row">
        <Chip onPress={() => {}}>All</Chip>
      </ChipRow>,
    );
    expect(container.querySelector('[data-testid="row-fade-start"]')).toBeNull();
    expect(container.querySelector('[data-testid="row-fade-end"]')).toBeNull();
  });

  it('decides each edge from the offset, with 1px of slack', () => {
    expect(chipRowOverflow({ x: 0, viewport: 0, content: 0 })).toEqual({ previous: false, next: false });
    expect(chipRowOverflow({ x: 0, viewport: 300, content: 300 })).toEqual({ previous: false, next: false });
    expect(chipRowOverflow({ x: 0, viewport: 300, content: 900 })).toEqual({ previous: false, next: true });
    expect(chipRowOverflow({ x: 300, viewport: 300, content: 900 })).toEqual({ previous: true, next: true });
    expect(chipRowOverflow({ x: 600, viewport: 300, content: 900 })).toEqual({ previous: true, next: false });
  });
});
