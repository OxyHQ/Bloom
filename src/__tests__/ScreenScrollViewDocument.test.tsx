/** @jest-environment jsdom */
// `ScreenScrollView` inside a web `Screen documentScroll`: no second scroll
// container, the window drives the screen, a ref written for native restores
// the window, and `onEndReached` pages from an end marker observed against the
// viewport. Outside document mode nothing changes.
import React, { type ComponentRef, createRef, useEffect, useRef } from 'react';
import { Platform, View, type ScrollView } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, ScreenScrollView, useScreen } from '../screen';
import type { ScreenContextValue } from '../screen/context';
import { ScrollRestorationProvider, useScrollRestoration } from '../scroll/index.web';
import type { ScreenFocusEffect, ScrollRouterAdapter } from '../scroll/types';
import { resolvedStyle } from './support/rendered-style';

function wrap(children: React.ReactNode) {
  return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>;
}

// Every host node is a real element, so the end marker can be observed.
const domNodes = { createNodeMock: () => document.createElement('div') };

type Instance = ReturnType<ReturnType<typeof render>['getByTestId']>;
/** The host node that lays a child out — the content container. */
function hostParent(node: Instance): Instance {
  let parent = node.parent!;
  while (typeof parent.type !== 'string') parent = parent.parent!;
  return parent;
}

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}
function scroll(y: number) {
  act(() => {
    setScrollY(y);
    window.dispatchEvent(new Event('scroll'));
  });
}

class ObserverStub {
  static instances: ObserverStub[] = [];
  readonly targets: Element[] = [];
  disconnected = false;
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    ObserverStub.instances.push(this);
  }
  observe(target: Element) {
    this.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
  /** What a real observer delivers: the target's state, on observe and on every crossing. */
  report(isIntersecting: boolean) {
    act(() =>
      this.callback(
        [{ isIntersecting, target: this.targets[0] } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ),
    );
  }
}
function liveObserver() {
  const live = ObserverStub.instances.filter((observer) => !observer.disconnected);
  expect(live).toHaveLength(1);
  return live[0]!;
}

const originalOS = Platform.OS;
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;
});
afterAll(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});
beforeEach(() => {
  ObserverStub.instances = [];
  setScrollY(0);
  window.scrollTo = jest.fn((options?: ScrollToOptions | number, y?: number) => {
    setScrollY(typeof options === 'number' ? (y ?? 0) : (options?.top ?? 0));
  }) as typeof window.scrollTo;
});

it('renders content in document flow and lets the window drive the screen', () => {
  let state!: ScreenContextValue;
  function Probe() {
    state = useScreen();
    return null;
  }
  const tree = render(
    wrap(
      <Screen documentScroll header={<View />} headerHeight={64}>
        <Probe />
        <ScreenScrollView
          testID="page"
          style={{ backgroundColor: 'red' }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          <View testID="row" />
        </ScreenScrollView>
      </Screen>,
    ),
    domNodes,
  );
  expect(
    tree.UNSAFE_root.findAll((node) => String(node.type) === 'Animated.ScrollView'),
  ).toHaveLength(0);
  expect(resolvedStyle(tree.getByTestId('page').props.style)).toMatchObject({
    flexGrow: 1,
    backgroundColor: 'red',
  });
  // Screen already reserved the header; the content keeps exactly its own padding.
  const content = hostParent(tree.getByTestId('row'));
  expect(resolvedStyle(content.props.style)).toEqual({ padding: 16, gap: 12 });
  expect(state.activeScrollerId.value).not.toBeNull();
  scroll(240);
  expect(state.scrollY.value).toBe(240);
  expect(state.collapseTarget.value).toBe(1);
});

it('keeps a real scroll view outside document mode', () => {
  const tree = render(
    wrap(
      <Screen>
        <ScreenScrollView testID="contained" />
      </Screen>,
    ),
  );
  expect(tree.getByTestId('contained').type).toBe('Animated.ScrollView');
});

it('answers the scroll ref with the window', () => {
  const ref = createRef<ComponentRef<typeof ScrollView>>();
  render(
    wrap(
      <Screen documentScroll>
        <ScreenScrollView ref={ref} />
      </Screen>,
    ),
    domNodes,
  );
  ref.current!.scrollTo({ y: 300, animated: false });
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'auto' });
  ref.current!.scrollTo(120);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 120, behavior: 'smooth' });
  expect(ref.current!.getScrollableNode()).toBe(
    document.scrollingElement ?? document.documentElement,
  );
});

