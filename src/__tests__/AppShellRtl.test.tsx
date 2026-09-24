/**
 * @jest-environment jsdom
 */

/**
 * Right-to-left layout for the page frame: `AppShell`, `Sidebar`, `BottomBar`.
 *
 * Two mechanisms, and this suite pins both:
 *
 *   - INSETS are logical (`insetInlineStart`, `paddingInlineEnd`,
 *     `borderEndWidth`, …) and mirror with no code at all — react-native-web
 *     writes them as CSS logical properties that follow `<html dir>`, and native
 *     Yoga resolves them against `I18nManager`. What is asserted is that the
 *     logical key is the one that landed and the physical one did not.
 *   - SIGNS do not mirror: a `translateX`, a `scaleX`, a `transformOrigin`, a
 *     floating `side`. Those read `useIsRtl()`, and what is asserted is that the
 *     value FLIPS between the two directions.
 *
 * Direction is driven the way each platform supplies it: `I18nManager.isRTL` for
 * native (the mocked module's own field), `document.documentElement.dir` for web.
 *
 * What this cannot see: the mirrored PAINT. Jest has no layout engine, so that a
 * logical key really lands on the right edge belongs to a browser with
 * `dir="rtl"` and to a device with `forceRTL`.
 */

import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AppShell, NotificationBell, ProOfferCard } from '../app-shell';
import { BottomBarBase } from '../bottom-bar/BottomBarBase';
import { mirrorAlign, mirrorSide, useIsRtl } from '../hooks/use-is-rtl';
import { RiHomeLine } from '../icons/remix';
import { PortalOutlet, PortalProvider } from '../portal';
import { Sidebar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle, type StyleEntry } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];

const i18n = ReactNative.I18nManager as { isRTL: boolean };
const platform = ReactNative.Platform as { OS: string };
const originalOS = platform.OS;

function setRtl(rtl: boolean) {
  i18n.isRTL = rtl;
}

function setWidth(width: number) {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => {
  setRtl(false);
  platform.OS = originalOS;
  document.documentElement.removeAttribute('dir');
  jest.restoreAllMocks();
});

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

type Screen = ReturnType<typeof renderIn>;

/** Every HOST node's resolved style, for the regions that carry no testID. */
function hostStyles(screen: Screen): StyleEntry[] {
  return screen.UNSAFE_root
    .findAll(node => typeof node.type === 'string')
    .map(node => resolvedStyle(node.props.style));
}

function translateX(style: StyleEntry): number | undefined {
  const transform = style.transform as Array<Record<string, unknown>> | undefined;
  const entry = transform?.find(item => 'translateX' in item);
  return entry?.translateX as number | undefined;
}

function scaleX(style: StyleEntry): number | undefined {
  const transform = style.transform as Array<Record<string, unknown>> | undefined;
  const entry = transform?.find(item => 'scaleX' in item);
  return entry?.scaleX as number | undefined;
}

describe('useIsRtl', () => {
  function Probe() {
    return <ReactNative.Text testID="probe">{useIsRtl() ? 'rtl' : 'ltr'}</ReactNative.Text>;
  }
  const read = (screen: Screen) => screen.getByTestId('probe').props.children;

  it('native: reads I18nManager.isRTL', () => {
    platform.OS = 'ios';
    expect(read(render(<Probe />))).toBe('ltr');
    setRtl(true);
    expect(read(render(<Probe />))).toBe('rtl');
  });

  it('web: reads <html dir>, NOT I18nManager, and follows a live change', async () => {
    platform.OS = 'web';
    // A web app's I18nManager says nothing about the document's direction.
    setRtl(true);
    const screen = render(<Probe />);
    expect(read(screen)).toBe('ltr');

    await act(async () => {
      document.documentElement.setAttribute('dir', 'rtl');
      // MutationObserver delivers on a microtask.
      await Promise.resolve();
    });
    expect(read(screen)).toBe('rtl');

    await act(async () => {
      document.documentElement.setAttribute('dir', 'ltr');
      await Promise.resolve();
    });
    expect(read(screen)).toBe('ltr');
  });
});

describe('floating sides are physical, so the trailing ones are mirrored by hand', () => {
  it('mirrors left/right and leaves top/bottom alone', () => {
    expect(mirrorSide('right', false)).toBe('right');
    expect(mirrorSide('right', true)).toBe('left');
    expect(mirrorSide('left', true)).toBe('right');
    expect(mirrorSide('bottom', true)).toBe('bottom');
  });

  it('mirrors align only under a vertical side, where it is horizontal', () => {
    expect(mirrorAlign('end', 'bottom', true)).toBe('start');
    expect(mirrorAlign('start', 'top', true)).toBe('end');
    expect(mirrorAlign('center', 'bottom', true)).toBe('center');
    expect(mirrorAlign('end', 'right', true)).toBe('end');
    expect(mirrorAlign('end', 'bottom', false)).toBe('end');
  });
});

