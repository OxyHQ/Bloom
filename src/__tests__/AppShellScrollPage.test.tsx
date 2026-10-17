// `scroll="page"`: the mode for apps whose routes are Screen pages. The web
// scrolls the document (routes stay in document flow); native is one screen and
// each route's ScreenScrollView is the scroller, never nested in a shell
// ScrollView — with the bottom bar's clearance handed to it.
import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { AppShell } from '../app-shell';
import { resolveScrollMode } from '../app-shell/layout';
import { RiHomeLine } from '../icons/remix';
import { PortalOutlet, PortalProvider } from '../portal';
import { Screen, ScreenScrollView, useScreen } from '../screen';
import type { ScreenContextValue } from '../screen/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];

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
function setWidth(width: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}
const scrollViews = (screen: ReturnType<typeof renderIn>) =>
  screen.UNSAFE_root.findAll(
    (node) =>
      typeof node.type === 'string' &&
      /ScrollView$/.test(node.type) &&
      // The sidebar's own list scrolls; the question is who scrolls the PAGE.
      !String(node.props.testID ?? '').startsWith('sidebar'),
  );

afterEach(() => jest.restoreAllMocks());

/** The canonical route: one implementation for both platforms. */
function Route({ probe }: { probe?: (screen: ScreenContextValue) => void }) {
  function Probe() {
    probe?.(useScreen());
    return null;
  }
  return (
    <Screen documentScroll>
      <Probe />
      <ScreenScrollView testID="route-scroll" contentContainerStyle={{ padding: 16 }}>
        <ReactNative.Text>Row</ReactNative.Text>
      </ScreenScrollView>
    </Screen>
  );
}

it('resolves to document on web and fixed on native, like split/canvas otherwise', () => {
  jest.replaceProperty(ReactNative.Platform, 'OS', 'ios');
  expect(resolveScrollMode('feed', 'page')).toBe('fixed');
  expect(resolveScrollMode('dashboard', 'page')).toBe('fixed');
  jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
  expect(resolveScrollMode('feed', 'page')).toBe('document');
  expect(resolveScrollMode('split', 'page')).toBe('fixed');
  expect(resolveScrollMode('canvas', 'page')).toBe('fixed');
});

describe('native', () => {
  beforeEach(() => jest.replaceProperty(ReactNative.Platform, 'OS', 'ios'));

  it.each(['feed', 'dashboard'] as const)(
    "the route's ScreenScrollView is the only scroller and clears the bottom bar (%s)",
    (variant) => {
      setWidth(400);
      const screen = renderIn(
        <AppShell
          testID="shell"
          variant={variant}
          scroll="page"
          panel={variant === 'feed'}
          bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>}
        >
          <Route />
        </AppShell>,
      );
      // One scroller: the route's own, not nested in a shell ScrollView.
      expect(scrollViews(screen)).toHaveLength(1);
      expect(scrollViews(screen)[0]!.props.testID).toBe('route-scroll');
      fireEvent(screen.getByTestId('shell-bottom-bar'), 'layout', {
        nativeEvent: { layout: { height: 80 } },
      });
      // The occupied edge plus Screen's own 16 of clearance, on top of the
      // route's own padding — and the shell pads nothing itself.
      expect(
        resolvedStyle(screen.getByTestId('route-scroll').props.contentContainerStyle),
      ).toMatchObject({ paddingBottom: 80 + 16 + 16 });
      expect(resolvedStyle(screen.getByTestId('shell-page').props.style).paddingBottom ?? 0).toBe(
        0,
      );
    },
  );

  it('a panel fills the screen and its routes own the scrolling', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" scroll="page" panel sidebar={{ items: NAV }}>
        <Route />
      </AppShell>,
    );
    expect(resolvedStyle(screen.getByTestId('shell-page').props.style)).toMatchObject({
      flex: 1,
      minHeight: 0,
    });
    expect(scrollViews(screen)).toHaveLength(1);
  });

  it('shares the shell navigation scope with the route when the shell owns navigation', () => {
    setWidth(400);
    const states: ScreenContextValue[] = [];
    renderIn(
      <AppShell
        testID="shell"
        scroll="page"
        navigation={[{ value: 'home', label: 'Home', icon: <RiHomeLine /> }]}
        value="home"
      >
        <Route probe={(state) => states.push(state)} />
      </AppShell>,
    );
    const route = states[states.length - 1]!;
    expect(route.contentInsetsHandled).toBe(false);
    expect(route.bottomInset).toBeGreaterThanOrEqual(16);
  });
});

describe('web', () => {
  beforeEach(() => jest.replaceProperty(ReactNative.Platform, 'OS', 'web'));

  it('scrolls the document: no shell or route scroller, the route in document flow', () => {
    setWidth(1440);
    const states: ScreenContextValue[] = [];
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" scroll="page" panel sidebar={{ items: NAV }}>
        <Route probe={(state) => states.push(state)} />
      </AppShell>,
    );
    expect(scrollViews(screen)).toHaveLength(0);
    expect(states[states.length - 1]!.documentScroll).toBe(true);
    expect(resolvedStyle(screen.getByTestId('shell').props.style).overflow).toBeUndefined();
  });

  it('matches scroll="document" exactly', () => {
    setWidth(1440);
    const ui = (scroll: 'page' | 'document') =>
      renderIn(
        <AppShell testID="shell" variant="feed" scroll={scroll} panel sidebar={{ items: NAV }}>
          <Route />
        </AppShell>,
      ).toJSON();
    expect(JSON.stringify(ui('page'))).toBe(JSON.stringify(ui('document')));
  });
});
