import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_NAMES } from '../theme/color-presets';
import { parseRgba } from '../theme/color-utils';
import { RiComputerLine, RiHomeFill, RiHomeLine, RiKanbanView2, RiSearchLine, RiSettings4Line } from '../icons/remix';
import { Sidebar, SidebarFolder, SidebarItem, SidebarModeSwitcher, SIDEBAR_METRICS } from '../sidebar';
import { resolveSidebarPalette } from '../sidebar/palette';
import type { SidebarMode, SidebarNavItem, SidebarTree } from '../sidebar';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const ITEMS: SidebarNavItem[] = [
  { key: 'home', label: 'Home', icon: RiHomeLine, href: '/home', badge: 152 },
  { key: 'board', label: 'Project board', icon: RiKanbanView2, href: '/board' },
];

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Sidebar', () => {
  it.each(['panel', 'rail'] as const)('forwards secondary long press in the %s variant without navigating', variant => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    const screen = renderIn(<Sidebar variant={variant} items={[{ key: 'folder', label: 'Folder', icon: RiHomeLine, onPress, onLongPress }]} />);
    fireEvent(screen.getByLabelText('Folder'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses canonical surfaces and paired selected colours in every preset and mode', () => {
    const luminance = (color: string) => {
      const rgba = parseRgba(color)!;
      const linear = [rgba.r, rgba.g, rgba.b].map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
    };
    for (const preset of APP_COLOR_NAMES) for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme(preset, mode);
      const palette = resolveSidebarPalette(theme);
      expect(palette.panel).toBe(theme.colors.backgroundSecondary);
      expect(palette.panelBorder).toBe(theme.colors.borderLight);
      expect(palette.selected).toBe(theme.colors.primary);
      expect(palette.selectedForeground).toBe(theme.colors.primaryForeground);
      expect(palette.badgePrimary).toBe(theme.colors.secondary);
      expect(palette.badgePrimaryForeground).toBe(theme.colors.secondaryForeground);
      expect(palette.avatar.pink).toEqual({ background: theme.colors.tertiarySubtle, foreground: theme.colors.tertiarySubtleForeground });
      for (const [fill, foreground] of [[palette.selected, palette.selectedForeground], [palette.badgePrimary, palette.badgePrimaryForeground]]) {
        const a = luminance(fill!); const b = luminance(foreground!);
        expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps the floating panel geometry and tokens', () => {
    const screen = renderIn(<Sidebar testID="sb" items={ITEMS} selected="home" />, 'dark');
    const { colors } = buildTheme('teal', 'dark');
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel).toMatchObject({
      height: '100%',
      flexShrink: 0,
      borderRadius: 24,
      borderWidth: 1,
      paddingTop: 12,
      paddingLeft: 12,
      paddingRight: 12,
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.borderLight,
    });
    expect(panel.paddingHorizontal).toBeUndefined();
  });

  it('surface="plain" drops the panel chrome', () => {
    const screen = renderIn(<Sidebar testID="sb" surface="plain" mobile items={ITEMS} />);
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel.borderWidth).toBeUndefined();
    expect(panel.borderRadius).toBeUndefined();
  });

  it('surface="docked" squares the corners and spends its edge on the ONE hairline facing the content', () => {
    const screen = renderIn(<Sidebar testID="sb" surface="docked" items={ITEMS} />);
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel.borderRadius).toBeUndefined();
    expect(panel.borderWidth).toBeUndefined();
    expect(panel.boxShadow).toBeUndefined();
    const light = resolveSidebarPalette(buildTheme('teal', 'light'));
    expect(panel.height).toBe('100%');
    expect(panel.flexShrink).toBe(0);
    // The END edge, so the hairline faces the content in either direction.
    expect(panel.borderEndWidth).toBe(1);
    expect(panel.borderRightWidth).toBeUndefined();
    expect(panel.backgroundColor).toBe(light.panel);
    // Docked chrome uses the shared hairline against the panel surface.
    expect(panel.borderEndColor).toBe(light.dockedEdge);
    expect(panel.borderEndColor).not.toBe(light.panelBorder);
  });

  it('size drives the row, the glyph and the panel together — and the collapsed width is the square plus the panel', () => {
    for (const [size, expected] of [
      ['sm', { padding: 6, icon: 18, square: 30, collapsed: 46, expanded: 232 }],
      ['md', { padding: 9, icon: 22, square: 40, collapsed: 56, expanded: 260 }],
      ['lg', { padding: 10, icon: 24, square: 44, collapsed: 60, expanded: 300 }],
    ] as const) {
      const metrics = SIDEBAR_METRICS[size];
      expect(metrics.row.padding).toBe(expected.padding);
      expect(metrics.row.icon).toBe(expected.icon);
      expect(metrics.row.square).toBe(expected.square);
      expect(metrics.expanded).toBe(expected.expanded);
      // The rail is the square plus the panel's own collapsed padding and border.
      expect(metrics.collapsed).toBe(expected.square + metrics.collapsedPaddingX * 2 + 2);
      expect(metrics.collapsed).toBe(expected.collapsed);

      const screen = renderIn(<Sidebar testID="sb" size={size} items={ITEMS} />);
      const row = resolvedStyle(screen.getByTestId('sidebar-item-home').props.style);
      expect(row.paddingLeft).toBe(expected.padding);
      // Expanded, the square is a floor, not a height: at the largest system
      // font the label is taller than it and a fixed height clipped it.
      expect(row.minHeight).toBe(expected.square);
      expect(row.height).toBeUndefined();
      screen.unmount();
    }
  });

  it('a standalone row takes its own size, and the collapsed square follows it', () => {
    const screen = renderIn(<SidebarItem testID="row" icon={RiHomeLine} label="Home" size="lg" collapsed />);
    expect(resolvedStyle(screen.getByTestId('row').props.style)).toMatchObject({ width: 44, height: 44, paddingLeft: 10, paddingRight: 10 });
  });

  it('selected row: named link with selected state, a solid pill and no ring', () => {
    const screen = renderIn(<Sidebar items={ITEMS} selected="home" />);
    const home = screen.getByTestId('sidebar-item-home');
    expect(home.props.role).toBe('link');
    expect(home.props.accessibilityLabel).toBe('Home');
    expect(home.props.accessibilityState).toEqual({ selected: true });
    const style = resolvedStyle(home.props.style);
    expect(style).toMatchObject({ paddingLeft: 9, paddingRight: 9, borderRadius: 9999 });
    expect(style.boxShadow).toBeUndefined();
    expect(screen.getByTestId('sidebar-item-board').props.accessibilityState).toEqual({ selected: false });
  });

  it('routes href rows through onNavigate, and action rows through their own onPress', () => {
    const onNavigate = jest.fn();
    const onSettings = jest.fn();
    const screen = renderIn(
      <Sidebar
        items={ITEMS}
        secondaryItems={[{ key: 'settings', label: 'Settings', icon: RiSettings4Line, onPress: onSettings }]}
        onNavigate={onNavigate}
      />,
    );
    pressHost(screen.getByTestId('sidebar-item-board'));
    expect(onNavigate).toHaveBeenCalledWith(ITEMS[1]);
    pressHost(screen.getByTestId('sidebar-item-settings'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('the collapse control names its action, reports expanded, and toggles', () => {
    const onCollapsedChange = jest.fn();
    const screen = renderIn(<Sidebar items={ITEMS} onCollapsedChange={onCollapsedChange} />);
    const control = screen.getByTestId('sidebar-collapse');
    expect(control.props.accessibilityLabel).toBe('Collapse sidebar');
    expect(control.props['aria-expanded']).toBe(true);
    pressHost(control);
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    const collapsed = screen.getByTestId('sidebar-collapse');
    expect(collapsed.props.accessibilityLabel).toBe('Expand sidebar');
    expect(collapsed.props['aria-expanded']).toBe(false);
  });

  it.each([false, true])('an empty header has no phantom account gap (collapsed=%s)', (collapsed) => {
    const screen = renderIn(<Sidebar collapsed={collapsed} showSearch={false} showThemeToggle={false} />);
    expect(resolvedStyle(screen.getByTestId('sidebar-header').props.style).height).toBe(20);
  });

  it.each([false, true])('preserves the account header endpoints (collapsed=%s)', (collapsed) => {
    const screen = renderIn(<Sidebar collapsed={collapsed} account={{ name: 'Alex' }} />);
    expect(resolvedStyle(screen.getByTestId('sidebar-header').props.style).height).toBe(collapsed ? 62 : 32);
    expect(resolvedStyle(screen.getByTestId('sidebar-header-control').props.style)).toMatchObject({
      top: collapsed ? 0 : 6, width: collapsed ? 40 : 20,
    });
    expect(resolvedStyle(screen.getByTestId('sidebar-theme-morph').props.style).height).toBe(collapsed ? 36 : 40);
  });

  it.each([false, true])('keeps the badge when collapsed, over the icon and capped at 99+ (collapsed=%s)', (collapsed) => {
    const screen = renderIn(<Sidebar collapsed={collapsed} items={ITEMS} selected="home" />);
    // Hidden from assistive tech, so the default queries can't see it.
    const hidden = { includeHiddenElements: true };
    expect(screen.queryByTestId('sidebar-item-home-collapsed-badge')).toBeNull();
    const overlay = screen.getByTestId('sidebar-item-home-collapsed-badge', hidden);
    // The overlay fades in with the collapse and never reaches assistive tech —
    // the expanded slot already carries the count.
    expect(resolvedStyle(overlay.props.style)).toMatchObject({ position: 'absolute', opacity: collapsed ? 1 : 0 });
    expect(overlay.props['aria-hidden']).toBe(true);
    expect(overlay.props.accessibilityElementsHidden).toBe(true);
    expect(screen.getByText('99+', hidden)).toBeTruthy();
    expect(screen.getByText('152', hidden)).toBeTruthy();
    expect(screen.queryByTestId('sidebar-item-board-collapsed-badge', hidden)).toBeNull();
  });

  it('honours showSearch=false in the plain mobile drawer and keeps dismissal reachable', () => {
    const onClose = jest.fn();
    const screen = renderIn(<Sidebar surface="plain" mobile showSearch={false} items={ITEMS} onClose={onClose} />);
    expect(screen.queryByLabelText('Search')).toBeNull();
    expect(screen.queryByLabelText('Filter navigation')).toBeNull();
    pressHost(screen.getByLabelText('Close sidebar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mobile shows a close button and never collapses', () => {
    const onClose = jest.fn();
    const screen = renderIn(<Sidebar mobile defaultCollapsed items={ITEMS} onClose={onClose} />);
    expect(screen.queryByTestId('sidebar-collapse')).toBeNull();
    pressHost(screen.getByTestId('sidebar-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('quick search filters the rows and shows "No results" when nothing matches', () => {
    const screen = renderIn(<Sidebar items={ITEMS} />);
    pressHost(screen.getByTestId('sidebar-search'));
    const input = screen.getByTestId('sidebar-search-input');
    fireEvent.changeText(input, 'proj');
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    expect(screen.getByTestId('sidebar-item-board')).toBeTruthy();
    fireEvent.changeText(input, 'zzz');
    expect(screen.getByText('No results')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Clear navigation search'));
    expect(screen.getByTestId('sidebar-search')).toBeTruthy();
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
  });
});

const MODES: SidebarMode[] = [
  { key: 'search', label: 'Search', icon: RiSearchLine, shortcut: '⌥⌃1' },
  { key: 'computer', label: 'Computer', icon: RiComputerLine, shortcut: '⌥⌃2' },
];

describe('SidebarModeSwitcher', () => {
  it('is a named radio group: one checked radio per mode, pressing reports its key', () => {
    const onValueChange = jest.fn();
    const screen = renderIn(
      <SidebarModeSwitcher testID="modes" modes={MODES} value="search" onValueChange={onValueChange} accessibilityLabel="Sidebar mode" />,
    );
    const group = screen.getByTestId('modes');
    expect(group.props.role).toBe('radiogroup');
    expect(group.props.accessibilityLabel).toBe('Sidebar mode');
    const search = screen.getByTestId('modes-search');
    const computer = screen.getByTestId('modes-computer');
    expect(search.props.role).toBe('radio');
    expect(search.props['aria-checked']).toBe(true);
    expect(computer.props['aria-checked']).toBe(false);
    expect(computer.props.accessibilityLabel).toBe('Computer');
    pressHost(computer);
    expect(onValueChange).toHaveBeenCalledWith('computer');
  });

  it('keeps the track geometry: p4, 32px rows 4 apart, a 32px thumb on the tertiary track', () => {
    const screen = renderIn(<SidebarModeSwitcher testID="modes" modes={MODES} value="computer" onValueChange={() => {}} />, 'dark');
    const { colors } = buildTheme('teal', 'dark');
    expect(resolvedStyle(screen.getByTestId('modes').props.style)).toMatchObject({
      padding: 4,
      gap: 4,
      borderRadius: 20,
      backgroundColor: colors.backgroundTertiary,
    });
    expect(resolvedStyle(screen.getByTestId('modes-computer').props.style)).toMatchObject({ height: 32 });
    expect(resolvedStyle(screen.getByTestId('modes-thumb', { includeHiddenElements: true }).props.style)).toMatchObject({
      height: 32,
      backgroundColor: colors.card,
    });
  });

  it.each([['sm', 30], ['md', 40], ['lg', 44]] as const)('keeps collapsed %s modes square and inside the panel', (size, square) => {
    const onModeChange = jest.fn();
    const screen = renderIn(<Sidebar testID="sb" size={size} collapsed modes={MODES} mode="computer" onModeChange={onModeChange} />);
    const track = resolvedStyle(screen.getByTestId('sb-modes').props.style);
    const row = resolvedStyle(screen.getByTestId('sb-modes-computer').props.style);
    const thumb = resolvedStyle(screen.getByTestId('sb-modes-thumb', { includeHiddenElements: true }).props.style);
    expect(track).toMatchObject({ padding: 4, alignSelf: 'stretch', marginLeft: -4, marginRight: -4 });
    expect(row).toMatchObject({ height: square, gap: 0 });
    expect(thumb.height).toBe(square);
    const column = SIDEBAR_METRICS[size].collapsed - 2 - 2 * SIDEBAR_METRICS[size].collapsedPaddingX;
    const trackWidth = column - (track.marginLeft as number) - (track.marginRight as number);
    expect(trackWidth - 2 * (track.padding as number)).toBe(thumb.height);
    expect(trackWidth).toBeLessThan(SIDEBAR_METRICS[size].collapsed - 2);
    pressHost(screen.getByTestId('sb-modes-search'));
    expect(onModeChange).toHaveBeenCalledWith('search');
  });

  it('renders under the Sidebar header from `modes`, defaulting to the first mode', () => {
    const onModeChange = jest.fn();
    const screen = renderIn(<Sidebar testID="sb" items={ITEMS} modes={MODES} onModeChange={onModeChange} />);
    expect(screen.getByTestId('sb-modes-search').props['aria-checked']).toBe(true);
    pressHost(screen.getByTestId('sb-modes-computer'));
    expect(onModeChange).toHaveBeenCalledWith('computer');
  });
});

describe('SidebarItem', () => {
  it('standalone collapsed is the 40px square', () => {
    const screen = renderIn(<SidebarItem testID="row" icon={RiHomeLine} label="Home" collapsed />);
    expect(resolvedStyle(screen.getByTestId('row').props.style)).toMatchObject({ width: 40 });
  });
});

describe('Sidebar tree and plan', () => {
  const TREE: SidebarTree = {
    label: 'Repositories',
    folders: [
      { key: 'web', label: 'web', items: [{ key: 'badge', label: 'pro badge restyle', meta: '2h' }] },
      {
        key: 'vibl',
        label: 'vibl coding project',
        defaultOpen: true,
        items: [
          { key: 'landing', label: 'landing page design', meta: '34m' },
          { key: 'coding', label: 'coding scenario', meta: 'now' },
        ],
      },
    ],
  };

  it('lists the tree under its label, opens folders and reports row presses', () => {
    const onTreeItemPress = jest.fn();
    const { getByText, getByLabelText } = renderIn(
      <Sidebar tree={TREE} selectedTreeItem="coding" onTreeItemPress={onTreeItemPress} showThemeToggle={false} />,
    );
    expect(getByText('Repositories')).toBeTruthy();
    const web = getByLabelText('web');
    expect(web.props['aria-expanded']).toBe(false);
    fireEvent.press(web);
    expect(getByLabelText('web').props['aria-expanded']).toBe(true);
    const coding = getByLabelText('coding scenario, now');
    expect(coding.props.accessibilityState).toMatchObject({ selected: true });
    pressHost(getByLabelText('landing page design, 34m'));
    expect(onTreeItemPress).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'landing' }),
      expect.objectContaining({ key: 'vibl' }),
    );
  });

  it('shows the plan card in place of the team card', () => {
    const onAction = jest.fn();
    const { getByText } = renderIn(
      <Sidebar showThemeToggle={false} plan={{ name: 'Design team', plan: 'Pro Plan', actionLabel: 'Upgrade', onAction }} />,
    );
    expect(getByText('Design team')).toBeTruthy();
    expect(getByText('Pro Plan')).toBeTruthy();
    fireEvent.press(getByText('Upgrade'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('holds a folder open and on its matching rows while a SidebarFolder is forced open', () => {
    const { getByLabelText } = renderIn(<SidebarFolder folder={TREE.folders[0]!} forceOpen />);
    expect(getByLabelText('web').props['aria-expanded']).toBe(true);
  });
});

describe('Sidebar variant="rail"', () => {
  const RAIL: SidebarNavItem[] = [
    { key: 'home', label: 'Home', icon: RiHomeLine, activeIcon: RiHomeFill, href: '/home', badge: 3 },
    { key: 'board', label: 'Project board', icon: RiKanbanView2, href: '/board' },
  ];

  it('is the 80px chrome-free rail with navigation only', () => {
    const screen = renderIn(
      <Sidebar testID="sb" variant="rail" items={RAIL} secondaryItems={[{ key: 'settings', label: 'Settings', icon: RiSettings4Line, onPress: () => {} }]} />,
    );
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel).toMatchObject({ width: 80, height: '100%' });
    expect(panel.borderWidth).toBeUndefined();
    expect(screen.queryByTestId('sidebar-search')).toBeNull();
    expect(screen.queryByTestId('sidebar-collapse')).toBeNull();
    expect(screen.getByTestId('sidebar-item-settings')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('selected item: named link, selected state, accent pill and the active glyph', () => {
    const { colors } = buildTheme('teal', 'light');
    const screen = renderIn(<Sidebar variant="rail" items={RAIL} selected="home" />);
    const home = screen.getByTestId('sidebar-item-home');
    expect(home.props.role).toBe('link');
    expect(home.props.accessibilityLabel).toBe('Home');
    expect(home.props.accessibilityState).toEqual({ selected: true });
    expect(resolvedStyle(home.props.style)).toMatchObject({ minHeight: 64, borderRadius: 20 });
    const indicator = screen.getByTestId('sidebar-item-home-indicator');
    expect(resolvedStyle(indicator.props.style)).toMatchObject({ width: 48, height: 32, backgroundColor: colors.primary });
    expect(screen.UNSAFE_getByType(RiHomeFill)).toBeTruthy();
    expect(resolvedStyle(screen.getByTestId('sidebar-item-home-inactive-glyph', { includeHiddenElements: true }).props.style).opacity).toBe(0);
    expect(resolvedStyle(screen.getByTestId('sidebar-item-home-active-glyph', { includeHiddenElements: true }).props.style).opacity).toBe(1);
    expect(resolvedStyle(screen.getByTestId('sidebar-item-board-indicator').props.style).backgroundColor).toBe('transparent');
  });

  it('routes href items through onNavigate', () => {
    const onNavigate = jest.fn();
    const screen = renderIn(<Sidebar variant="rail" items={RAIL} onNavigate={onNavigate} />);
    fireEvent.press(screen.getByTestId('sidebar-item-board'));
    expect(onNavigate).toHaveBeenCalledWith(RAIL[1]);
  });
});

describe('Sidebar logo', () => {
  const Mark = () => <React.Fragment />;

  it('leads the header with the mark and a string wordmark, and moves the account under it', () => {
    const onPress = jest.fn();
    const screen = renderIn(
      <Sidebar
        items={ITEMS}
        logo={{ icon: <Mark />, wordmark: 'Oxy', href: '/', onPress }}
        account={{ name: 'Maya Collins' }}
      />,
    );
    const logo = screen.getByTestId('sidebar-logo');
    expect(logo.props.role).toBe('link');
    expect(logo.props.accessibilityLabel).toBe('Oxy');
    expect(resolvedStyle(screen.getByTestId('sidebar-logo-icon').props.style)).toMatchObject({ width: 44, height: 36 });
    expect(screen.getByText('Oxy')).toBeTruthy();
    expect(screen.getByTestId('sidebar-account')).toBeTruthy();
    pressHost(logo);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is decoration without href or onPress', () => {
    const screen = renderIn(<Sidebar items={ITEMS} logo={{ wordmark: 'Oxy' }} />);
    const logo = screen.getByTestId('sidebar-logo');
    expect(logo.props.role).toBe('img');
    expect(logo.props.accessibilityLabel).toBe('Oxy');
  });

  it('the rail shows the mark only', () => {
    const screen = renderIn(
      <Sidebar variant="rail" items={ITEMS} logo={{ icon: <Mark />, wordmark: 'Oxy', accessibilityLabel: 'Oxy home' }} />,
    );
    expect(screen.getByTestId('sidebar-logo-icon')).toBeTruthy();
    expect(screen.queryByText('Oxy')).toBeNull();
    expect(screen.getByTestId('sidebar-logo').props.accessibilityLabel).toBe('Oxy home');
  });
});


describe('Sidebar application tree', () => {
  it('uses controlled search to filter real tree data and reports edits', () => {
    const changed = jest.fn();
    const screen = renderIn(<Sidebar searchQuery="older" onSearchQueryChange={changed}
      tree={{ label: 'History', folders: [{ key: 'all', label: 'Chats', items: [
        { key: 'old', label: 'Older chat' }, { key: 'new', label: 'Newest chat' },
      ] }] }} />);
    expect(screen.getByLabelText('Older chat')).toBeTruthy();
    expect(screen.queryByLabelText('Newest chat')).toBeNull();
    pressHost(screen.getByTestId('sidebar-search'));
    fireEvent.changeText(screen.getByTestId('sidebar-search-input'), 'newest');
    expect(changed).toHaveBeenCalledWith('newest');
  });
  it('keeps actions separate from selection and forwards prefetch/long press and controlled disclosure', () => {
    const select = jest.fn(), prefetch = jest.fn(), action = jest.fn(), expand = jest.fn(), longPress = jest.fn();
    const folder = { key: 'project', label: 'Project', open: true, onOpenChange: expand,
      actions: <Pressable accessibilityLabel="Edit project" onPress={action}><Text>Edit</Text></Pressable>,
      items: [{ key: 'chat', label: 'Chat', onPrefetch: prefetch, onLongPress: longPress,
        actions: <Pressable accessibilityLabel="Chat actions" onPress={action}><Text>More</Text></Pressable> }] };
    const screen = renderIn(<SidebarFolder folder={folder} onItemPress={select} />);
    expect(prefetch).not.toHaveBeenCalled();
    fireEvent(screen.getByLabelText('Chat'), 'longPress'); expect(longPress).toHaveBeenCalledTimes(1);
    pressHost(screen.getByLabelText('Chat actions')); expect(action).toHaveBeenCalledTimes(1); expect(select).not.toHaveBeenCalled();
    pressHost(screen.getByLabelText('Chat')); expect(prefetch).toHaveBeenCalledTimes(1); expect(select).toHaveBeenCalledTimes(1);
    pressHost(screen.getByLabelText('Project')); expect(expand).toHaveBeenCalledWith(false);
  });
});

it.each(['panel', 'rail'] as const)('centers only the %s main group, keeping its footer outside the flexible region', (variant) => {
  const tree = renderIn(<Sidebar variant={variant} testID="aligned" contentAlignment="center" items={ITEMS} footer={<Text>Account</Text>} />);
  const region = tree.getByTestId('aligned-main-region');
  const footer = tree.getByTestId('aligned-footer');
  expect(resolvedStyle(region.props.style)).toMatchObject({ flex: 1, minHeight: 0, justifyContent: 'center' });
  expect(resolvedStyle(footer.props.style).flexShrink).toBe(0);
  let parent = footer.parent;
  while (parent) { expect(parent).not.toBe(region); parent = parent.parent; }
});
