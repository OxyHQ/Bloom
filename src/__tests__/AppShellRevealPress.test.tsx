/**
 * A press on a native `reveal` drawer moves it before React renders: the open
 * amount starts toward its end (`withTiming`, run on the UI thread) inside the
 * request, and the state follows while it moves. The effect that drives the
 * open amount then leaves that motion to run, so the curve is the one the press
 * started; a controlled parent that declines slides it back.
 *
 * The reanimated mock lands `withTiming` at once and runs a mapper on render,
 * so the order of the calls is what shows "before": the timing toward 1 is
 * asked for before `onDrawerOpenChange` is told.
 *
 * The page's wrapper toggles its accessibility props with the drawer; a view
 * that only paints is flattened by Fabric, and the toggle unflattened it, moving
 * the whole page (a REMOVE and an INSERT of every child) on every open and
 * close. The reveal's hosts stay their own native views.
 */
import type React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { AppShell } from '../app-shell';
import { DRAWER_MS } from '../app-shell/use-drawer-swipe';
import { RiHomeLine } from '../icons/remix';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
/** The panel the drawer opens (272) less its 12 inset: `reveal` moves the page 272. */
const REVEAL_TRAVEL = 272;

const platform = ReactNative.Platform as { OS: string };
const originalOS = platform.OS;

beforeEach(() => {
  mockWindowSize({ width: 390, height: 900, scale: 1, fontScale: 1 });
});
afterEach(() => {
  platform.OS = originalOS;
  jest.restoreAllMocks();
});

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

function Reveal(props: Partial<React.ComponentProps<typeof AppShell>>) {
  return (
    <AppShell testID="shell" title="Home" drawer="reveal" sidebar={{ items: NAV }} {...props} />
  );
}

/** Every drawer timing asked for, in order, as its target. */
function recordDrawerTimings(order: string[]) {
  const real = Reanimated.withTiming;
  return jest.spyOn(Reanimated, 'withTiming').mockImplementation(((
    target: number,
    config?: { duration?: number },
    callback?: () => void,
  ) => {
    if (config?.duration === DRAWER_MS) order.push(`timing ${target}`);
    return real(target, config, callback);
  }) as typeof Reanimated.withTiming);
}

function pageShift(screen: ReturnType<typeof render>) {
  const style = resolvedStyle(
    screen.getByTestId('shell-reveal-page', { includeHiddenElements: true }).props.style,
  );
  const transform = style.transform as Array<Record<string, number>> | undefined;
  return transform?.find((item) => 'translateX' in item)?.translateX;
}

describe('AppShell reveal: a press moves the drawer first', () => {
  it('starts the open amount before the state, and the render does not restart it', () => {
    const order: string[] = [];
    recordDrawerTimings(order);
    const onDrawerOpenChange = jest.fn((open: boolean) => order.push(`state ${open}`));
    const screen = render(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    order.length = 0;

    fireEvent.press(screen.getByTestId('shell-header-menu'));
    expect(order).toEqual(['timing 1', 'state true']);
    expect(pageShift(screen)).toBe(REVEAL_TRAVEL);
  });

  it('closes the same way from the veil', () => {
    const order: string[] = [];
    recordDrawerTimings(order);
    const onDrawerOpenChange = jest.fn((open: boolean) => order.push(`state ${open}`));
    const screen = render(wrap(<Reveal onDrawerOpenChange={onDrawerOpenChange} />));
    fireEvent.press(screen.getByTestId('shell-header-menu'));
    order.length = 0;

    // The open drawer is modal, so the veil beside it is hidden from a reader.
    fireEvent.press(screen.getByTestId('shell-veil', { includeHiddenElements: true }));
    expect(order).toEqual(['timing 0', 'state false']);
    expect(pageShift(screen)).toBeUndefined();
  });

  it('slides back when a controlled parent declines the request', () => {
    const order: string[] = [];
    recordDrawerTimings(order);
    const declined = () => <Reveal drawerOpen={false} onDrawerOpenChange={() => {}} />;
    const screen = render(wrap(declined()));
    order.length = 0;

    fireEvent.press(screen.getByTestId('shell-header-menu'));
    expect(order).toEqual(['timing 1', 'timing 0']);
    // The mock's mapper reads the open amount on render.
    screen.rerender(wrap(declined()));
    expect(pageShift(screen)).toBeUndefined();
  });

  it('leaves the web to its CSS transition', () => {
    platform.OS = 'web';
    const order: string[] = [];
    recordDrawerTimings(order);
    const screen = render(wrap(<Reveal />));
    fireEvent.press(screen.getByTestId('shell-header-menu'));
    expect(order).toEqual([]);
  });
});

describe('AppShell reveal: the hosts stay native views', () => {
  it.each([false, true])('keeps the page wrapper and the veil unflattened (open %s)', (open) => {
    const screen = render(wrap(<Reveal drawerOpen={open} />));
    const page = screen.getByTestId('shell-reveal-page', { includeHiddenElements: true });
    const hosts = page.findAll(
      (node) => typeof node.type === 'string' && node.props.collapsable === false,
      { deep: true },
    );
    // The page itself, its wrapper (whose accessibility toggles) and the veil.
    expect(hosts.length).toBeGreaterThanOrEqual(3);
    for (const id of ['shell-navigation-drawer', 'shell-reveal-bars']) {
      expect(screen.getByTestId(id, { includeHiddenElements: true }).props.collapsable).toBe(false);
    }
  });
});