describe('AppShell reveal drawer', () => {
  it.each([
    [false, 272],
    [true, -272],
  ])('dashboard (rtl=%s): the page slides toward the END edge', (rtl, expected) => {
    setRtl(rtl);
    setWidth(390);
    const screen = renderIn(
      <AppShell testID="shell" drawer="reveal" drawerOpen sidebar={{ items: NAV }}
        bottomBar={<ReactNative.Text>Navigation</ReactNative.Text>} />,
    );
    expect(translateX(resolvedStyle(screen.getByTestId('shell-reveal-bars').props.style))).toBe(expected);
  });

  it.each([
    [false, 284],
    [true, -284],
  ])('feed (rtl=%s): the page slides toward the END edge', (rtl, expected) => {
    setRtl(rtl);
    setWidth(390);
    const screen = renderIn(<AppShell testID="shell" variant="feed" drawer="reveal" drawerOpen sidebar={{ items: NAV }} />);
    expect(translateX(resolvedStyle(screen.getByTestId('shell-reveal-page').props.style))).toBe(expected);
  });

  it.each([
    ['dashboard', false],
    ['dashboard', true],
    ['feed', false],
    ['feed', true],
  ] as const)('%s (rtl=%s): the rail waits at the START edge and scales from it', (variant, rtl) => {
    setRtl(rtl);
    setWidth(390);
    const screen = renderIn(<AppShell testID="shell" variant={variant} drawer="reveal" drawerOpen sidebar={{ items: NAV }} />);
    const styles = hostStyles(screen);
    const rail = styles.filter(style => style.width === 272 && style.top === 0 && style.bottom === 0);
    expect(rail).toHaveLength(1);
    expect(rail[0]).toMatchObject({ insetInlineStart: 0, paddingInlineStart: 6 });
    expect(rail[0]!.left).toBeUndefined();
    expect(rail[0]!.paddingLeft).toBeUndefined();
    const scaler = styles.filter(style => style.width === 260 && style.transformOrigin !== undefined);
    expect(scaler).toHaveLength(1);
    expect(scaler[0]!.transformOrigin).toBe(rtl ? 'right center' : 'left center');
  });
});

describe('AppShell overlay drawer and docked nav', () => {
  it('the overlay drawer is anchored to the START edge', () => {
    setRtl(true);
    setWidth(700);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    fireEvent.press(screen.getByTestId('shell-header-menu'));
    const anchor = hostStyles(screen).filter(style => style.position === 'absolute' && style.padding === 12 && style.flexDirection === 'row');
    expect(anchor).toHaveLength(1);
    expect(anchor[0]).toMatchObject({ top: 0, bottom: 0, insetInlineStart: 0 });
    expect(anchor[0]!.left).toBeUndefined();
  });

  it('a docked nav gives up the START padding and keeps the end one, in longhands', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" sidebar={{ items: NAV, surface: 'docked' }} />);
    const shell = resolvedStyle(screen.getByTestId('shell').props.style);
    expect(shell).toMatchObject({ paddingTop: 0, paddingBottom: 0, paddingInlineStart: 0, paddingInlineEnd: 12 });
    // No shorthand for a longhand to fight with on react-native-web.
    expect(shell.padding).toBeUndefined();
    expect(shell.paddingLeft).toBeUndefined();
  });

  it('the in-flow reveal rail and the aside are inset from their own edges', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" drawer="reveal" sidebar={{ items: NAV }} aside={<ReactNative.Text>Aside</ReactNative.Text>} />,
    );
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({ paddingInlineEnd: 12 });
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style).paddingRight).toBeUndefined();
    expect(hostStyles(screen).some(style => style.paddingInlineStart === 12 && style.paddingTop === 12 && style.flexShrink === 0)).toBe(true);
  });
});

describe('Sidebar', () => {
  it('docks its hairline on the END edge, facing the content', () => {
    const screen = renderIn(<Sidebar testID="sb" surface="docked" items={NAV} />);
    const panel = resolvedStyle(screen.getByTestId('sb').props.style);
    expect(panel.borderEndWidth).toBe(1);
    expect(panel.borderRightWidth).toBeUndefined();
    expect(panel.borderRightColor).toBeUndefined();
  });

  it.each([
    [false, -20, -1],
    [true, 20, 1],
  ])('rtl=%s: the collapse control slides in from the END and its glyph mirrors', (rtl, shift, glyph) => {
    setRtl(rtl);
    const screen = renderIn(<Sidebar testID="sb" items={NAV} />);
    const control = resolvedStyle(screen.getByTestId('sidebar-header-control').props.style);
    expect(control.insetInlineStart).toBe('100%');
    expect(control.left).toBeUndefined();
    expect(translateX(control)).toBe(shift);
    const icon = screen.getByTestId('sidebar-collapse').findAll(node => typeof node.type === 'string' && scaleX(resolvedStyle(node.props.style)) !== undefined);
    expect(icon.length).toBeGreaterThan(0);
    expect(scaleX(resolvedStyle(icon[0]!.props.style))).toBe(glyph);
  });
});

