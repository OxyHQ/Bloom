/**
 * A workspace app's sidebar: the team leading from the header with the person
 * at the foot, rich menu rows, and a page tree — nested rows with icons,
 * collapsible sections with their states, and moves.
 */
import type React from 'react';
import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiHomeLine, RiLogoutBoxRLine, RiSettings4Line } from '../icons/remix';
import { Sidebar } from '../sidebar';
import type { SidebarAccount, SidebarTeam, SidebarTree, SidebarTreeDrop } from '../sidebar';
import { TreeDragProvider, useTreeDrag } from '../sidebar/SidebarTreeDrag';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const switchTo = jest.fn();
const TEAM: SidebarTeam = {
  name: 'Acme',
  avatar: { initials: 'A', shape: 'squircle' },
  groups: [
    {
      id: 'workspaces',
      label: 'Your workspaces',
      selection: 'single',
      items: [
        {
          key: 'acme',
          label: 'Acme',
          description: 'Admin',
          avatar: { initials: 'A', shape: 'squircle' },
          selected: true,
          onPress: () => switchTo('acme'),
        },
        {
          key: 'home',
          label: 'Home',
          description: 'Personal',
          avatar: { initials: 'H', shape: 'squircle' },
          onPress: () => switchTo('home'),
        },
      ],
    },
  ],
};
const signOut = jest.fn();
const ACCOUNT: SidebarAccount = {
  name: 'Maya Collins',
  email: 'maya@oxy.so',
  avatar: { initials: 'M' },
  groups: [
    { id: 'me', items: [{ key: 'settings', label: 'Settings', icon: RiSettings4Line }] },
    {
      id: 'out',
      items: [
        {
          key: 'sign-out',
          label: 'Sign out',
          icon: RiLogoutBoxRLine,
          tone: 'destructive',
          onPress: signOut,
        },
      ],
    },
  ],
};

