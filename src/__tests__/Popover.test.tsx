/**
 * The renewed `Popover` panel: the floating surface, resolved inline.
 *
 * Three things are pinned here, each at the boundary jest can actually see:
 *
 *  1. `surface.ts` — the resolved chrome (266 / 16 / 1px / p-2.5 /
 *     `shadow-dropdown`, menu-palette colours in light AND dark) and the
 *     class-override reader that lets a caller's `className` win the properties
 *     it names instead of being outranked by an inline default.
 *  2. `Popover.web.tsx` hands `FloatingPanel` that chrome FIRST and the caller's
 *     `style` after it, at the panel's 8px offset — asserted on a mocked
 *     `FloatingPanel`, since the real one needs a measured anchor.
 *  3. The panel parts render the ramp step and palette colour the panel uses, and
 *     a caller `className` suppresses the text colour default.
 *
 * What the DOM paints (the cascade between those inline defaults and a real
 * Tailwind class) is only visible in a browser — verified against Storybook's
 * `Base/Popover` `ClassNameOverride` story.
 */
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

import { resolveMenuPalette } from '../floating/menu-palette';
import {
  classChromeOverrides,
  POPOVER_PADDING,
  POPOVER_RADIUS,
  POPOVER_SIDE_OFFSET,
  POPOVER_WIDTH,
  resolvePopoverSurfaceStyle,
} from '../popover/surface';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const floatingPanelProps: Array<Record<string, unknown>> = [];
jest.mock('../floating/FloatingPanel', () => ({
  FloatingPanel: (props: Record<string, unknown>) => {
    floatingPanelProps.push(props);
    return (props as { children?: React.ReactNode }).children ?? null;
  },
}));

// eslint-disable-next-line import/first
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverSeparator,
  PopoverTitle,
} from '../popover/index.web';
// eslint-disable-next-line import/first
import { useTheme } from '../theme/use-theme';

function Themed({ mode = 'light', children }: { mode?: 'light' | 'dark'; children: React.ReactNode }) {
  return (
    <BloomThemeProvider mode={mode} colorPreset="oxy">
      {children}
    </BloomThemeProvider>
  );
}

describe('classChromeOverrides', () => {
  it('reads the chrome properties a caller names, through variants and modifiers', () => {
    expect([...classChromeOverrides('w-[200px] p-2')].sort()).toEqual([
      'paddingBottom',
      'paddingLeft',
      'paddingRight',
      'paddingTop',
      'width',
    ]);
    // `px-0` claims the SIDES only — the top and bottom defaults stay.
    expect([...classChromeOverrides('md:!px-0 dark:bg-red-500 rounded-xl shadow-none')].sort()).toEqual([
      'background',
      'paddingLeft',
      'paddingRight',
      'radius',
      'shadow',
    ]);
    expect([...classChromeOverrides('size-80 max-w-sm overflow-visible')].sort()).toEqual([
      'maxWidth',
      'overflow',
      'width',
    ]);
  });

  it('tells a border WIDTH from a border COLOUR', () => {
    expect([...classChromeOverrides('border-0')]).toEqual(['borderWidth']);
    expect([...classChromeOverrides('border')]).toEqual(['borderWidth']);
    expect([...classChromeOverrides('border-x-2')]).toEqual(['borderWidth']);
    expect([...classChromeOverrides('border-red-500')]).toEqual(['borderColor']);
  });

  it('names the layout properties the panel PARTS set defaults for', () => {
    // The panel itself sets no default for any of these, so
    // `resolvePopoverSurfaceStyle` still ignores them (asserted below). The
    // PARTS do — header/footer padding and gap, the separator's rule — so the
    // scan has to see them or an inline default silently outranks the class.
    expect([...classChromeOverrides('gap-2')]).toEqual(['gap']);
    expect([...classChromeOverrides('flex-row')]).toEqual(['flexDirection']);
    expect([...classChromeOverrides('items-center')]).toEqual(['alignItems']);
    expect([...classChromeOverrides('mt-1')]).toEqual(['marginTop']);
    // Per SIDE, because the utilities are: `px-4` says nothing about the top.
    expect([...classChromeOverrides('px-4')]).toEqual(['paddingLeft', 'paddingRight']);
    // `ps`/`pe` are the LOGICAL start and end — ONE side each, not the pair.
    expect([...classChromeOverrides('ps-4')]).toEqual(['paddingLeft']);
    expect([...classChromeOverrides('me-2')]).toEqual(['marginRight']);
    expect([...classChromeOverrides('p-2')]).toEqual([
      'paddingTop',
      'paddingBottom',
      'paddingLeft',
      'paddingRight',
    ]);
    expect([...classChromeOverrides('h-px')]).toEqual(['height']);
    expect([...classChromeOverrides('text-red-500')]).toEqual(['color']);
    expect(classChromeOverrides('min-h-10').size).toBe(0);
    expect(classChromeOverrides(undefined).size).toBe(0);
  });
});

