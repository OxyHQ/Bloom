/**
 * The dock, on the native path: the navigation's slot and its content are two
 * readings of one progress (here the Reanimated mock lands each animation at
 * once), the peek floats the SAME content inset from the window, and docking
 * from a peek lands in place.
 *
 * The web runs the same state through CSS (registered custom properties);
 * `AppShellDock.web.test.tsx` covers its markup and
 * `scripts/verify-app-shell-dock.mjs` its motion in Chromium.
 */
import React from 'react';
import * as ReactNative from 'react-native';
import * as spec from '../motion/spec';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { AppShell, AppShellPanel, useAppShell } from '../app-shell';
import type { AppShellContextValue } from '../app-shell/context';
import type { AppShellProps } from '../app-shell/types';
import {
  DOCK_DEFAULTS,
  dockExtent,
  dockOffset,
  peekFadeTarget,
  peekOffset,
  resolveDock,
} from '../app-shell/dock';
import { RiHomeLine } from '../icons/remix';
import { resolvedStyle } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];

let shell: AppShellContextValue | null = null;
function Probe() {
  shell = useAppShell();
  return <Text>Page</Text>;
}

function windowShell(props: Partial<AppShellProps> = {}, dock: object = { peek: true }) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        <AppShell
          testID="shell"
          variant="feed"
          panels
          scroll="fixed"
          header={null}
          background="transparent"
          navigationAlign="content"
          navigationGap={0}
          navFrom={0}
          framedFrom={0}
          contentMaxWidth="none"
          frameInset={{ top: 6, end: 7, bottom: 7, start: 7 }}
          sidebar={{
            items: NAV,
            surface: 'plain',
            variant: 'panel',
            collapsed: false,
            collapseDisabled: true,
            width: 190,
            dock,
          }}
          {...props}
        >
          <AppShellPanel>
            <Probe />
          </AppShellPanel>
        </AppShell>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

// The Reanimated mock lands a shared value without rendering; the real one
// writes the new style on the UI thread. Rendering again reads the landed value.
function settle(screen: ReturnType<typeof render>, ui: () => React.ReactElement) {
  screen.rerender(ui());
}

const style = (screen: ReturnType<typeof render>, id: string) =>
  resolvedStyle(screen.getByTestId(id, { includeHiddenElements: true }).props.style);
const translateX = (screen: ReturnType<typeof render>) =>
  (style(screen, 'shell-navigation-host').transform as { translateX: number }[])[0]!.translateX;