describe('Sidebar teamPlacement', () => {
  beforeEach(() => {
    switchTo.mockClear();
    signOut.mockClear();
  });

  it('keeps the account at the top and the team at the foot by default', () => {
    const screen = renderIn(<Sidebar account={ACCOUNT} team={TEAM} showThemeToggle={false} />);
    const header = screen.getByTestId('sidebar-fixed-header');
    expect(within(header).queryByTestId('sidebar-account')).toBeTruthy();
    expect(within(header).queryByTestId('sidebar-team')).toBeNull();
    expect(screen.getByTestId('sidebar-team')).toBeTruthy();
  });

  it('leads with the team switcher and moves the account to a card at the foot', () => {
    const screen = renderIn(
      <Sidebar account={ACCOUNT} team={TEAM} teamPlacement="header" showThemeToggle={false} />,
    );
    const header = screen.getByTestId('sidebar-fixed-header');
    expect(within(header).getByTestId('sidebar-team')).toBeTruthy();
    expect(within(header).queryByTestId('sidebar-account')).toBeNull();
    // The card form draws the second line under the name.
    const card = screen.getByTestId('sidebar-account');
    expect(within(card).getByText('maya@oxy.so')).toBeTruthy();
  });

  it('offers the workspaces as a choice of one, with a description and a check on the current one', () => {
    const screen = renderIn(<Sidebar team={TEAM} teamPlacement="header" showThemeToggle={false} />);
    fireEvent.press(screen.getByTestId('sidebar-team'));
    const current = screen.getByTestId('sidebar-team-item-acme');
    const other = screen.getByTestId('sidebar-team-item-home');
    expect(current.props.role).toBe('radio');
    expect(current.props.accessibilityState).toMatchObject({ checked: true });
    expect(other.props.accessibilityState).toMatchObject({ checked: false });
    expect(current.props.accessibilityLabel).toBe('Acme, Admin');
    expect(within(other).getByText('Personal')).toBeTruthy();
    const group = screen.UNSAFE_root.find(
      (node) => typeof node.type === 'string' && node.props.role === 'radiogroup',
    );
    expect(group.props.accessibilityLabel).toBe('Your workspaces');
    pressHost(other);
    expect(switchTo).toHaveBeenCalledWith('home');
  });

  it("heads the account card's menu with the account and paints a destructive row in the danger role", () => {
    const screen = renderIn(
      <Sidebar account={ACCOUNT} team={TEAM} teamPlacement="header" showThemeToggle={false} />,
    );
    fireEvent.press(screen.getByTestId('sidebar-account'));
    const menu = screen.getByTestId('sidebar-account-menu');
    expect(within(menu).getByText('Maya Collins')).toBeTruthy();
    expect(within(menu).getByText('maya@oxy.so')).toBeTruthy();
    const settings = within(menu).getByTestId('sidebar-account-item-settings');
    const out = within(menu).getByTestId('sidebar-account-item-sign-out');
    const ink = (node: typeof out) =>
      resolvedStyle(within(node).getByText(node.props.accessibilityLabel).props.style).color;
    expect(ink(out)).not.toBe(ink(settings));
    pressHost(out);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

const PAGES: SidebarTree = {
  key: 'private',
  label: 'Private',
  items: [
    {
      key: 'roadmap',
      label: 'Roadmap',
      leading: <Text>🗺️</Text>,
      items: [{ key: 'q1', label: 'Q1 goals', items: [{ key: 'jan', label: 'January' }] }],
    },
    {
      key: 'notes',
      label: 'Notes',
      icon: RiHomeLine,
      expandable: true,
      emptyLabel: 'No pages inside',
    },
    { key: 'ideas', label: 'Ideas' },
  ],
};

describe('Sidebar page tree', () => {
  it('nests rows to any depth behind a disclosure, keeping a lane on every row so labels align', () => {
    const onOpenChange = jest.fn();
    const tree: SidebarTree = {
      ...PAGES,
      items: [{ ...PAGES.items![0]!, onOpenChange }, ...PAGES.items!.slice(1)],
    };
    const screen = renderIn(<Sidebar tree={tree} showThemeToggle={false} />);
    expect(screen.queryByText('Q1 goals')).toBeNull();
    const disclosure = screen.getByLabelText('Expand Roadmap');
    expect(disclosure.props['aria-expanded']).toBe(false);
    pressHost(disclosure);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Q1 goals')).toBeTruthy();
    expect(screen.getByLabelText('Collapse Roadmap')).toBeTruthy();
    // A leaf keeps the lane instead of a disclosure.
    expect(screen.queryByLabelText('Expand Ideas')).toBeNull();
    // Leading content and icons sit before the label.
    expect(screen.getByText('🗺️')).toBeTruthy();
    // Nested one level deeper: further in by one indent.
    const inset = (key: string) =>
      resolvedStyle(screen.getByTestId(`sidebar-tree-row-${key}`).props.style).paddingInlineStart;
    expect(inset('q1')).toBe((inset('roadmap') as number) + 16);
  });

  it('says what an open row with nothing in it holds', () => {
    const screen = renderIn(<Sidebar tree={PAGES} showThemeToggle={false} />);
    pressHost(screen.getByLabelText('Expand Notes'));
    expect(screen.getByText('No pages inside')).toBeTruthy();
  });

  it('runs an action row and reports the press', () => {
    const browse = jest.fn();
    const onTreeItemPress = jest.fn();
    const screen = renderIn(
      <Sidebar
        tree={{ label: 'Teamspaces', items: [{ key: 'browse', label: 'Browse', onPress: browse }] }}
        onTreeItemPress={onTreeItemPress}
        showThemeToggle={false}
      />,
    );
    pressHost(screen.getByLabelText('Browse'));
    expect(browse).toHaveBeenCalledTimes(1);
    expect(onTreeItemPress).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'browse' }),
      undefined,
    );
  });

  it('holds every branch with matches open while searching, and keeps their ancestors', () => {
    const screen = renderIn(<Sidebar tree={PAGES} searchQuery="jan" showThemeToggle={false} />);
    expect(screen.getByText('Roadmap')).toBeTruthy();
    expect(screen.getByText('Q1 goals')).toBeTruthy();
    expect(screen.getByText('January')).toBeTruthy();
    expect(screen.queryByText('Ideas')).toBeNull();
  });

  it('collapses a collapsible section from its label', () => {
    const onOpenChange = jest.fn();
    const screen = renderIn(
      <Sidebar tree={{ ...PAGES, collapsible: true, onOpenChange }} showThemeToggle={false} />,
    );
    const label = () =>
      screen.getAllByLabelText('Private').find((node) => node.props.role === 'button')!;
    expect(label().props['aria-expanded']).toBe(true);
    expect(screen.getByText('Roadmap')).toBeTruthy();
    pressHost(label());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(label().props['aria-expanded']).toBe(false);
  });

  it('stands a loading, failed or empty status in for the rows', () => {
    const screen = renderIn(
      <Sidebar
        tree={[
          { key: 'a', label: 'Teamspaces', loading: true },
          { key: 'b', label: 'Shared', error: 'Could not load' },
          { key: 'c', label: 'Favorites', emptyLabel: 'Nothing here yet' },
          { key: 'd', label: 'Hidden' },
        ]}
        showThemeToggle={false}
      />,
    );
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.getByText('Could not load').props.role).toBe('alert');
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    // No rows and nothing to say: not drawn.
    expect(screen.queryByText('Hidden')).toBeNull();
  });
});