describe('resolvePopoverSurfaceStyle', () => {
  function palettes() {
    let light: ReturnType<typeof resolveMenuPalette> | undefined;
    let dark: ReturnType<typeof resolveMenuPalette> | undefined;
    const Grab = ({ onTheme }: { onTheme: (p: ReturnType<typeof resolveMenuPalette>) => void }) => {
      onTheme(resolveMenuPalette(useTheme()));
      return null;
    };
    render(<Themed><Grab onTheme={(p) => (light = p)} /></Themed>);
    render(<Themed mode="dark"><Grab onTheme={(p) => (dark = p)} /></Themed>);
    return { light: light!, dark: dark! };
  }

  it.each(['light', 'dark'] as const)('paints the panel from the %s menu palette', (mode) => {
    const palette = palettes()[mode];
    expect(resolvePopoverSurfaceStyle(palette, new Set(), 1000)).toEqual({
      width: POPOVER_WIDTH,
      maxWidth: 968,
      paddingTop: POPOVER_PADDING,
      paddingBottom: POPOVER_PADDING,
      paddingLeft: POPOVER_PADDING,
      paddingRight: POPOVER_PADDING,
      borderRadius: POPOVER_RADIUS,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      boxShadow: palette.shadow,
      overflow: 'hidden',
    });
    expect([POPOVER_WIDTH, POPOVER_RADIUS, POPOVER_PADDING, POPOVER_SIDE_OFFSET]).toEqual([266, 16, 10, 8]);
  });

  it('leaves out exactly the properties the caller’s className names', () => {
    const { light } = palettes();
    const style = resolvePopoverSurfaceStyle(light, classChromeOverrides('w-auto p-0 bg-transparent'));
    expect(style).not.toHaveProperty('width');
    expect(style).not.toHaveProperty('paddingTop');
    expect(style).not.toHaveProperty('backgroundColor');
    expect(style).not.toHaveProperty('maxWidth');
    expect(style.borderRadius).toBe(16);
    expect(style.boxShadow).toBe(light.shadow);
  });
});

describe('PopoverContent (web)', () => {
  beforeEach(() => {
    floatingPanelProps.length = 0;
  });

  it('hands FloatingPanel the resolved chrome first, then the caller style, at an 8px offset', () => {
    const callerStyle = { width: 302 };
    render(
      <Themed>
        <Popover defaultOpen>
          <PopoverContent label="Panel" style={callerStyle}>
            <RNText>Body</RNText>
          </PopoverContent>
        </Popover>
      </Themed>,
    );
    const props = floatingPanelProps[floatingPanelProps.length - 1]!;
    expect(props.surface).toBeUndefined();
    expect(props.sideOffset).toBe(8);
    expect(props.align).toBe('center');
    const [chrome, caller] = props.style as [Record<string, unknown>, unknown];
    expect(chrome).toMatchObject({ width: 266, borderRadius: 16, borderWidth: 1, paddingTop: 10 });
    expect(caller).toBe(callerStyle);
    expect(resolvedStyle(props.style).width).toBe(302);
    // No retired shadcn class survives as a default.
    expect(props.className).toBeUndefined();
  });

  it('passes the caller className through and drops the defaults it names', () => {
    render(
      <Themed>
        <Popover defaultOpen>
          <PopoverContent label="Panel" className="w-[200px] p-2" maxWidth={400}>
            <RNText>Body</RNText>
          </PopoverContent>
        </Popover>
      </Themed>,
    );
    const props = floatingPanelProps[floatingPanelProps.length - 1]!;
    expect(props.className).toBe('w-[200px] p-2');
    expect(props.maxWidth).toBe(400);
    const [chrome] = props.style as [Record<string, unknown>];
    expect(chrome).not.toHaveProperty('width');
    expect(chrome).not.toHaveProperty('paddingLeft');
    // The numeric `maxWidth` prop is FloatingPanel's; no default competes with it.
    expect(chrome).not.toHaveProperty('maxWidth');
    expect(chrome.borderRadius).toBe(16);
  });
});

