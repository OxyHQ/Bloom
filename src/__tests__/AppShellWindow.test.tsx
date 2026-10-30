/**
 * AppShell keeps the window controls' room (OxyOS ADR 0016, decision 3). The
 * controls never move — they are drawn once, in the window's top leading
 * corner — and the region in that corner keeps their room: a sidebar in flow
 * below it, else the top bar or the header after it. `overlay` keeps none and
 * floats them on a plate; full screen has neither; without the capability the
 * shell renders exactly what it rendered before.
 */
import * as ReactNative from 'react-native';
import { act, render } from '@testing-library/react-native';

import { AppShell, AppShellPanel } from '../app-shell';
import type { AppShellProps } from '../app-shell/types';
import { RiHomeLine } from '../icons/remix';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeWindow } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];

function setWidth(width: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

function shell(adapter: PlatformSurfaceAdapter | null | undefined, props: Partial<AppShellProps>) {
  const ui = (
    <PortalProvider>
      <AppShell testID="shell" {...props} />
      <PortalOutlet />
    </PortalProvider>
  );
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {adapter === undefined ? (
        ui
      ) : (
        <PlatformSurfaceProvider value={adapter}>{ui}</PlatformSurfaceProvider>
      )}
    </BloomThemeProvider>,
  );
}

const style = (screen: ReturnType<typeof render>, id: string) =>
  resolvedStyle(screen.getByTestId(id).props.style);

/** The host tree as markup, with React's per-root `useId` values made comparable. */
const markup = (screen: ReturnType<typeof render>) =>
  JSON.stringify(screen.toJSON()).replace(/-r[0-9a-z]+-/g, '-r-');

describe('without the window capability', () => {
  const SHAPES: Record<string, Partial<AppShellProps>> = {
    sidebar: { title: 'Home', sidebar: { items: NAV } },
    toolbar: { title: 'Inbox' },
    'top bar': {
      sidebar: { items: NAV },
      topBar: <ReactNative.Text>Tabs</ReactNative.Text>,
      topBarVisibility: 'always',
    },
    overlay: { title: 'Photo', windowControls: 'overlay' },
  };

  it.each(Object.entries(SHAPES))('renders a %s shell exactly as before', (_shape, props) => {
    setWidth(1440);
    const before = markup(shell(undefined, props));
    for (const adapter of [null, { platform: 'test', capabilities: new Set<never>() }]) {
      const screen = shell(adapter, props);
      expect(markup(screen)).toBe(before);
      expect(screen.queryByTestId('shell-window-controls')).toBeNull();
      expect(screen.queryByTestId('sidebar-window-band')).toBeNull();
      expect(screen.queryByTestId('shell-header-drag')).toBeNull();
      expect(screen.queryByTestId('shell-top-bar-drag')).toBeNull();
      screen.unmount();
    }
  });
});

