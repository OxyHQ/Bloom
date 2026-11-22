/**
 * The renewed `Popover` panel: the floating surface, resolved inline.
 *
 * Three things are pinned here, each at the boundary jest can actually see:
 *
 *  1. `surface.ts` — the resolved chrome (266 / 16 / 1px / p-2.5 /
 *     `shadow-dropdown`, menu-palette colours in light AND dark).
 *  2. `Popover.web.tsx` hands `FloatingPanel` that chrome FIRST and the caller's
 *     `style` after it, at the panel's 8px offset — asserted on a mocked
 *     `FloatingPanel`, since the real one needs a measured anchor.
 *  3. The panel parts render the ramp step and palette colour the panel uses, and
 *     a caller `style` goes over their defaults.
 *
 * What the DOM paints is only visible in a browser — verified against
 * Storybook's `Base/Popover` `StyleOverride` story.
 */
import type React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

import { resolveMenuPalette } from '../floating/menu-palette';
import {
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

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverSeparator,
  PopoverTitle,
} from '../popover/index.web';
import { useTheme } from '../theme/use-theme';

function Themed({
  mode = 'light',
  children,
}: {
  mode?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <BloomThemeProvider mode={mode} colorPreset="oxy">
      {children}
    </BloomThemeProvider>
  );
}

describe('resolvePopoverSurfaceStyle', () => {
  function palettes() {
    let light: ReturnType<typeof resolveMenuPalette> | undefined;
    let dark: ReturnType<typeof resolveMenuPalette> | undefined;
    const Grab = ({ onTheme }: { onTheme: (p: ReturnType<typeof resolveMenuPalette>) => void }) => {
      onTheme(resolveMenuPalette(useTheme()));
      return null;
    };
    render(
      <Themed>
        <Grab onTheme={(p) => (light = p)} />
      </Themed>,
    );
    render(
      <Themed mode="dark">
        <Grab onTheme={(p) => (dark = p)} />
      </Themed>,
    );
    return { light: light!, dark: dark! };
  }

  it.each(['light', 'dark'] as const)('paints the panel from the %s menu palette', (mode) => {
    const palette = palettes()[mode];
    expect(resolvePopoverSurfaceStyle(palette, 1000)).toEqual({
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
    expect([POPOVER_WIDTH, POPOVER_RADIUS, POPOVER_PADDING, POPOVER_SIDE_OFFSET]).toEqual([
      266, 16, 10, 8,
    ]);
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
    expect(chrome).toMatchObject({ width: 266, borderRadius: 16, borderWidth: 1, paddingTop: 8 });
    expect(caller).toBe(callerStyle);
    expect(resolvedStyle(props.style).width).toBe(302);
  });

  it('leaves the numeric maxWidth to FloatingPanel', () => {
    render(
      <Themed>
        <Popover defaultOpen>
          <PopoverContent label="Panel" maxWidth={400}>
            <RNText>Body</RNText>
          </PopoverContent>
        </Popover>
      </Themed>,
    );
    const props = floatingPanelProps[floatingPanelProps.length - 1]!;
    expect(props.maxWidth).toBe(400);
    const [chrome] = props.style as [Record<string, unknown>];
    // The numeric `maxWidth` prop is FloatingPanel's; no default competes with it.
    expect(chrome).not.toHaveProperty('maxWidth');
    expect(chrome.borderRadius).toBe(16);
  });
});

describe('Popover modal (web)', () => {
  beforeEach(() => {
    floatingPanelProps.length = 0;
  });

  function renderedModal(modal: boolean | undefined) {
    render(
      <Themed>
        <Popover defaultOpen modal={modal}>
          <PopoverContent label="Panel">
            <RNText>Body</RNText>
          </PopoverContent>
        </Popover>
      </Themed>,
    );
    return floatingPanelProps[floatingPanelProps.length - 1]?.modal;
  }

  it('stays modal by default, so existing callers keep the caught outside press', () => {
    expect(renderedModal(undefined)).toBe(true);
  });

  it('hands modal={false} to FloatingPanel, which then lays down no backdrop', () => {
    expect(renderedModal(false)).toBe(false);
  });
});

describe('panel parts', () => {
  function palette() {
    let p: ReturnType<typeof resolveMenuPalette> | undefined;
    const Grab = () => {
      p = resolveMenuPalette(useTheme());
      return null;
    };
    render(
      <Themed>
        <Grab />
      </Themed>,
    );
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
        <PopoverTitle testID="label" tone="secondary">
          Users with access
        </PopoverTitle>
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
    expect(
      resolvedStyle(screen.getByTestId('separator', { includeHiddenElements: true }).props.style),
    ).toMatchObject({
      height: 1,
      marginLeft: -8,
      marginRight: -8,
      backgroundColor: p.border,
    });

    const title = resolvedStyle(screen.getByTestId('title').props.style);
    expect(title.color).toBe(p.text);
    expect(title.fontSize).toBe(14);
    const description = resolvedStyle(screen.getByTestId('description').props.style);
    expect(description.color).toBe(p.textSecondary);
    expect(resolvedStyle(screen.getByTestId('label').props.style).color).toBe(p.textSecondary);
  });

  it('takes a caller style over a part default, and keeps the rest', () => {
    const p = palette();
    const screen = render(
      <Themed>
        <PopoverHeader testID="header" style={{ paddingLeft: 16, paddingRight: 16 }}>
          <PopoverTitle testID="title" style={{ marginTop: 4 }}>
            Title
          </PopoverTitle>
        </PopoverHeader>
        <PopoverSeparator testID="separator" style={{ backgroundColor: 'red' }} />
        <PopoverTitle testID="red" style={{ color: 'red' }}>
          Red
        </PopoverTitle>
      </Themed>,
    );

    const header = resolvedStyle(screen.getByTestId('header').props.style);
    expect(header.paddingLeft).toBe(16);
    expect(header.paddingRight).toBe(16);
    expect(header.paddingTop).toBe(4);
    expect(header.flexDirection).toBe('row');

    const separator = resolvedStyle(
      screen.getByTestId('separator', { includeHiddenElements: true }).props.style,
    );
    expect(separator.backgroundColor).toBe('red');
    expect(separator.height).toBe(1);

    expect(resolvedStyle(screen.getByTestId('title').props.style).color).toBe(p.text);
    expect(resolvedStyle(screen.getByTestId('red').props.style).color).toBe('red');
  });
});
