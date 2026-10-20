/**
 * `drawerSwipe`: the native edge swipe that opens and closes AppShell's drawer.
 *
 * THE GESTURE IS DRIVEN THROUGH ITS RECORDED CALLBACKS (as `SwipeRow.test.tsx`
 * does): the gesture-handler mock records what each `Gesture.Pan()` was given —
 * its callbacks on `__handlers`, `enabled` and the activation offsets on
 * `__config` — and every decision under test lives inside those callbacks: the
 * start-edge strip, the direction that claims the touch, the snap by position
 * and velocity, and the settle into `onDrawerOpenChange`. The reanimated mock
 * runs a mapper on render and lands `withTiming` at once, so after a drag the
 * rendered transform reads where the finger left the drawer, and the settle
 * runs synchronously. What it cannot show is a real finger competing with a
 * real ScrollView, or with iOS's back swipe: that is a device's to verify.
 */
import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Gesture } from 'react-native-gesture-handler';
import * as Reanimated from 'react-native-reanimated';

import { AppShell } from '../app-shell';
import { DRAWER_SWIPE } from '../app-shell/constants';
import { RiHomeLine } from '../icons/remix';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle, type StyleEntry } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
const WIDTH = 390;
/** The panel the drawer opens (272) less its 12 inset: `reveal` moves the page 272. */
const REVEAL_TRAVEL = 272;
/** The overlay drawer's whole box: the 260 panel and 12 either side. */
const OVERLAY_TRAVEL = 284;

const i18n = ReactNative.I18nManager as { isRTL: boolean };
const platform = ReactNative.Platform as { OS: string };
const originalOS = platform.OS;

afterEach(() => {
  i18n.isRTL = false;
  platform.OS = originalOS;
  jest.restoreAllMocks();
});