describe('with the window capability', () => {
  it('draws the controls in the window corner, where the metrics place them', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { title: 'Home', sidebar: { items: NAV } });
    expect(style(screen, 'shell-window-controls')).toMatchObject({
      position: 'absolute',
      top: 16,
      insetInlineStart: 14,
    });
    expect(screen.getByLabelText('Close')).toBeTruthy();
  });

  it('a sidebar in flow starts below the room, its top band the drag region', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { title: 'Home', sidebar: { items: NAV } });
    // The card sits a 12 gutter from the window's top, so 40 of the 52 are its own.
    expect(style(screen, 'sidebar-window-band')).toMatchObject({
      position: 'absolute',
      top: 0,
      height: 40,
    });
    expect(screen.getByTestId('sidebar-window-band').props.onStartShouldSetResponder()).toBe(true);
    // The header beside the sidebar keeps nothing.
    expect(screen.queryByTestId('shell-header-drag')).toBeNull();
  });

  it('a flush sidebar keeps the whole room', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      variant: 'feed',
      panels: true,
      scroll: 'fixed',
      header: null,
      navigationAlign: 'content',
      navigationGap: 0,
      navFrom: 0,
      framedFrom: 0,
      contentMaxWidth: 'none',
      sidebar: { items: NAV, surface: 'plain', variant: 'panel', width: 190 },
      children: (
        <AppShellPanel>
          <ReactNative.Text>Page</ReactNative.Text>
        </AppShellPanel>
      ),
    });
    expect(style(screen, 'sidebar-window-band').height).toBe(52);
  });

  it('a toolbar application: the header starts after the room and moves the window', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { title: 'Inbox' });
    // The header sits a 12 gutter from the window's leading edge.
    expect(style(screen, 'shell-header-drag')).toMatchObject({ paddingInlineStart: 76 });
    expect(screen.getByTestId('shell-header-drag').props.onStartShouldSetResponder()).toBe(true);
    expect(screen.getByText('Inbox')).toBeTruthy();
    expect(screen.queryByTestId('sidebar-window-band')).toBeNull();
  });

  it('a sidebar collapsed into a drawer: the header keeps the room, with the menu after it', () => {
    setWidth(700);
    const screen = shell(fakeWindow().adapter, { title: 'Home', sidebar: { items: NAV } });
    expect(screen.queryByTestId('sidebar-window-band')).toBeNull();
    expect(style(screen, 'shell-header-drag').paddingInlineStart).toBe(76);
    expect(
      screen.getByTestId('shell-header-drag').findByProps({ testID: 'shell-header-menu' }),
    ).toBeTruthy();
  });

  it('a top bar across the window keeps the room at its leading edge', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      sidebar: { items: NAV },
      topBar: <ReactNative.Text>Tabs</ReactNative.Text>,
      topBarVisibility: 'always',
    });
    expect(style(screen, 'shell-top-bar-drag')).toMatchObject({ paddingInlineStart: 88 });
    // The sidebar is below the bar, away from the corner.
    expect(screen.queryByTestId('sidebar-window-band')).toBeNull();
  });

  it('a page with `header={null}` and no sidebar owns the corner itself', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { header: null });
    expect(screen.queryByTestId('shell-header-drag')).toBeNull();
    expect(screen.getByTestId('shell-window-controls')).toBeTruthy();
  });

  it('`overlay`: no room anywhere, the controls on a glass plate', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      title: 'Photo',
      sidebar: { items: NAV },
      windowControls: 'overlay',
    });
    expect(screen.queryByTestId('sidebar-window-band')).toBeNull();
    expect(screen.queryByTestId('shell-header-drag')).toBeNull();
    // The plate's 6 margin around the group.
    expect(style(screen, 'shell-window-controls')).toMatchObject({ top: 10, insetInlineStart: 8 });
  });

  it('full screen: no controls and no room, until the window leaves it', () => {
    setWidth(1440);
    const { window, adapter } = fakeWindow({ state: { fullscreen: true } });
    const screen = shell(adapter, { title: 'Home', sidebar: { items: NAV } });
    expect(screen.queryByTestId('shell-window-controls')).toBeNull();
    expect(screen.queryByTestId('sidebar-window-band')).toBeNull();
    act(() => window.set({ fullscreen: false }));
    expect(screen.getByTestId('shell-window-controls')).toBeTruthy();
    expect(screen.getByTestId('sidebar-window-band')).toBeTruthy();
  });

  it('inactive, the controls stay, in neutral glass', () => {
    setWidth(1440);
    const { window, adapter } = fakeWindow();
    const screen = shell(adapter, { title: 'Inbox' });
    const fill = () => style(screen, 'shell-window-controls-close-paint').backgroundColor;
    const active = fill();
    act(() => window.set({ active: false }));
    expect(screen.getByTestId('shell-window-controls')).toBeTruthy();
    expect(fill()).not.toBe(active);
  });

  it("keeps the room of the platform's own controls without drawing any", () => {
    setWidth(1440);
    const screen = shell(fakeWindow({ controls: 'platform' }).adapter, {
      title: 'Home',
      sidebar: { items: NAV },
    });
    expect(screen.queryByTestId('shell-window-controls')).toBeNull();
    expect(style(screen, 'sidebar-window-band').height).toBe(40);
  });

  it('the corner has one owner: a shell inside a shell keeps no room and draws no controls', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      title: 'Outer',
      children: (
        <AppShell testID="inner" title="Inner" sidebar={{ items: NAV, testID: 'inner-sidebar' }} />
      ),
    });
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(screen.getByTestId('shell-window-controls')).toBeTruthy();
    expect(screen.queryByTestId('inner-window-controls')).toBeNull();
    expect(screen.queryByTestId('inner-sidebar-window-band')).toBeNull();
    expect(screen.queryByTestId('inner-header-drag')).toBeNull();
  });

  it('the adaptive shell keeps the room the same way', () => {
    setWidth(1440);
    const navigation = [{ value: 'home', label: 'Home', icon: <RiHomeLine /> }];
    const sidebar = shell(fakeWindow().adapter, { navigation, scroll: 'auto', title: 'Home' });
    expect(style(sidebar, 'shell-sidebar-window-band').height).toBe(40);
    expect(sidebar.getByTestId('shell-window-controls')).toBeTruthy();
    sidebar.unmount();

    setWidth(390);
    const phone = shell(fakeWindow().adapter, { navigation, scroll: 'auto', title: 'Home' });
    expect(phone.queryByTestId('shell-sidebar-window-band')).toBeNull();
    expect(style(phone, 'shell-header-drag').paddingInlineStart).toBe(88);
  });
});
