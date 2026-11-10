/**
 * A desktop PLATFORM's menus (`useDesktopPlatform()`: an adapter reporting
 * `window` or `pointer`): 22px rows of the desktop body, a 10px panel corner
 * round 5px rows, no 266px floor, the accent as the highlight with its
 * foreground on everything the row draws, the secondary and tertiary label
 * levels, a clear shadow and the arrow pointer. Without the adapter every value
 * is what it was.
 *
 * Rendered through the native row (jest resolves `.tsx`); the row shell is the
 * one both platforms draw.
 */
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { DESKTOP_MENU_GEOMETRY } from '../appearance/control-geometry';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '../dropdown-menu';
import { MenuSurfaceProvider } from '../floating/context';
import { DESKTOP_MENU_SHADOW, MENU_SHADOW, resolveMenuPalette } from '../floating/menu-palette';
import { PopupPanelChrome } from '../floating/PopupPanel';
import { resolveMenuDensity } from '../floating/use-menu-density';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { buildTheme } from '../theme/build-theme';
import { resolveLabelColors } from '../theme/label-colors';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { DESKTOP_TEXT_STYLES } from '../typography/desktop-scale';
import { TYPE_SCALE } from '../typography/scale';
import { resolvedStyle } from './support/rendered-style';

const DESKTOP_WINDOW: PlatformSurfaceAdapter = {
  platform: 'desktop',
  capabilities: new Set(['window']),
};

const theme = buildTheme('teal', 'light');

function renderMenu(adapter: PlatformSurfaceAdapter | null, rows: React.ReactNode) {
  return render(
    <PlatformSurfaceProvider value={adapter}>
      <BloomThemeProvider mode="light" colorPreset="teal" surfaces="tinted">
        <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'dropdown' }}>
          {rows}
        </MenuSurfaceProvider>
      </BloomThemeProvider>
    </PlatformSurfaceProvider>,
  );
}

/** The row's classes, which react-native-css carries in its style as `{ $$css, className }`. */
const classesOf = (screen: ReturnType<typeof render>, label: string) =>
  JSON.stringify(screen.getByLabelText(label).props.style);

const rowStyle = (screen: ReturnType<typeof render>, label: string) =>
  resolvedStyle(screen.getByLabelText(label).props.style);

describe('desktop menu density', () => {
  it('is one compact geometry at every size on a desktop platform', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const density = resolveMenuDensity(size, false, true);
      expect(density).toMatchObject({
        desktop: true,
        height: 22,
        panelPadding: 5,
        panelRadius: 10,
        rowRadius: 5,
        gap: 0,
        separatorMargin: 5,
        gutter: 20,
        indicatorSize: 12,
        leadingSize: 16,
        minWidth: 120,
      });
      expect(density.rowType).toEqual(DESKTOP_TEXT_STYLES.body);
    }
  });

  it('leaves every size as it was off a desktop platform', () => {
    const md = resolveMenuDensity('md', false);
    expect(md).toMatchObject({
      desktop: false,
      height: 28,
      panelPadding: 6,
      panelRadius: 16,
      rowRadius: null,
      gutter: 36,
      minWidth: 266,
      panelClass: 'p-[6px]',
      separatorClass: '-mx-[6px] my-[2px] h-px',
    });
    expect(md.rowType).toEqual(TYPE_SCALE['body-regular']);
    expect(resolveMenuDensity('md', true).height).toBe(44);
  });
});

describe('desktop menu palette', () => {
  it('highlights with the accent and uses the label levels and the clear shadow', () => {
    const palette = resolveMenuPalette(theme, true);
    const labels = resolveLabelColors(theme);
    expect(palette.rowActive).toEqual({
      fill: theme.colors.primary,
      text: theme.colors.primaryForeground,
    });
    expect(palette.textSecondary).toBe(labels.secondary);
    expect(palette.textDisabled).toBe(labels.tertiary);
    expect(palette.shadow).toBe(DESKTOP_MENU_SHADOW.light);
  });

  it('is unchanged off a desktop platform', () => {
    const palette = resolveMenuPalette(theme);
    expect(palette.rowActive).toBeNull();
    expect(palette.shadow).toBe(MENU_SHADOW.light);
    expect(palette.rowHighlight).toBe(theme.colors.backgroundSecondary);
  });
});