function setWidth(width: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

function wrap(ui: React.ReactElement) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

interface TouchEvent {
  allTouches: Array<{ id: number; x: number; y: number; absoluteX: number; absoluteY: number }>;
}
interface RecordedPan {
  __handlers: {
    onTouchesDown?: (event: TouchEvent, manager: { fail: () => void }) => void;
    onStart?: () => void;
    onUpdate?: (event: { translationX: number }) => void;
    onEnd?: (event: { translationX: number; velocityX: number }) => void;
  };
  __config: { enabled?: boolean; activeOffsetX?: number; failOffsetY?: [number, number] };
}

/** Every pan built so far; the shell rebuilds its pair whenever its state changes. */
function recordPans() {
  return jest.spyOn(Gesture, 'Pan');
}

/** The pan that can claim a touch right now: the last one built enabled. */
function live(spy: ReturnType<typeof recordPans>): RecordedPan {
  const pans = spy.mock.results.map((result) => result.value as RecordedPan);
  const enabled = pans.filter((pan) => pan.__config.enabled === true);
  const last = enabled[enabled.length - 1];
  if (!last) throw new Error('No enabled pan was built');
  return last;
}

/** Whether a touch landing at `x` (from the frame's physical left) is turned away. */
function failsAt(pan: RecordedPan, x: number): boolean {
  const manager = { fail: jest.fn() };
  pan.__handlers.onTouchesDown?.(
    { allTouches: [{ id: 0, x, y: 200, absoluteX: x, absoluteY: 200 }] },
    manager,
  );
  return manager.fail.mock.calls.length > 0;
}

/** A finger that has travelled `dx` (physical) and is still down. */
function hold(pan: RecordedPan, dx: number) {
  act(() => {
    pan.__handlers.onStart?.();
    pan.__handlers.onUpdate?.({ translationX: dx });
  });
}

/** The same finger, moved on to `dx` and lifted at `velocityX`. */
function release(pan: RecordedPan, dx: number, velocityX = 0) {
  act(() => {
    pan.__handlers.onUpdate?.({ translationX: dx });
    pan.__handlers.onEnd?.({ translationX: dx, velocityX });
  });
}

function drag(pan: RecordedPan, dx: number, velocityX = 0) {
  hold(pan, dx);
  release(pan, dx, velocityX);
}

function translateX(style: StyleEntry): number | undefined {
  const transform = style.transform as Array<Record<string, number>> | undefined;
  return transform?.find((item) => 'translateX' in item)?.translateX;
}

type Shell = Partial<React.ComponentProps<typeof AppShell>>;

function Overlay(props: Shell) {
  return <AppShell testID="shell" title="Home" sidebar={{ items: NAV }} drawerSwipe {...props} />;
}

describe('AppShell drawerSwipe: off', () => {
  it.each([['overlay'], ['reveal']] as const)(
    'builds no gesture without the prop (%s), and the hamburger still opens it',
    (drawer) => {
      setWidth(WIDTH);
      const pans = recordPans();
      const onDrawerOpenChange = jest.fn();
      const screen = render(
        wrap(
          <AppShell
            testID="shell"
            title="Home"
            drawer={drawer}
            sidebar={{ items: NAV }}
            onDrawerOpenChange={onDrawerOpenChange}
          />,
        ),
      );
      fireEvent.press(screen.getByTestId('shell-header-menu'));
      expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
      expect(pans).not.toHaveBeenCalled();
    },
  );

  it('builds none on the web either, where the drawer stays press-only', () => {
    platform.OS = 'web';
    setWidth(WIDTH);
    const pans = recordPans();
    render(wrap(<Overlay />));
    expect(pans).not.toHaveBeenCalled();
  });

  it('is built but disabled while the navigation is in flow', () => {
    setWidth(1440);
    const pans = recordPans();
    render(wrap(<Overlay />));
    expect(pans).toHaveBeenCalled();
    const built = pans.mock.results.map((result) => result.value as RecordedPan);
    expect(built.every((pan) => pan.__config.enabled === false)).toBe(true);
  });
});

describe('AppShell drawerSwipe: overlay', () => {
  it('claims a closed drawer only from the start-edge strip, moving toward the end', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    render(wrap(<Overlay />));
    const pan = live(pans);
    expect(pan.__config.activeOffsetX).toBe(DRAWER_SWIPE.activateOffset);
    expect(pan.__config.failOffsetY).toEqual([-DRAWER_SWIPE.failOffset, DRAWER_SWIPE.failOffset]);
    expect(failsAt(pan, 4)).toBe(false);
    expect(failsAt(pan, DRAWER_SWIPE.edgeWidth)).toBe(false);
    expect(failsAt(pan, DRAWER_SWIPE.edgeWidth + 1)).toBe(true);
    expect(failsAt(pan, 200)).toBe(true);
  });

  it('follows the finger 1:1, then opens past half way and reports it', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Overlay onDrawerOpenChange={onDrawerOpenChange} />));
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();

    const pan = live(pans);
    hold(pan, 100);
    // Mounted under the finger before anything is decided, 100 of its 284 out.
    const drawer = screen.getByTestId('shell-navigation-drawer');
    expect(translateX(resolvedStyle(drawer.props.style))).toBe(-(OVERLAY_TRAVEL - 100));
    expect(onDrawerOpenChange).not.toHaveBeenCalled();

    release(pan, 200);
    expect(onDrawerOpenChange).toHaveBeenCalledTimes(1);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(
      translateX(resolvedStyle(screen.getByTestId('shell-navigation-drawer').props.style)),
    ).toBe(-0);
    // Open, it is the drawer's own pan that is live now.
    expect(live(pans).__config.activeOffsetX).toBe(-DRAWER_SWIPE.activateOffset);
  });

  it('snaps a short, slow pan back closed without reporting anything', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Overlay onDrawerOpenChange={onDrawerOpenChange} />));
    drag(live(pans), 60, 100);
    expect(onDrawerOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('shell-navigation-drawer')).toBeNull();
  });

  it('opens on a fling however short the pan', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    render(wrap(<Overlay onDrawerOpenChange={onDrawerOpenChange} />));
    drag(live(pans), 40, DRAWER_SWIPE.flingVelocity + 1);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
  });

  it('closes an open drawer under a pan toward the start edge, from anywhere on it', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Overlay drawerOpen onDrawerOpenChange={onDrawerOpenChange} />));
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    const pan = live(pans);
    expect(pan.__config.activeOffsetX).toBe(-DRAWER_SWIPE.activateOffset);
    expect(failsAt(pan, 200)).toBe(false);
    drag(pan, -200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  });

  it('a fling back toward the start closes it however far it was dragged open', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    render(wrap(<Overlay drawerOpen onDrawerOpenChange={onDrawerOpenChange} />));
    drag(live(pans), -30, -(DRAWER_SWIPE.flingVelocity + 1));
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  });

  it('uncontrolled: the swipe closes the drawer it opened', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const screen = render(wrap(<Overlay />));
    drag(live(pans), 200);
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    drag(live(pans), -200);
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
  });

  it('controlled: a parent that keeps it closed gets the request and the drawer slides back', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(
      wrap(<Overlay drawerOpen={false} onDrawerOpenChange={onDrawerOpenChange} />),
    );
    drag(live(pans), 200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByTestId('shell-navigation-drawer')).toBeNull();
  });

  it('reduced motion: the release snaps rather than easing', () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const timing = jest.spyOn(Reanimated, 'withTiming');
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    render(wrap(<Overlay onDrawerOpenChange={onDrawerOpenChange} />));
    timing.mockClear();
    drag(live(pans), 200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(timing).not.toHaveBeenCalled();
  });

  it('RTL: the strip is the right edge and the drawer opens leftward', () => {
    i18n.isRTL = true;
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Overlay onDrawerOpenChange={onDrawerOpenChange} />));
    const pan = live(pans);
    expect(pan.__config.activeOffsetX).toBe(-DRAWER_SWIPE.activateOffset);
    expect(failsAt(pan, WIDTH - 4)).toBe(false);
    expect(failsAt(pan, WIDTH - DRAWER_SWIPE.edgeWidth)).toBe(false);
    expect(failsAt(pan, WIDTH - DRAWER_SWIPE.edgeWidth - 1)).toBe(true);
    expect(failsAt(pan, 4)).toBe(true);

    hold(pan, -100);
    expect(
      translateX(resolvedStyle(screen.getByTestId('shell-navigation-drawer').props.style)),
    ).toBe(OVERLAY_TRAVEL - 100);
    // Back past where it started: a rightward pan pushes nothing open here.
    release(pan, 100);
    expect(onDrawerOpenChange).not.toHaveBeenCalled();

    drag(live(pans), -200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    // And open, the closing pan is the rightward one.
    expect(live(pans).__config.activeOffsetX).toBe(DRAWER_SWIPE.activateOffset);
  });
});

