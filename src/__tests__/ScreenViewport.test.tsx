/** @jest-environment jsdom */
import type React from 'react';
import { useEffect, useRef } from 'react';
import { AppState, Platform, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, ScreenScrollView, useScreenViewport, useScreenVisible } from '../screen';
import { BloomProvider } from '../provider';
import { TabPagesHost } from '../tab-pager/expo-router/TabPagesHost';
import { PageHeader } from '../page-header';
import { useScreen } from '../screen/context';
import { AppShellRegionContext, type AppShellRegionValue } from '../layout/app-shell-region';
import { useSharedValue } from 'react-native-reanimated';
import { usePanelScrollContainer } from '../app-shell/context';
import { ScreenHostContext } from '../screen/context';
import { resolvedStyle } from './support/rendered-style';
import { ScreenScope } from '../layout/screen-scope';
const originalOS = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' }));
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }));
const region: AppShellRegionValue = {
  flow: 'bounded',
  framed: true,
  gutter: 8,
  viewportInset: { top: 8, bottom: 8 },
  bottomReserve: 0,
  underBottomBar: false,
  revealed: false,
  maskColor: '#fff',
};
function wrap(children: React.ReactNode, flow: AppShellRegionValue['flow'] = 'bounded') {
  return (
    <BloomThemeProvider fonts={false}>
      <AppShellRegionContext.Provider value={{ ...region, flow }}>
        {children}
      </AppShellRegionContext.Provider>
    </BloomThemeProvider>
  );
}
it('declares local chrome once, and overlay headers reserve no content inset', () => {
  let owner: ReturnType<typeof useScreenViewport>;
  function Probe() {
    owner = useScreenViewport();
    return null;
  }
  const ui = (overlay: boolean) =>
    wrap(
      <Screen
        scroll="auto"
        testID="screen"
        headerPlacement={overlay ? 'overlay' : 'inset'}
        header={<View />}
        bottomBar={<View />}
      >
        <Probe />
      </Screen>,
    );
  const tree = render(ui(false));
  fireEvent(tree.getByTestId('screen-header'), 'layout', {
    nativeEvent: { layout: { height: 72 } },
  });
  fireEvent(tree.getByTestId('screen-bottom'), 'layout', {
    nativeEvent: { layout: { height: 80 } },
  });
  expect(owner!.kind).toBe('element');
  expect(resolvedStyle(tree.getByTestId('screen-scroll-content').props.style)).toMatchObject({
    paddingTop: 72,
    paddingBottom: 96,
  });
  tree.rerender(ui(true));
  expect(resolvedStyle(tree.getByTestId('screen-scroll-content').props.style)).toMatchObject({
    paddingTop: 0,
    paddingBottom: 96,
  });
});
it('lets a content-sized surface retain intrinsic height without replacing its scroll owner', () => {
  const mounts = jest.fn();
  let owner: ReturnType<typeof useScreenViewport>;
  function Body() {
    useEffect(mounts, []);
    owner = useScreenViewport();
    return <View testID="body" />;
  }
  const draw = (sizing: 'content' | 'fill') =>
    wrap(
      <ScreenScope sizing={sizing}>
        <Screen
          testID="intrinsic"
          scroll="auto"
          header={<View />}
          bottomBar={<View />}
          contentClearance={0}
        >
          <ScreenScrollView testID="body-flow" style={{ flex: 1 }}>
            <Body />
          </ScreenScrollView>
        </Screen>
      </ScreenScope>,
    );
  const tree = render(draw('content'));
  fireEvent(tree.getByTestId('intrinsic-header'), 'layout', {
    nativeEvent: { layout: { height: 48 } },
  });
  fireEvent(tree.getByTestId('intrinsic-bottom'), 'layout', {
    nativeEvent: { layout: { height: 96 } },
  });
  expect(owner!.kind).toBe('element');
  const initialOwner = owner!.scrollRef;
  expect(resolvedStyle(tree.getByTestId('intrinsic').props.style).flexBasis).toBe('auto');
  expect(resolvedStyle(tree.getByTestId('intrinsic-viewport').props.style)).toMatchObject({
    containerType: 'inline-size',
    overflowY: 'auto',
    flexBasis: 'auto',
  });
  expect(resolvedStyle(tree.getByTestId('body-flow').props.style).flexBasis).toBe('auto');
  expect(resolvedStyle(tree.getByTestId('intrinsic-scroll-content').props.style)).toMatchObject({
    paddingTop: 48,
    paddingBottom: 96,
  });
  tree.rerender(draw('fill'));
  expect(resolvedStyle(tree.getByTestId('intrinsic-viewport').props.style)).toMatchObject({
    containerType: 'size',
    flexBasis: 0,
  });
  expect(owner!.scrollRef).toBe(initialOwner);
  expect(mounts).toHaveBeenCalledTimes(1);
});
it('retains declared content and scroll wrapper when its host changes document/column ownership', () => {
  const mounts = jest.fn();
  let owner: ReturnType<typeof useScreenViewport>;
  function Probe() {
    useEffect(mounts, []);
    owner = useScreenViewport();
    return <View testID="content" />;
  }
  const ui = (flow: AppShellRegionValue['flow']) =>
    wrap(
      <Screen scroll="auto">
        <ScreenScrollView>
          <Probe />
        </ScreenScrollView>
      </Screen>,
      flow,
    );
  const tree = render(ui('document'));
  expect(owner!.kind).toBe('document');
  tree.rerender(ui('bounded'));
  expect(owner!.kind).toBe('element');
  tree.rerender(ui('document'));
  expect(mounts).toHaveBeenCalledTimes(1);
});
it('uses the same metrics for document chrome and stops inactive screen writers', () => {
  let owner: ReturnType<typeof useScreenViewport>;
  let screen: ReturnType<typeof useScreen>;
  function Probe() {
    owner = useScreenViewport();
    screen = useScreen();
    return null;
  }
  const ui = (active: boolean) =>
    wrap(
      <Screen scroll="auto" active={active}>
        <Probe />
      </Screen>,
      'document',
    );
  const tree = render(ui(true));
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
    window.dispatchEvent(new Event('scroll'));
  });
  expect(owner!.metrics.scrollY).toBe(screen!.scrollY);
  expect(screen!.scrollY.value).toBe(120);
  tree.rerender(ui(false));
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    window.dispatchEvent(new Event('scroll'));
  });
  expect(screen!.scrollY.value).toBe(120);
});