describe('desktop menu rows', () => {
  it('draws a 22px row of the desktop body, a 5px corner and the arrow pointer', () => {
    const screen = renderMenu(DESKTOP_WINDOW, <DropdownMenuItem>Rename</DropdownMenuItem>);
    const row = rowStyle(screen, 'Rename');
    expect(row.minHeight).toBe(22);
    expect(row.paddingTop).toBe(3);
    expect(row.paddingBottom).toBe(3);
    expect(row.paddingLeft).toBe(8);
    expect(row.paddingRight).toBe(8);
    expect(row.borderRadius).toBe(5);
    expect(row.cursor).toBe('auto');
    expect(classesOf(screen, 'Rename')).toContain('cursor-default');
    expect(classesOf(screen, 'Rename')).not.toContain('cursor-pointer');
    const label = resolvedStyle(screen.getByText('Rename').props.style);
    expect(label).toMatchObject({ fontSize: 13, lineHeight: 16, letterSpacing: -0.08 });
  });

  it('paints the hovered row with the accent and its foreground on label and shortcut', () => {
    const screen = renderMenu(
      DESKTOP_WINDOW,
      <DropdownMenuItem trailing={<DropdownMenuShortcut>Ctrl+R</DropdownMenuShortcut>}>
        Rename
      </DropdownMenuItem>,
    );
    const shortcutRest = resolvedStyle(screen.getByText('Ctrl+R').props.style);
    expect(shortcutRest.color).toBe(resolveLabelColors(theme).secondary);
    expect(shortcutRest.fontSize).toBe(13);
    fireEvent(screen.getByLabelText('Rename'), 'hoverIn');
    expect(rowStyle(screen, 'Rename').backgroundColor).toBe(theme.colors.primary);
    expect(resolvedStyle(screen.getByText('Rename').props.style).color).toBe(
      theme.colors.primaryForeground,
    );
    expect(resolvedStyle(screen.getByText('Ctrl+R').props.style).color).toBe(
      theme.colors.primaryForeground,
    );
  });

  it('marks a checked row with its check in the gutter, not with the highlight', () => {
    const screen = renderMenu(
      DESKTOP_WINDOW,
      <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>
        Wrap Lines
      </DropdownMenuCheckboxItem>,
    );
    const row = rowStyle(screen, 'Wrap Lines');
    expect(row.backgroundColor).toBe('transparent');
    expect(row.paddingLeft).toBe(DESKTOP_MENU_GEOMETRY.gutter);
    const mark = screen
      .getByLabelText('Wrap Lines')
      .findAll(
        (node) =>
          typeof node.type === 'string' &&
          resolvedStyle(node.props.style).width === DESKTOP_MENU_GEOMETRY.indicator &&
          resolvedStyle(node.props.style).position === 'absolute',
      );
    expect(mark).toHaveLength(1);
  });

  it('draws a disabled row in the tertiary label level and never highlights it', () => {
    const screen = renderMenu(DESKTOP_WINDOW, <DropdownMenuItem disabled>Paste</DropdownMenuItem>);
    fireEvent(screen.getByLabelText('Paste'), 'hoverIn');
    expect(rowStyle(screen, 'Paste').backgroundColor).toBe('transparent');
    expect(resolvedStyle(screen.getByText('Paste').props.style).color).toBe(
      resolveLabelColors(theme).tertiary,
    );
  });

  it('sets a group label in the semibold subheadline, secondary', () => {
    const screen = renderMenu(DESKTOP_WINDOW, <DropdownMenuLabel>View</DropdownMenuLabel>);
    expect(resolvedStyle(screen.getByText('View').props.style)).toMatchObject({
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      color: resolveLabelColors(theme).secondary,
    });
  });

  it('keeps today’s row off a desktop platform', () => {
    const screen = renderMenu(null, <DropdownMenuItem>Rename</DropdownMenuItem>);
    const row = rowStyle(screen, 'Rename');
    expect(row.minHeight).toBe(44);
    expect(row.borderRadius).toBeUndefined();
    expect(row.cursor).toBeUndefined();
    expect(classesOf(screen, 'Rename')).toContain('cursor-pointer');
    fireEvent(screen.getByLabelText('Rename'), 'hoverIn');
    expect(rowStyle(screen, 'Rename').backgroundColor).toBe(theme.colors.backgroundSecondary);
    expect(resolvedStyle(screen.getByText('Rename').props.style).fontSize).toBe(14);
  });
});

describe('desktop menu panel', () => {
  it('has a 10px corner, 5px padding, the clear shadow and a 120px floor', () => {
    const screen = render(
      <PlatformSurfaceProvider value={DESKTOP_WINDOW}>
        <BloomThemeProvider mode="light" colorPreset="teal" surfaces="tinted">
          <PopupPanelChrome style={{ opacity: 1 }}>{null}</PopupPanelChrome>
        </BloomThemeProvider>
      </PlatformSurfaceProvider>,
    );
    const panel = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && resolvedStyle(node.props.style).opacity === 1,
    ).map((node) => resolvedStyle(node.props.style))[0]!;
    expect(panel).toMatchObject({
      borderRadius: 10,
      padding: 5,
      minWidth: 120,
      boxShadow: DESKTOP_MENU_SHADOW.light,
    });
  });

  it('keeps its 16px corner and 266px floor off a desktop platform', () => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PopupPanelChrome style={{ opacity: 1 }}>{null}</PopupPanelChrome>
      </BloomThemeProvider>,
    );
    const panel = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && resolvedStyle(node.props.style).opacity === 1,
    ).map((node) => resolvedStyle(node.props.style))[0]!;
    expect(panel).toMatchObject({ borderRadius: 16, minWidth: 266, boxShadow: MENU_SHADOW.light });
  });
});