it('restores the window through the same ref-based binding a native page uses', () => {
  const frames: FrameRequestCallback[] = [];
  window.requestAnimationFrame = (callback) => frames.push(callback);
  window.cancelAnimationFrame = () => undefined;
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 5000,
  });
  const adapter: ScrollRouterAdapter = {
    useScreenContentId: () => 'notes',
    useScreenFocusEffect: (effect: ScreenFocusEffect) => useEffect(effect, [effect]),
  };
  const pending: boolean[] = [];
  function Page() {
    const ref = useRef<ComponentRef<typeof ScrollView>>(null);
    const restoration = useScrollRestoration(ref);
    pending.push(restoration.restorePending);
    return (
      <Screen documentScroll>
        <ScreenScrollView ref={ref} restoration={restoration} testID="page" />
      </Screen>
    );
  }
  const ui = (shown: boolean) =>
    wrap(
      <ScrollRestorationProvider adapter={adapter}>
        {shown ? <Page /> : null}
      </ScrollRestorationProvider>,
    );
  const tree = render(ui(true), domNodes);
  // Saves arrive as WINDOW scroll events — the document element never gets one.
  scroll(900);
  tree.rerender(ui(false));
  setScrollY(0);
  tree.rerender(ui(true));
  expect(pending[pending.length - 1]).toBe(true);
  expect(resolvedStyle(tree.getByTestId('page').props.style).opacity).toBe(0);
  act(() => frames.splice(0).forEach((frame) => frame(0)));
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 900);
  expect(window.scrollY).toBe(900);
  expect(pending[pending.length - 1]).toBe(false);
});

describe('onEndReached in document flow', () => {
  function page(onEndReached?: () => void, threshold?: number) {
    return wrap(
      <Screen documentScroll>
        <ScreenScrollView
          contentContainerClassName="gap-4 p-4"
          onEndReached={onEndReached}
          onEndReachedThreshold={threshold}
        >
          <View testID="row" />
        </ScreenScrollView>
      </Screen>,
    );
  }

  it('observes an out-of-flow end marker, threshold viewports early', () => {
    const tree = render(page(jest.fn(), 0.5), domNodes);
    const observer = liveObserver();
    expect(observer.options.rootMargin).toBe('0px 0px 50% 0px');
    const marker = tree.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && node.props['aria-hidden'] === true,
    );
    expect(marker).toHaveLength(1);
    expect(resolvedStyle(marker[0]!.props.style)).toMatchObject({
      position: 'absolute',
      bottom: 0,
    });
    // Inside the content container, so it marks the end of its padding box.
    expect(hostParent(marker[0]!)).toBe(hostParent(tree.getByTestId('row')));
  });

  it('defaults to two viewports, as FlatList', () => {
    render(page(jest.fn()), domNodes);
    expect(liveObserver().options.rootMargin).toBe('0px 0px 200% 0px');
  });

  it('fires once per approach and re-arms on leaving or on new content', () => {
    const onEndReached = jest.fn();
    const tree = render(page(onEndReached), domNodes);
    liveObserver().report(true);
    liveObserver().report(true);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    liveObserver().report(false);
    liveObserver().report(true);
    expect(onEndReached).toHaveBeenCalledTimes(2);
    // A page arrived and the end is still in range: the content changed length,
    // so the fresh observation asks again.
    fireEvent(hostParent(tree.getByTestId('row')), 'layout', {
      nativeEvent: { layout: { width: 400, height: 1200 } },
    });
    liveObserver().report(true);
    expect(onEndReached).toHaveBeenCalledTimes(3);
  });

  it('reports to the latest handler without re-observing', () => {
    const first = jest.fn();
    const second = jest.fn();
    const tree = render(page(first), domNodes);
    const observer = liveObserver();
    tree.rerender(page(second));
    expect(liveObserver()).toBe(observer);
    observer.report(true);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('observes nothing without a handler', () => {
    const tree = render(page(), domNodes);
    expect(ObserverStub.instances).toHaveLength(0);
    expect(
      tree.UNSAFE_root.findAll(
        (node) => typeof node.type === 'string' && node.props['aria-hidden'] === true,
      ),
    ).toHaveLength(0);
  });
});