it('shares the host owner with route hooks above Screen without adding a scroller', () => {
  let before: ReturnType<typeof usePanelScrollContainer>;
  let inside: ReturnType<typeof useScreenViewport>;
  function Probe() {
    inside = useScreenViewport();
    return null;
  }
  function Route() {
    before = usePanelScrollContainer();
    return (
      <Screen scroll="auto">
        <Probe />
      </Screen>
    );
  }
  function Host() {
    const scrollRef = useRef<unknown>(null);
    const scrollY = useSharedValue(0);
    const contentHeight = useSharedValue(0);
    const viewportHeight = useSharedValue(0);
    return (
      <ScreenHostContext.Provider
        value={{
          active: true,
          kind: 'element',
          scrollRef,
          metrics: { scrollY, contentHeight, viewportHeight },
        }}
      >
        <Route />
      </ScreenHostContext.Provider>
    );
  }
  render(wrap(<Host />));
  expect(before!).not.toBeNull();
  expect(inside!.scrollRef).toBe(before!);
});

it('composes host history and actions into the screen header without duplicate back controls', () => {
  // `docs/page-header.mdx`: an explicit `onBack` takes priority over the panel
  // navigation adapter and stays enabled at the history root; without one the
  // header uses panel Back only when that history can go back.
  const back = jest.fn();
  const forward = jest.fn();
  const routeBack = jest.fn();
  const ui = (canGoBack: boolean, canGoForward: boolean, onBack?: () => void) =>
    wrap(
      <ScreenHostContext.Provider
        value={{
          active: true,
          kind: 'element',
          headerActions: <View testID="source-action" />,
          navigation: { canGoBack, canGoForward, back, forward },
        }}
      >
        <Screen
          scroll="auto"
          header={
            <PageHeader
              testID="route-header"
              title="Profile"
              onBack={onBack}
              actions={<View testID="route-action" />}
            />
          }
        >
          <View />
        </Screen>
      </ScreenHostContext.Provider>,
    );
  const tree = render(ui(true, true));
  expect(tree.getAllByTestId('route-header-back')).toHaveLength(1);
  expect(tree.getByTestId('source-action')).toBeTruthy();
  expect(tree.getByTestId('route-action')).toBeTruthy();
  fireEvent.press(tree.getByTestId('route-header-back'));
  expect(back).toHaveBeenCalledTimes(1);
  expect(tree.queryByTestId('route-header-forward')).toBeNull();
  tree.rerender(ui(false, false));
  expect(tree.queryByTestId('route-header-back')).toBeNull();

  // The route's own back wins, once, and still shows at the history root.
  tree.rerender(ui(true, false, routeBack));
  expect(tree.getAllByTestId('route-header-back')).toHaveLength(1);
  fireEvent.press(tree.getByTestId('route-header-back'));
  expect(routeBack).toHaveBeenCalledTimes(1);
  expect(back).toHaveBeenCalledTimes(1);
  tree.rerender(ui(false, false, routeBack));
  expect(tree.getAllByTestId('route-header-back')).toHaveLength(1);
});

