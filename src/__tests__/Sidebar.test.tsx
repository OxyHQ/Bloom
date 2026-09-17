import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { resolveButtonRamps } from '../button/shared';
import { RiHomeFill, RiHomeLine, RiKanbanView2, RiSettings4Line } from '../icons/remix';
import { Sidebar, SidebarFolder, SidebarItem } from '../sidebar';
import type { SidebarNavItem, SidebarTree } from '../sidebar';
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
  it('keeps the floating panel geometry and tokens', () => {
    const screen = renderIn(<Sidebar testID="sb" items={ITEMS} selected="home" />, 'dark');
    const { neutral } = resolveButtonRamps(buildTheme('teal', 'dark'));
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel).toMatchObject({
      borderRadius: 24,
      borderWidth: 1,
      paddingTop: 12,
      paddingLeft: 12,
      paddingRight: 12,
      backgroundColor: neutral[900],
      borderColor: neutral[800],
    });
    expect(panel.paddingHorizontal).toBeUndefined();
  });

  it('flat drops the panel chrome', () => {
    const screen = renderIn(<Sidebar testID="sb" flat mobile items={ITEMS} />);
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel.borderWidth).toBeUndefined();
    expect(panel.borderRadius).toBeUndefined();
  });

  it('selected row: named link with selected state, a solid pill and no ring', () => {
    const screen = renderIn(<Sidebar items={ITEMS} selected="home" />);
    const home = screen.getByTestId('sidebar-item-home');
    expect(home.props.role).toBe('link');
    expect(home.props.accessibilityLabel).toBe('Home');
    expect(home.props.accessibilityState).toEqual({ selected: true });
    const style = resolvedStyle(home.props.style);
    expect(style).toMatchObject({ padding: 8, borderRadius: 9999 });
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

describe('SidebarItem', () => {
  it('standalone collapsed is the 36px square', () => {
    const screen = renderIn(<SidebarItem testID="row" icon={RiHomeLine} label="Home" collapsed />);
    expect(resolvedStyle(screen.getByTestId('row').props.style)).toMatchObject({ width: 36 });
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
    const { accent } = resolveButtonRamps(buildTheme('teal', 'light'));
    const screen = renderIn(<Sidebar variant="rail" items={RAIL} selected="home" />);
    const home = screen.getByTestId('sidebar-item-home');
    expect(home.props.role).toBe('link');
    expect(home.props.accessibilityLabel).toBe('Home');
    expect(home.props.accessibilityState).toEqual({ selected: true });
    expect(resolvedStyle(home.props.style)).toMatchObject({ minHeight: 64, borderRadius: 20 });
    const indicator = screen.getByTestId('sidebar-item-home-indicator');
    expect(resolvedStyle(indicator.props.style)).toMatchObject({ width: 48, height: 32, backgroundColor: accent[500] });
    expect(screen.UNSAFE_getByType(RiHomeFill)).toBeTruthy();
    expect(screen.UNSAFE_queryByType(RiHomeLine)).toBeNull();
    expect(resolvedStyle(screen.getByTestId('sidebar-item-board-indicator').props.style).backgroundColor).toBe('transparent');
  });

  it('routes href items through onNavigate', () => {
    const onNavigate = jest.fn();
    const screen = renderIn(<Sidebar variant="rail" items={RAIL} onNavigate={onNavigate} />);
    fireEvent.press(screen.getByTestId('sidebar-item-board'));
    expect(onNavigate).toHaveBeenCalledWith(RAIL[1]);
  });
});
