/**
 * `SettingsLayout density="compact"` and its rail's search: a desktop's System
 * Settings, as a Mac draws it (28-point sidebar rows in the label's colour, no
 * group headings, a 20 content inset, compact grouped sections), and the
 * search field at the top of the sidebar, which its owner filters through and
 * whose keys go to the results. The owner's menus reach the same commands
 * through the layout's handle.
 */
import React from 'react';
import { AccessibilityInfo, Text as RNText } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import { GROUPED_SECTION_TEST_ID } from '../grouped-section/surface';
import { RiSchoolLine, RiSettings6Line, RiUserLine } from '../icons/remix';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import {
  SettingsLayout,
  type SettingsLayoutHandle,
  type SettingsLayoutHistory,
  type SettingsLayoutProps,
  type SettingsNavGroup,
} from '../settings-modal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { cardLayout } from './support/card-surface';
import { fakeKeyboard } from './support/fake-menu-bar';
import { fakeWindow } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

const GROUPS: SettingsNavGroup[] = [
  {
    key: 'personal',
    label: 'Personal',
    items: [
      { key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' },
      { key: 'profile', label: 'Profile', icon: RiSchoolLine, page: 'profile' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    items: [{ key: 'users', label: 'Users', icon: RiUserLine, page: 'users' }],
  },
];

const PAGES = {
  general: {
    title: 'General',
    content: (
      <GroupedSection title="Dynamic Wallpapers">
        <GroupedSectionItem title="Light" />
      </GroupedSection>
    ),
  },
  profile: { title: 'Profile', content: <RNText>profile body</RNText> },
  users: { title: 'Users', content: <RNText>users body</RNText> },
};

/** The groups whose rows say `query`, as an owner filters them. */
function filtered(query: string): SettingsNavGroup[] {
  const words = query.trim().toLowerCase();
  return GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.label.toLowerCase().includes(words)),
  }));
}

function Searchable({
  adapter,
  handle,
  ...props
}: Partial<SettingsLayoutProps> & {
  adapter: PlatformSurfaceAdapter | null;
  handle?: React.Ref<SettingsLayoutHandle>;
}) {
  const [query, setQuery] = React.useState('');
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={adapter}>
        <SettingsLayout
          ref={handle}
          groups={filtered(query)}
          pages={PAGES}
          density="compact"
          search={{ value: query, onChangeText: setQuery, testID: 'search' }}
          testID="settings"
          {...props}
        />
      </PlatformSurfaceProvider>
    </BloomThemeProvider>
  );
}