describe('AppShell drawerSwipe: reveal', () => {
  function Reveal(props: Shell) {
    return (
      <AppShell
        testID="shell"
        title="Home"
        drawer="reveal"
        sidebar={{ items: NAV }}
        drawerSwipe
        {...props}
      />
    );
  }
  const page = (screen: ReturnType<typeof render>) =>
    translateX(
      resolvedStyle(
        screen.getByTestId('shell-reveal-page', { includeHiddenElements: true }).props.style,
      ),
    );

  it('moves the PAGE 1:1 from the edge and opens past half way', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    const pan = live(pans);
    expect(failsAt(pan, 10)).toBe(false);
    expect(failsAt(pan, 120)).toBe(true);

    hold(pan, 100);
    screen.rerender(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    expect(page(screen)).toBe(100);

    release(pan, 200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(page(screen)).toBe(REVEAL_TRAVEL);
  });

  it('snaps a short pan back to the closed page', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    drag(live(pans), 80);
    screen.rerender(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    expect(onDrawerOpenChange).not.toHaveBeenCalled();
    expect(page(screen)).toBeUndefined();
  });

  it('open: the same frame pan, toward the start edge, closes it', () => {
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    render(wrap(<Reveal drawerOpen onDrawerOpenChange={onDrawerOpenChange} />));
    const pan = live(pans);
    expect(pan.__config.activeOffsetX).toBe(-DRAWER_SWIPE.activateOffset);
    expect(failsAt(pan, 300)).toBe(false);
    drag(pan, -200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  });

  it('RTL: opens from the right edge, the page moving left', () => {
    i18n.isRTL = true;
    setWidth(WIDTH);
    const pans = recordPans();
    const onDrawerOpenChange = jest.fn();
    const screen = render(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    const pan = live(pans);
    expect(failsAt(pan, WIDTH - 10)).toBe(false);
    expect(failsAt(pan, 10)).toBe(true);
    drag(pan, -200);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(page(screen)).toBe(-REVEAL_TRAVEL);
  });
});