beforeEach(() => {
  shell = null;
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width: 1280, height: 800, scale: 1, fontScale: 1 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('dock geometry', () => {
  it('moves the content edge and the region together, as one progress', () => {
    // A 190 sidebar flush to the window, the frame's own inset 7 behind it.
    for (const progress of [0, 0.25, 0.5, 1, 1.0174]) {
      const contentEdge = dockExtent(190, 7, progress);
      const regionEdge = 190 + dockOffset(190, progress);
      expect(contentEdge).toBeCloseTo(7 + 183 * progress, 9);
      expect(regionEdge).toBeCloseTo(190 * progress, 9);
    }
  });

  it('starts the peek with its far side (and its shadow) past the window edge', () => {
    const inset = DOCK_DEFAULTS.peek.inset;
    expect(inset + 190 + peekOffset(190, 0)).toBe(inset - DOCK_DEFAULTS.shadowRoom);
    expect(peekOffset(190, 1)).toBe(-0);
  });

  it('resolves the measured defaults and keeps declared values', () => {
    expect(resolveDock(undefined)).toBeNull();
    const plain = resolveDock({})!;
    expect(plain.peek).toBeNull();
    expect(plain.motion.show).toEqual({ response: 0.215, dampingRatio: 0.79 });
    expect(plain.motion.peekOut).toEqual({ duration: 150, easing: [0.645, 0.045, 0.355, 1] });
    const custom = resolveDock({
      peek: { inset: 10, edge: Number.NaN, appearance: 'plain' },
      motion: { show: { duration: 100 } },
    })!;
    expect(custom.peek).toMatchObject({
      inset: { top: 10, bottom: 10, start: 10, end: 10 },
      edge: 8,
      radius: 12,
      appearance: 'plain',
      chrome: {},
    });
    expect(custom.motion.hide).toEqual({ duration: 100 });
  });

  it('resolves a per-edge inset, each missing or invalid edge at the default', () => {
    expect(resolveDock({ peek: { inset: { top: 4, start: 6, end: 6 } } })!.peek!.inset).toEqual({
      top: 4,
      bottom: 5,
      start: 6,
      end: 6,
    });
    expect(resolveDock({ peek: { inset: { top: -3, end: Number.NaN } } })!.peek!.inset).toEqual({
      top: 0,
      bottom: 5,
      start: 5,
      end: 5,
    });
  });

  it("fades a peek only when asked, on the slide's own motion unless given its own", () => {
    expect(resolveDock({ peek: true })!.peek!.fade).toBe(false);
    const follows = resolveDock({
      peek: { fade: true },
      motion: { peekIn: { duration: 180, easing: [0.215, 0.61, 0.355, 1] } },
    })!;
    expect(follows.peek!.fade).toBe(true);
    expect(follows.motion.peekFadeIn).toEqual({ duration: 180, easing: [0.215, 0.61, 0.355, 1] });
    expect(follows.motion.peekFadeOut).toEqual(DOCK_DEFAULTS.motion.peekOut);
    const own = resolveDock({
      peek: { fade: true },
      motion: { peekFadeIn: { duration: 90 }, peekFadeOut: { response: 0.1, dampingRatio: 1 } },
    })!;
    expect(own.motion.peekFadeIn).toEqual({ duration: 90 });
    expect(own.motion.peekFadeOut).toEqual({ response: 0.1, dampingRatio: 1 });
    expect(own.motion.peekIn).toEqual(DOCK_DEFAULTS.motion.peekIn);
  });

  it("fades only the peek's own opening and closing", () => {
    const dock = resolveDock({ peek: { fade: true } });
    const at = (hidden: boolean, phase: 'closed' | 'open' | 'closing', settledHidden = true) =>
      peekFadeTarget(dock, { hidden, phase, settledHidden });
    expect(at(false, 'closed', false)).toEqual({ presence: 1, motion: null });
    expect(at(true, 'closed', false)).toEqual({ presence: 1, motion: null });
    expect(at(true, 'closed')).toEqual({ presence: 0, motion: null });
    expect(at(true, 'open')).toEqual({ presence: 1, motion: dock!.motion.peekFadeIn });
    expect(at(true, 'closing')).toEqual({ presence: 0, motion: dock!.motion.peekFadeOut });
    expect(
      peekFadeTarget(resolveDock({ peek: true }), {
        hidden: true,
        phase: 'closed',
        settledHidden: true,
      }),
    ).toEqual({ presence: 1, motion: null });
  });
});

describe('AppShell sidebar.dock (native)', () => {
  it('docked: the slot is the sidebar width and the content sits at its place', () => {
    const screen = render(windowShell());
    expect(style(screen, 'shell-navigation')).toMatchObject({ width: 190, flexShrink: 0 });
    expect(translateX(screen)).toBeCloseTo(0, 9);
    expect(shell!.navigationDock).toMatchObject({ available: true, hidden: false, peeking: false });
    expect(screen.queryByTestId('shell-navigation-edge')).toBeNull();
    expect(style(screen, 'shell').backgroundColor).toBe('transparent');
  });

  it('hidden: the slot keeps the frame inset, the content slides past the edge and leaves the tree', () => {
    const changes: boolean[] = [];
    const ui = () =>
      windowShell({}, { peek: true, onHiddenChange: (hidden: boolean) => changes.push(hidden) });
    const screen = render(ui());
    act(() => shell!.navigationDock.toggleHidden());
    settle(screen, ui);
    expect(changes).toEqual([true]);
    expect(style(screen, 'shell-navigation')).toMatchObject({ width: 7 });
    expect(translateX(screen)).toBe(-190);
    const host = screen.getByTestId('shell-navigation-host', { includeHiddenElements: true });
    expect(host.props.accessibilityElementsHidden).toBe(true);
    expect(host.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(host.props.pointerEvents).toBe('none');
    expect(
      screen.getByTestId('shell-navigation-edge', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('peeks the same content inset from the window and slides it out after the delay', () => {
    jest.useFakeTimers();
    const peeks: boolean[] = [];
    const screen = render(
      windowShell(
        {},
        { peek: true, defaultHidden: true, onPeekChange: (open: boolean) => peeks.push(open) },
      ),
    );
    const content = screen.getByText('Home', { includeHiddenElements: true });
    act(() => shell!.navigationDock.peek(true));
    expect(peeks).toEqual([true]);
    expect(shell!.navigationDock.peeking).toBe(true);
    expect(style(screen, 'shell-navigation-host')).toMatchObject({
      position: 'absolute',
      top: 5,
      bottom: 5,
      insetInlineStart: 5,
      width: 190,
      borderRadius: 12,
    });
    expect(translateX(screen)).toBeCloseTo(0, 9);
    expect(screen.getByText('Home', { includeHiddenElements: true })).toBe(content);
    expect(style(screen, 'shell-navigation')).toMatchObject({ width: 7, zIndex: 1 });

    act(() => shell!.navigationDock.peek(false));
    act(() => jest.advanceTimersByTime(DOCK_DEFAULTS.peek.hideDelay - 1));
    act(() => shell!.navigationDock.peek(true));
    act(() => jest.advanceTimersByTime(500));
    expect(shell!.navigationDock.peeking).toBe(true);

    act(() => shell!.navigationDock.peek(false));
    act(() => jest.advanceTimersByTime(DOCK_DEFAULTS.peek.hideDelay));
    expect(peeks).toEqual([true, false]);
    expect(shell!.navigationDock.peeking).toBe(false);
    expect(style(screen, 'shell-navigation-host')).toMatchObject({ top: 0, bottom: 0 });
  });

  it('places a peek by its own edges and paints the backing it is given, its shadow outside the clip', () => {
    const shadow = '0px 6px 20px rgba(0, 0, 0, 0.2)';
    const screen = render(
      windowShell(
        {},
        {
          peek: {
            inset: { top: 4, bottom: 9, start: 6 },
            chrome: { surface: '#f4e9ee', border: '#d8c8d0', borderWidth: 0.5, shadow },
          },
          defaultHidden: true,
        },
      ),
    );
    act(() => shell!.navigationDock.peek(true));
    const host = style(screen, 'shell-navigation-host');
    expect(host).toMatchObject({ top: 4, bottom: 9, insetInlineStart: 6, borderRadius: 12 });
    expect(host.overflow).toBeUndefined();
    expect(style(screen, 'shell-navigation-host-clip')).toMatchObject({
      borderRadius: 12,
      overflow: 'hidden',
    });
    const backing = screen
      .getByTestId('shell-navigation-host-content', { includeHiddenElements: true })
      .children.find(
        (child) =>
          typeof child !== 'string' &&
          resolvedStyle(child.props.style).backgroundColor === '#f4e9ee',
      );
    expect(backing).toBeTruthy();
    expect(
      resolvedStyle((backing as unknown as { props: { style: unknown } }).props.style),
    ).toMatchObject({
      borderColor: '#d8c8d0',
      borderWidth: 0.5,
      boxShadow: shadow,
    });
  });

  it('leaves a manual peek to its host: the pointer leaving the region does not close it', () => {
    jest.useFakeTimers();
    const screen = render(windowShell({}, { peek: { trigger: 'manual' }, defaultHidden: true }));
    expect(screen.queryByTestId('shell-navigation-edge')).toBeNull();
    act(() => shell!.navigationDock.peek(true));
    const host = screen.getByTestId('shell-navigation-host', { includeHiddenElements: true });
    expect(host.props.onPointerLeave).toBeUndefined();
    expect(host.props.onPointerEnter).toBeUndefined();
    act(() => jest.advanceTimersByTime(1000));
    expect(shell!.navigationDock.peeking).toBe(true);
    act(() => shell!.navigationDock.peek(false));
    act(() => jest.advanceTimersByTime(DOCK_DEFAULTS.peek.hideDelay + 500));
    expect(shell!.navigationDock.peeking).toBe(false);
  });

  it('fades a fading peek in with the slide and out again, on the host itself', () => {
    jest.useFakeTimers();
    const animate = jest.spyOn(spec, 'animateWithSpec');
    const fadeIn = { duration: 180, easing: [0.215, 0.61, 0.355, 1] as const };
    const ui = () =>
      windowShell(
        {},
        { peek: { fade: true }, defaultHidden: true, motion: { peekIn: fadeIn, peekOut: fadeIn } },
      );
    const screen = render(ui());
    expect(style(screen, 'shell-navigation-host').opacity).toBe(1);
    act(() => shell!.navigationDock.peek(true));
    expect(animate).toHaveBeenCalledWith(expect.anything(), 1, fadeIn, expect.anything());
    settle(screen, ui);
    expect(style(screen, 'shell-navigation-host').opacity).toBe(1);
    act(() => shell!.navigationDock.peek(false));
    act(() => jest.advanceTimersByTime(DOCK_DEFAULTS.peek.hideDelay));
    expect(animate).toHaveBeenCalledWith(expect.anything(), 0, fadeIn, expect.anything());
    settle(screen, ui);
    // Out of the peek it is whole again, wherever it is.
    expect(style(screen, 'shell-navigation-host').opacity).toBe(1);
  });

  it('docks from a peek in place', () => {
    const peeks: boolean[] = [];
    const ui = () =>
      windowShell(
        {},
        { peek: true, defaultHidden: true, onPeekChange: (open: boolean) => peeks.push(open) },
      );
    const screen = render(ui());
    act(() => shell!.navigationDock.peek(true));
    act(() => shell!.navigationDock.setHidden(false));
    settle(screen, ui);
    expect(peeks).toEqual([true, false]);
    expect(style(screen, 'shell-navigation')).toMatchObject({ width: 190 });
    expect(style(screen, 'shell-navigation-host')).toMatchObject({ top: 0, bottom: 0 });
    expect(translateX(screen)).toBeCloseTo(0, 9);
  });

  it('never peeks while shown, and is inert without a dock', () => {
    render(windowShell());
    act(() => shell!.navigationDock.peek(true));
    expect(shell!.navigationDock.peeking).toBe(false);
    const screen = render(
      windowShell({ sidebar: { items: NAV, surface: 'plain', width: 190, variant: 'panel' } }),
    );
    expect(shell!.navigationDock.available).toBe(false);
    act(() => shell!.navigationDock.setHidden(true));
    expect(style(screen, 'shell-navigation').width).toBeUndefined();
  });

  it('mirrors the slide in right-to-left', () => {
    Object.defineProperty(ReactNative.I18nManager, 'isRTL', { value: true, configurable: true });
    try {
      const screen = render(windowShell({}, { peek: true, defaultHidden: true }));
      expect(translateX(screen)).toBe(190);
    } finally {
      Object.defineProperty(ReactNative.I18nManager, 'isRTL', { value: false, configurable: true });
    }
  });

  it('frames the region with per-edge insets', () => {
    const screen = render(
      windowShell({ sidebar: { items: NAV, surface: 'card', width: 190, variant: 'panel' } }),
    );
    const row = screen
      .UNSAFE_getAllByType(ReactNative.View)
      .map((node) => resolvedStyle(node.props.style))
      .find((s) => s.flexDirection === 'row' && s.paddingInlineEnd === 7);
    expect(row).toMatchObject({
      paddingTop: 6,
      paddingBottom: 7,
      paddingInlineStart: 7,
      paddingInlineEnd: 7,
    });
  });
});

describe('AppShell topBarDock (native)', () => {
  it('collapses the measured bar out of the layout and peeks it from the top edge', () => {
    const ui = () =>
      windowShell({
        sidebar: undefined,
        topBar: <Text>Tabs</Text>,
        topBarVisibility: 'always',
        topBarDock: { peek: true },
      });
    const screen = render(ui());
    const bar = screen.getByTestId('shell-top-bar');
    act(() => bar.props.onLayout({ nativeEvent: { layout: { height: 42, width: 1280 } } }));
    expect(style(screen, 'shell-top-bar-slot')).toMatchObject({ height: 42 });
    act(() => shell!.topBarDock.setHidden(true));
    settle(screen, ui);
    expect(style(screen, 'shell-top-bar-slot')).toMatchObject({ height: 0 });
    const hidden = style(screen, 'shell-top-bar-host');
    expect((hidden.transform as { translateY: number }[])[0]!.translateY).toBe(-42);
    act(() => shell!.topBarDock.peek(true));
    expect(style(screen, 'shell-top-bar-host')).toMatchObject({
      top: 5,
      insetInlineStart: 5,
      insetInlineEnd: 5,
      borderRadius: 12,
    });
  });
});