const MOVABLE: SidebarTree[] = [
  {
    key: 'private',
    label: 'Private',
    items: [
      {
        key: 'roadmap',
        label: 'Roadmap',
        draggable: true,
        items: [{ key: 'q1', label: 'Q1', draggable: true }],
      },
      { key: 'notes', label: 'Notes', draggable: true },
    ],
  },
  { key: 'shared', label: 'Shared', droppable: false, items: [{ key: 'theirs', label: 'Theirs' }] },
];

describe('Sidebar tree moves', () => {
  // The touch engine paces its edge scrolling by frames; node has none.
  const frame = globalThis.requestAnimationFrame;
  const cancel = globalThis.cancelAnimationFrame;
  beforeAll(() => {
    globalThis.requestAnimationFrame = (callback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  });
  afterAll(() => {
    globalThis.requestAnimationFrame = frame;
    globalThis.cancelAnimationFrame = cancel;
  });

  it('offers the possible moves as accessibility actions and reports the drop', () => {
    const onTreeItemDrop = jest.fn();
    const screen = renderIn(
      <Sidebar tree={MOVABLE} onTreeItemDrop={onTreeItemDrop} showThemeToggle={false} />,
    );
    const notes = screen.getByLabelText('Notes');
    expect(notes.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual(
      ['up', 'in'],
    );
    fireEvent(notes, 'accessibilityAction', { nativeEvent: { actionName: 'in' } });
    expect(onTreeItemDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({ key: 'notes' }),
        target: expect.objectContaining({ key: 'roadmap' }),
        position: 'inside',
        from: expect.objectContaining({ key: 'private' }),
        section: expect.objectContaining({ key: 'private' }),
      }),
    );
    // A row that is not draggable offers none.
    expect(screen.getByLabelText('Theirs').props.accessibilityActions).toBeUndefined();
  });

  it('hit-tests a touch drag against the rows, landing only where the rules allow', async () => {
    const drops: SidebarTreeDrop[] = [];
    let api: ReturnType<typeof useTreeDrag> = null;
    const frames: Record<string, { y: number; height: number }> = {
      'row:roadmap': { y: 0, height: 30 },
      'row:notes': { y: 32, height: 30 },
      'row:theirs': { y: 100, height: 30 },
      'section:private': { y: -30, height: 20 },
    };
    function Harness() {
      const drag = useTreeDrag();
      api = drag;
      useEffect(() => {
        if (!drag) return;
        const offs = [
          drag.register('row:roadmap', {
            key: 'roadmap',
            section: 'private',
            inside: true,
            measure: async () => frames['row:roadmap']!,
          }),
          drag.register('row:notes', {
            key: 'notes',
            section: 'private',
            inside: true,
            measure: async () => frames['row:notes']!,
          }),
          drag.register('row:theirs', {
            key: 'theirs',
            section: 'shared',
            inside: true,
            measure: async () => frames['row:theirs']!,
          }),
          drag.register('section:private', {
            section: 'private',
            inside: true,
            measure: async () => frames['section:private']!,
          }),
        ];
        return () => offs.forEach((off) => off());
      }, [drag]);
      return <Pressable />;
    }
    render(
      <TreeDragProvider
        sections={MOVABLE}
        onDrop={(drop) => drops.push(drop)}
        movedLabel={(label) => `${label} moved`}
        scroll={{ ref: { current: null }, offset: () => 0 }}
      >
        <Harness />
      </TreeDragProvider>,
    );
    await act(async () => {
      api!.begin('notes');
      await Promise.resolve();
      await Promise.resolve();
    });
    // The middle of Roadmap: inside it.
    act(() => api!.move(15));
    expect(api!.getState().hover).toEqual({
      key: 'roadmap',
      section: 'private',
      position: 'inside',
    });
    // Over the read-only section's row: nowhere.
    act(() => api!.move(115));
    expect(api!.getState().hover).toBeNull();
    // The section's label: inside the section.
    act(() => api!.move(-20));
    expect(api!.getState().hover).toEqual({ section: 'private', position: 'inside' });
    act(() => api!.move(2));
    act(() => api!.end(true));
    expect(drops).toHaveLength(1);
    expect(drops[0]).toMatchObject({
      item: { key: 'notes' },
      target: { key: 'roadmap' },
      position: 'before',
    });
    expect(api!.getState()).toEqual({ dragging: null, hover: null });
  });
});