describe('panel parts', () => {
  function palette() {
    let p: ReturnType<typeof resolveMenuPalette> | undefined;
    const Grab = () => {
      p = resolveMenuPalette(useTheme());
      return null;
    };
    render(<Themed><Grab /></Themed>);
    return p!;
  }

  it('renders the header, title, description, footer and separator', () => {
    const p = palette();
    const screen = render(
      <Themed>
        <PopoverHeader testID="header" leading={<RNText>A</RNText>}>
          <PopoverTitle testID="title">Design team</PopoverTitle>
          <PopoverDescription testID="description">team@example.com</PopoverDescription>
        </PopoverHeader>
        <PopoverSeparator testID="separator" />
        <PopoverFooter testID="footer" />
        <PopoverTitle testID="label" tone="secondary">Users with access</PopoverTitle>
      </Themed>,
    );

    expect(resolvedStyle(screen.getByTestId('header').props.style)).toMatchObject({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 4,
    });
    expect(resolvedStyle(screen.getByTestId('footer').props.style)).toMatchObject({
      gap: 12,
      paddingLeft: 8,
      paddingRight: 8,
      paddingBottom: 8,
    });
    expect(resolvedStyle(screen.getByTestId('separator', { includeHiddenElements: true }).props.style)).toMatchObject({
      height: 1,
      marginLeft: -10,
      marginRight: -10,
      backgroundColor: p.border,
    });

    const title = resolvedStyle(screen.getByTestId('title').props.style);
    expect(title.color).toBe(p.text);
    expect(title.fontSize).toBe(14);
    const description = resolvedStyle(screen.getByTestId('description').props.style);
    expect(description.color).toBe(p.textSecondary);
    expect(resolvedStyle(screen.getByTestId('label').props.style).color).toBe(p.textSecondary);
  });

  it('keeps a part default the caller did not name, and drops the one it did', () => {
    const p = palette();
    const screen = render(
      <Themed>
        <PopoverHeader testID="header" className="px-4">
          <PopoverTitle testID="title" className="mt-1">Title</PopoverTitle>
        </PopoverHeader>
        <PopoverSeparator testID="separator" className="bg-red-500" />
      </Themed>,
    );

    // `px-4` names the padding, so the 8px inline default steps aside — and
    // the header's own row layout, which no utility here names, stays.
    const header = resolvedStyle(screen.getByTestId('header').props.style);
    expect(header.paddingLeft).toBeUndefined();
    expect(header.paddingRight).toBeUndefined();
    expect(header.paddingTop).toBe(4);
    expect(header.flexDirection).toBe('row');

    // `bg-*` names the fill: an inline `backgroundColor` would outrank it on
    // web and the rule would be the palette colour whatever the caller wrote.
    const separator = resolvedStyle(
      screen.getByTestId('separator', { includeHiddenElements: true }).props.style,
    );
    expect(separator.backgroundColor).toBeUndefined();
    expect(separator.height).toBe(1);

    // And the other direction: `mt-1` is not a colour, so the title KEEPS it.
    // The all-or-nothing guard this replaced dropped the colour for any class.
    expect(resolvedStyle(screen.getByTestId('title').props.style).color).toBe(p.text);
  });

  it('applies no text colour default under a caller className', () => {
    const screen = render(
      <Themed>
        <PopoverTitle testID="title" className="text-red-500">Title</PopoverTitle>
      </Themed>,
    );
    const entries = [screen.getByTestId('title').props.style].flat(Infinity) as Array<Record<string, unknown> | null>;
    expect(entries.some((e) => e && typeof e === 'object' && 'color' in e && !('$$css' in e))).toBe(false);
  });
});