describe('app-shell accessories', () => {
  it('NotificationBell pins its count from the START edge', () => {
    setWidth(1440);
    const screen = renderIn(<NotificationBell testID="bell" unreadCount={3} />);
    const count = resolvedStyle(screen.getByTestId('bell-count').props.style);
    expect(count.insetInlineStart).toBe(18);
    expect(count.left).toBeUndefined();
  });

  it('ProOfferCard sits in the bottom-START corner with its close at the top END', () => {
    setWidth(390);
    const screen = renderIn(<ProOfferCard testID="offer" title="Pro" description="d" ctaLabel="Go" onDismiss={() => {}} />);
    const card = resolvedStyle(screen.getByTestId('offer').props.style);
    expect(card).toMatchObject({ insetInlineStart: 12, insetInlineEnd: 12, bottom: 12 });
    expect(card.left).toBeUndefined();
    expect(card.right).toBeUndefined();
    const dismiss = resolvedStyle(screen.getByTestId('offer-dismiss').props.style);
    expect(dismiss.insetInlineEnd).toBe(12);
    expect(dismiss.right).toBeUndefined();
  });
});

describe('BottomBar', () => {
  const Navigation = () => null;
  const Item = () => null;
  const Blur = () => null;

  it('spaces its action from the START side and lifts it to the END corner', () => {
    // Four destinations do not fit beside the action at 280, so it lifts.
    const items = ['home', 'search', 'saved', 'profile'].map(name => ({ name, label: name, icon: null }));
    const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={items} value="home" onValueChange={() => {}} action={<ReactNative.Text>Compose</ReactNative.Text>} testID="bar" />);
    const inline = resolvedStyle(view.getByTestId('bar-action').props.style);
    expect(inline.marginInlineStart).toBe(10);
    expect(inline.marginLeft).toBeUndefined();

    act(() => view.getByTestId('bar-row').props.onLayout({ nativeEvent: { layout: { width: 280, height: 58 } } }));
    const lifted = resolvedStyle(view.getByTestId('bar-action').props.style);
    expect(lifted).toMatchObject({ position: 'absolute', insetInlineEnd: 12 });
    expect(lifted.right).toBeUndefined();
  });
});

describe('react-native-web is handed the direction at every root', () => {
  // react-native-web resolves logical insets against a `dir` prop on an
  // ancestor View, NOT against `<html dir>` — with none it writes them as
  // left-to-right physical properties (measured: `insetInlineStart: 0` →
  // `left: 0px`). So on web each family root carries `dir="rtl"` when the
  // document is right-to-left, and nothing otherwise.
  async function rtlDocument() {
    platform.OS = 'web';
    await act(async () => {
      document.documentElement.setAttribute('dir', 'rtl');
      await Promise.resolve();
    });
  }

  it('web + <html dir="rtl">: shell, sidebar, rail, bottom bar and offer card roots carry dir', async () => {
    await rtlDocument();
    setWidth(1440);
    const shell = renderIn(<AppShell testID="shell" scroll="container" sidebar={{ items: NAV }} />);
    expect(shell.getByTestId('shell').props.dir).toBe('rtl');
    const sidebar = renderIn(<Sidebar testID="sb" items={NAV} />);
    expect(sidebar.getByTestId('sb').props.dir).toBe('rtl');
    const rail = renderIn(<Sidebar testID="rail" variant="rail" items={NAV} />);
    expect(rail.getByTestId('rail').props.dir).toBe('rtl');
    const bar = render(<BottomBarBase Navigation={() => null} Item={() => null} Blur={() => null} items={[{ name: 'home', label: 'Home', icon: null }]} value="home" onValueChange={() => {}} testID="bar" />);
    expect(bar.getByTestId('bar').props.dir).toBe('rtl');
    const offer = renderIn(<ProOfferCard testID="offer" title="Pro" description="d" ctaLabel="Go" onDismiss={() => {}} />);
    expect(offer.getByTestId('offer').props.dir).toBe('rtl');
  });

  it('native, or a left-to-right document: no dir prop at all', () => {
    setRtl(true);
    const native = renderIn(<Sidebar testID="sb" items={NAV} />);
    expect(native.getByTestId('sb').props.dir).toBeUndefined();
    native.unmount();
    setRtl(false);
    platform.OS = 'web';
    const web = renderIn(<Sidebar testID="sb" items={NAV} />);
    expect(web.getByTestId('sb').props.dir).toBeUndefined();
  });
});