it("offers the app's route Back on route screens, not on root pages, overlays or a declined header", () => {
  const back = jest.fn();
  const screen = (testID: string, onBack?: null) => (
    <Screen scroll="auto" header={<PageHeader testID={testID} title="Post" onBack={onBack} />}>
      <View />
    </Screen>
  );
  const tree = render(
    <BloomProvider fonts={false} back={back}>
      {screen('route')}
      <TabPagesHost>{screen('tab')}</TabPagesHost>
      <ScreenScope>{screen('sheet')}</ScreenScope>
      {screen('declined', null)}
    </BloomProvider>,
  );
  fireEvent.press(tree.getByTestId('route-back'));
  expect(back).toHaveBeenCalledTimes(1);
  expect(tree.queryByTestId('tab-back')).toBeNull();
  expect(tree.queryByTestId('sheet-back')).toBeNull();
  expect(tree.queryByTestId('declined-back')).toBeNull();
});

it('is visible to the reader only while its Screen is active and the app is in the foreground', () => {
  const listeners: Array<() => void> = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    listeners.push(listener as () => void);
    return { remove: jest.fn() };
  });
  let visible: boolean | undefined;
  function Probe() {
    visible = useScreenVisible();
    return null;
  }
  const ui = (active: boolean) =>
    wrap(
      <Screen scroll="auto" active={active}>
        <Probe />
      </Screen>,
    );
  const tree = render(ui(false));
  expect(visible).toBe(false);
  tree.rerender(ui(true));
  expect(visible).toBe(true);
  act(() => {
    AppState.currentState = 'background';
    for (const listener of listeners) listener();
  });
  expect(visible).toBe(false);
  AppState.currentState = 'active';
  jest.restoreAllMocks();
});

it('declares and releases its color recipe on its own host without replacing content', () => {
  const release = jest.fn();
  const claimColorPreset = jest.fn(() => release);
  let mounts = 0;
  function Body() {
    useEffect(() => {
      mounts += 1;
    }, []);
    return <View testID="color-body" />;
  }
  const ui = (preset: 'teal' | undefined) =>
    wrap(
      <ScreenHostContext.Provider value={{ active: true, claimColorPreset }}>
        <Screen colorPreset={preset}>
          <Body />
        </Screen>
      </ScreenHostContext.Provider>,
    );
  const tree = render(ui('teal'));
  expect(claimColorPreset).toHaveBeenCalledWith('teal');
  expect(mounts).toBe(1);
  tree.rerender(ui(undefined));
  expect(release).toHaveBeenCalledTimes(1);
  expect(mounts).toBe(1);
  tree.rerender(ui('teal'));
  tree.unmount();
  expect(release).toHaveBeenCalledTimes(2);
});

it('pins document footer chrome above the framed panel bottom inset', () => {
  const tree = render(
    wrap(<Screen scroll="auto" testID="framed-footer" bottomBar={<View />} />, 'document'),
  );
  expect(resolvedStyle(tree.getByTestId('framed-footer-bottom').props.style)).toMatchObject({
    position: 'sticky',
    bottom: 8,
  });
});

it('stacks host and route footers once and clears their combined measured height', () => {
  const tree = render(
    wrap(
      <ScreenHostContext.Provider
        value={{ active: true, kind: 'element', bottomBar: <View testID="host-footer" /> }}
      >
        <Screen scroll="auto" testID="footer-route" bottomBar={<View testID="route-footer" />}>
          <Screen scroll="auto" testID="nested-route">
            <View />
          </Screen>
        </Screen>
      </ScreenHostContext.Provider>,
    ),
  );
  expect(tree.getAllByTestId('host-footer')).toHaveLength(1);
  expect(tree.getByTestId('route-footer')).toBeTruthy();
  expect(tree.queryByTestId('nested-route-bottom')).toBeNull();
  fireEvent(tree.getByTestId('footer-route-bottom'), 'layout', {
    nativeEvent: { layout: { height: 140 } },
  });
  expect(resolvedStyle(tree.getByTestId('footer-route-scroll-content').props.style)).toMatchObject({
    paddingBottom: 156,
  });
});

it('does not grow primary action height when the host footer is measured', () => {
  const tree = render(
    wrap(
      <ScreenHostContext.Provider value={{ active: true, kind: 'element', bottomBar: <View /> }}>
        <Screen
          scroll="auto"
          testID="action-route"
          primaryAction={<View testID="local-action" />}
        />
      </ScreenHostContext.Provider>,
    ),
  );
  const actionParent = () => tree.getByTestId('local-action').parent!;
  const initialHeight = resolvedStyle(actionParent().props.style).minHeight;
  fireEvent(tree.getByTestId('action-route-bottom'), 'layout', {
    nativeEvent: { layout: { height: 140 } },
  });
  expect(resolvedStyle(actionParent().props.style).minHeight).toBe(initialHeight);
});

it('contains only its vertical scroll edge so horizontal workspace gestures can chain', () => {
  const tree = render(
    wrap(
      <Screen scroll="auto" testID="axis-owner">
        <View />
      </Screen>,
    ),
  );
  const style = resolvedStyle(tree.getByTestId('axis-owner-viewport').props.style);
  expect(style.overscrollBehaviorY).toBe('contain');
  expect(style.overscrollBehavior).toBeUndefined();
  expect(style.overscrollBehaviorX).toBeUndefined();
});