beforeEach(() => {
  mockWindowSize({ width: 1280, height: 800, scale: 1, fontScale: 1 });
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('SettingsLayout density="compact"', () => {
  it('draws 28-point rows in the label colour, no group headings, and a 20 inset', () => {
    const screen = render(<Searchable adapter={fakeWindow().adapter} />);
    const row = screen.getByTestId('settings-nav-profile');
    expect(resolvedStyle(row.props.style)).toMatchObject({
      minHeight: 28,
      paddingVertical: 5,
    });
    // The groups are apart by space alone: no heading names them.
    expect(screen.queryByText('Personal')).toBeNull();
    expect(screen.queryByText('System')).toBeNull();
    expect(screen.queryAllByRole('header')).toHaveLength(0);
    // The page's sections are compact: radius 12, the title as written.
    expect(cardLayout(screen.getByTestId(GROUPED_SECTION_TEST_ID)).borderRadius).toBe(12);
    const title = screen.getByText('Dynamic Wallpapers');
    expect(resolvedStyle(title.props.style).textTransform).toBeUndefined();
    const content = screen
      .getByTestId('settings-page')
      .findAll(
        (node) =>
          typeof node.type === 'string' && resolvedStyle(node.props.style).paddingLeft === 20,
      );
    expect(content.length).toBeGreaterThan(0);
  });

  it('comfortable keeps the headings and the 36-point rows', () => {
    const screen = render(<Searchable adapter={fakeWindow().adapter} density="comfortable" />);
    expect(screen.getByText('Personal')).toBeTruthy();
    expect(resolvedStyle(screen.getByTestId('settings-nav-profile').props.style).minHeight).toBe(
      undefined,
    );
    expect(cardLayout(screen.getByTestId(GROUPED_SECTION_TEST_ID)).borderRadius).toBe(28);
  });
});

describe("the rail's search", () => {
  it('filters through its owner, says when nothing matches, and Escape clears it', () => {
    const keyboard = fakeKeyboard();
    const screen = render(<Searchable adapter={{ ...fakeWindow().adapter, keyboard }} />);
    const field = screen.getByTestId('search');
    fireEvent.changeText(field, 'pro');
    expect(screen.getByTestId('settings-nav-profile')).toBeTruthy();
    expect(screen.queryByTestId('settings-nav-general')).toBeNull();
    expect(screen.queryByTestId('settings-nav-users')).toBeNull();
    fireEvent.changeText(field, 'zzz');
    expect(screen.getByTestId('settings-search-empty').props.children).toBe('No Results');
    // Escape is the field's only while it has the keyboard.
    let taken = false;
    act(() => {
      taken = keyboard.press({ key: 'Escape', code: 'Escape' });
    });
    expect(taken).toBe(false);
    fireEvent(field, 'focus');
    act(() => {
      taken = keyboard.press({ key: 'Escape', code: 'Escape' });
    });
    expect(taken).toBe(true);
    expect(screen.getByTestId('search').props.value).toBe('');
    expect(screen.getByTestId('settings-nav-general')).toBeTruthy();
    // Empty, Escape is not the field's.
    act(() => {
      taken = keyboard.press({ key: 'Escape', code: 'Escape' });
    });
    expect(taken).toBe(false);
  });

  it('↓ and Return choose the first result, its page shown and the keyboard on its row', () => {
    const keyboard = fakeKeyboard();
    const focus = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    const nodes = new Map<unknown, string>();
    const screen = render(<Searchable adapter={{ ...fakeWindow().adapter, keyboard }} />, {
      createNodeMock: (element) => {
        const node = { focus: () => {}, setSelection: () => {}, scrollTo: () => {} };
        nodes.set(node, String((element.props as { testID?: string }).testID));
        return node;
      },
    });
    const field = screen.getByTestId('search');
    fireEvent(field, 'focus');
    fireEvent.changeText(field, 'us');
    let taken = false;
    act(() => {
      taken = keyboard.press({ key: 'ArrowDown', code: 'ArrowDown' });
    });
    expect(taken).toBe(true);
    expect(screen.getByText('users body')).toBeTruthy();
    expect(focus).toHaveBeenLastCalledWith(expect.anything(), 'focus');
    expect(nodes.get(focus.mock.lastCall?.[0])).toBe('settings-nav-users');
    // The row focused is the result's: the list's one stop.
    expect(screen.getByTestId('settings-nav-users').props.focusable).toBe(true);

    fireEvent.changeText(field, 'pro');
    fireEvent(field, 'submitEditing');
    expect(screen.getByText('profile body')).toBeTruthy();
    expect(screen.getByTestId('settings-nav-profile').props.focusable).toBe(true);
    expect(nodes.get(focus.mock.lastCall?.[0])).toBe('settings-nav-profile');
  });
});

describe("the layout's handle", () => {
  it('focuses the search and goes back and forward, telling its owner where it can go', () => {
    const handle = React.createRef<SettingsLayoutHandle>();
    const told: SettingsLayoutHistory[] = [];
    const field = { focus: jest.fn(), setSelection: jest.fn() };
    const screen = render(
      <Searchable
        adapter={fakeWindow().adapter}
        handle={handle}
        onHistoryChange={(history) => told.push(history)}
      />,
      {
        createNodeMock: (element) =>
          (element.props as { testID?: string }).testID === 'search' ? field : {},
      },
    );
    expect(told).toEqual([{ canGoBack: false, canGoForward: false }]);
    fireEvent.press(screen.getByTestId('settings-nav-profile'));
    expect(told[told.length - 1]).toEqual({ canGoBack: true, canGoForward: false });
    act(() => handle.current?.back());
    expect(screen.getByText('Dynamic Wallpapers')).toBeTruthy();
    expect(told[told.length - 1]).toEqual({ canGoBack: false, canGoForward: true });
    // Nowhere further back: nothing.
    act(() => handle.current?.back());
    expect(screen.getByText('Dynamic Wallpapers')).toBeTruthy();
    act(() => handle.current?.forward());
    expect(screen.getByText('profile body')).toBeTruthy();
    expect(told[told.length - 1]).toEqual({ canGoBack: true, canGoForward: false });

    // Find…: the keyboard to the field, its text selected to type over.
    act(() => handle.current?.focusSearch());
    expect(field.focus).toHaveBeenCalledTimes(1);
    expect(field.setSelection).toHaveBeenCalledWith(0, Number.MAX_SAFE_INTEGER);
  });
});
