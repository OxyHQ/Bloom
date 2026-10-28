/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByText, queryByText } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { Platform } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import { ScrollRestorationProvider } from '../scroll/context';
import { ScrollOffsetStore } from '../scroll/store';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, useScreen, useScreenViewport } from '../screen';
import {
  ScreenHostContext,
  ScreenViewportContext,
  type ScreenContextValue,
} from '../screen/context';
import { VirtualList, type VirtualListHandle } from '../list/index.web';

// `@tanstack/react-virtual` measures rows via ResizeObserver + getBoundingClientRect,
// neither of which jsdom implements with a real layout engine. Stub both so the
// window virtualizer computes a deterministic, non-empty range against jsdom's
// default 768px-tall window — exactly the path that regressed in production
// (rows present, wrapper sized, but `getVirtualItems()` came back empty).
class ResizeObserverStub {
  static instances = new Set<ResizeObserverStub>();
  readonly targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    ResizeObserverStub.instances.add(this);
  }
  observe(target: Element): void {
    this.targets.add(target);
  }
  unobserve(target: Element): void {
    this.targets.delete(target);
  }
  disconnect(): void {
    this.targets.clear();
  }
  static deliverRows(): void {
    for (const observer of ResizeObserverStub.instances) {
      const entries = [...observer.targets]
        .filter((target) => target.hasAttribute('data-index'))
        .map((target) => ({
          target,
          contentRect: target.getBoundingClientRect(),
          borderBoxSize: [
            {
              inlineSize: 600,
              blockSize: Number(
                target.firstElementChild?.getAttribute('data-height') ??
                  (target as HTMLElement).offsetHeight,
              ),
            },
          ],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        }));
      if (entries.length) observer.callback(entries, observer);
    }
  }
}
globalThis.ResizeObserver = ResizeObserverStub;

const ROW_HEIGHT = 64;

beforeAll(() => {
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    (): DOMRect => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: ROW_HEIGHT,
      width: 0,
      height: ROW_HEIGHT,
      toJSON: () => ({}),
    }),
  );
});

afterAll(() => {
  jest.restoreAllMocks();
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(ui);
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

interface Row {
  id: string;
  label: string;
}

describe('VirtualList (web)', () => {
  it('mounts EVERY row of a short list in the first viewport (the empty-rows regression)', () => {
    const data: Row[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      label: `Row ${i}`,
    }));

    const c = mount(
      <VirtualList<Row>
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
        ListHeaderComponent={<div>List header</div>}
      />,
    );

    expect(getByText(c, 'List header')).toBeTruthy();
    for (const row of data) {
      expect(getByText(c, row.label)).toBeTruthy();
    }
  });

  it('renders the header + empty slot (and no rows) when data is empty', () => {
    const c = mount(
      <VirtualList<Row>
        data={[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
        ListHeaderComponent={<div>List header</div>}
        ListEmptyComponent={<div>Nothing here</div>}
      />,
    );

    expect(getByText(c, 'List header')).toBeTruthy();
    expect(getByText(c, 'Nothing here')).toBeTruthy();
    expect(queryByText(c, 'Row 0')).toBeNull();
  });

  it.each([[[{ id: 'a', label: 'Row a' }]], [[]]])(
    'pads the header, the rows and the empty slot with its content container',
    (data) => {
      const c = mount(
        <VirtualList<Row>
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <span>{item.label}</span>}
          ListHeaderComponent={<div>List header</div>}
          ListEmptyComponent={<div>Nothing here</div>}
          contentContainerStyle={{ paddingTop: 70 }}
        />,
      );
      const header = getByText(c, 'List header');
      const container = header.parentElement as HTMLElement;
      expect(container.style.paddingTop).toBe('70px');
      expect(
        container.contains(data.length > 0 ? getByText(c, 'Row a') : getByText(c, 'Nothing here')),
      ).toBe(true);
    },
  );

  it('supports a thunk slot for the header', () => {
    const c = mount(
      <VirtualList<Row>
        data={[{ id: 'a', label: 'Only row' }]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
        ListHeaderComponent={() => <div>Thunk header</div>}
      />,
    );

    expect(getByText(c, 'Thunk header')).toBeTruthy();
    expect(getByText(c, 'Only row')).toBeTruthy();
  });

  it('packs a grid into rows of numColumns, honouring each item span', () => {
    const data: Row[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      label: `Cell ${i}`,
    }));
    const c = mount(
      <VirtualList<Row>
        data={data}
        numColumns={3}
        overrideItemLayout={(layout, _item, index) => {
          if (index === 0) layout.span = 3;
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
      />,
    );
    const rowOf = (label: string) => getByText(c, label).parentElement?.parentElement;
    expect(getByText(c, 'Cell 0').parentElement?.style.width).toBe('100%');
    expect(rowOf('Cell 1')).toBe(rowOf('Cell 3'));
    expect(rowOf('Cell 1')).not.toBe(rowOf('Cell 0'));
    expect(rowOf('Cell 4')).not.toBe(rowOf('Cell 3'));
  });

  it('keeps the last sticky row scrolled past mounted and pinned', () => {
    // TanStack measures a mounted row's `offsetHeight`, which jsdom leaves at 0.
    const offsetHeight = jest
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(ROW_HEIGHT);
    const data: Row[] = Array.from({ length: 40 }, (_, i) => ({
      id: String(i),
      label: `Row ${i}`,
    }));
    const c = mount(
      <VirtualList<Row>
        data={data}
        overscan={0}
        stickyHeaderIndices={[2]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
      />,
    );
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 1600 });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(queryByText(c, 'Row 3')).toBeNull();
    const sticky = getByText(c, 'Row 2').parentElement as HTMLElement;
    expect(sticky.style.position).toBe('sticky');
    expect(sticky.style.marginTop).toBe(`${2 * ROW_HEIGHT}px`);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    offsetHeight.mockRestore();
  });
});

it('binds the document to the focused Screen without a nested scroll element', () => {
  let state: ScreenContextValue | undefined;
  function Probe() {
    state = useScreen();
    return null;
  }
  const renderList = (active: boolean) => (
    <BloomThemeProvider fonts={false}>
      <Screen documentScroll>
        <Probe />
        <VirtualList screen={{ active }} data={[]} />
      </Screen>
    </BloomThemeProvider>
  );
  mount(renderList(true));
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
    window.dispatchEvent(new Event('scroll'));
  });
  expect(state?.scrollY.value).toBe(120);
  mount(renderList(false));
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    window.dispatchEvent(new Event('scroll'));
  });
  expect(state?.scrollY.value).toBe(120);
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
});

it('drives persistent shell navigation from the focused route Screen only', () => {
  const states: Record<string, ScreenContextValue> = {};
  function Probe({ name }: { name: string }) {
    states[name] = useScreen();
    return null;
  }
  const ui = (focused: boolean) => (
    <BloomThemeProvider fonts={false}>
      <Screen navigationScope="shared">
        <Probe name="shell" />
        <Screen active={focused}>
          <Probe name="route" />
          <VirtualList screen={{}} data={[]} />
        </Screen>
      </Screen>
    </BloomThemeProvider>
  );
  mount(ui(true));
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
    window.dispatchEvent(new Event('scroll'));
  });
  expect(states.route!.scrollY.value).toBe(120);
  expect(states.shell!.scrollY.value).toBe(0);
  expect(states.shell!.collapseProgress.value).toBe(1);
  mount(ui(false));
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
  });
  expect(states.shell!.collapseProgress.value).toBe(1);
  expect(states.route!.scrollY.value).toBe(120);
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
});

describe('VirtualList (web) onEndReached', () => {
  // jsdom has no IntersectionObserver. The stub records what the list observes
  // and lets each test deliver what a browser would: the end marker's state on
  // observe, and on every crossing of the extended viewport.
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
    report(isIntersecting: boolean) {
      act(() =>
        this.callback(
          [{ isIntersecting, target: this.targets[0] } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        ),
      );
    }
  }
  const live = () => ObserverStub.instances.filter((observer) => !observer.disconnected);
  const original = globalThis.IntersectionObserver;
  beforeAll(() => {
    globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;
  });
  afterAll(() => {
    globalThis.IntersectionObserver = original;
  });
  beforeEach(() => {
    ObserverStub.instances = [];
  });

  const rows = (n: number): Row[] =>
    Array.from({ length: n }, (_, i) => ({ id: String(i), label: `Row ${i}` }));
  const list = (data: Row[], onEndReached?: () => void, threshold?: number) => (
    <VirtualList<Row>
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <span>{item.label}</span>}
      ListFooterComponent={<div>Footer</div>}
      onEndReached={onEndReached}
      onEndReachedThreshold={threshold}
    />
  );

  it('observes an end marker after the footer, threshold viewports early', () => {
    const c = mount(list(rows(3), jest.fn(), 0.5));
    expect(live()).toHaveLength(1);
    const observer = live()[0]!;
    expect(observer.options.rootMargin).toBe('0px 0px 50% 0px');
    const marker = observer.targets[0] as HTMLElement;
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    expect(marker.style.position).toBe('absolute');
    expect(marker.style.bottom).toBe('0px');
    // Last in the list, after the footer: the end includes it, as in FlatList.
    expect(getByText(c, 'Footer').compareDocumentPosition(marker)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('defaults to two viewports, as the native FlatList', () => {
    mount(list(rows(3), jest.fn()));
    expect(live()[0]!.options.rootMargin).toBe('0px 0px 200% 0px');
  });

  it('fires once per approach and re-arms when the user scrolls back up', () => {
    const onEndReached = jest.fn();
    mount(list(rows(3), onEndReached));
    const observer = live()[0]!;
    observer.report(true);
    observer.report(true);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    observer.report(false);
    observer.report(true);
    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  it('re-arms when the row count changes, so a short page asks again', () => {
    const onEndReached = jest.fn();
    mount(list(rows(3), onEndReached));
    live()[0]!.report(true);
    mount(list(rows(3), onEndReached));
    expect(live()).toHaveLength(1);
    live()[0]!.report(true);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    mount(list(rows(6), onEndReached));
    expect(live()).toHaveLength(1);
    live()[0]!.report(true);
    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  it('never fires while data is empty', () => {
    const onEndReached = jest.fn();
    mount(list([], onEndReached));
    expect(live()).toHaveLength(0);
    mount(list(rows(2), onEndReached));
    live()[0]!.report(true);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('observes nothing without a handler', () => {
    mount(list(rows(3)));
    expect(ObserverStub.instances).toHaveLength(0);
  });

  it('paginates and scrolls against an element-kind panel, never the window', () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    let viewport: ReturnType<typeof useScreenViewport> = null;
    let screen: ScreenContextValue | undefined;
    function Probe() {
      viewport = useScreenViewport();
      screen = useScreen();
      return null;
    }
    const ref = React.createRef<VirtualListHandle>();
    try {
      mount(
        <BloomThemeProvider fonts={false}>
          <ScreenHostContext.Provider value={{ active: true, kind: 'element' }}>
            <Screen scroll="auto">
              <Probe />
              <VirtualList<Row>
                ref={ref}
                screen={{}}
                data={rows(3)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <span>{item.label}</span>}
                onEndReached={jest.fn()}
              />
            </Screen>
          </ScreenHostContext.Provider>
        </BloomThemeProvider>,
      );
      expect(viewport!.kind).toBe('element');
      const panel = viewport!.scrollRef!.current as HTMLElement;
      expect(live()[0]!.options.root).toBe(panel);
      panel.scrollTo = jest.fn();
      ref.current!.scrollToOffset({ offset: 40, animated: false });
      expect(panel.scrollTo).toHaveBeenCalledWith({ top: 40, behavior: 'auto' });
      // The panel drives the Screen; a window scroll is not this list's.
      act(() => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(screen!.scrollY.value).toBe(0);
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });
});

describe('VirtualList retained row geometry', () => {
  const heights = [140, 560, 220];
  const rows = heights.map((height, index) => ({ id: String(index), height }));
  const list = (
    <VirtualList
      data={rows}
      estimatedItemSize={400}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <div data-height={item.height}>Measured {item.id}</div>}
    />
  );
  const expectMeasuredRows = () => {
    expect(container.querySelector('[data-index="1"]')).toHaveStyle({
      transform: 'translateY(140px)',
    });
    expect(container.querySelector('[data-index="2"]')).toHaveStyle({
      transform: 'translateY(700px)',
    });
  };
  let restoreGeometry = () => {};
  beforeEach(() => {
    const offsetHeight = jest
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return Number(
          this.getAttribute('data-viewport-height') ??
            this.firstElementChild?.getAttribute('data-height') ??
            768,
        );
      });
    const rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0,
      y: -window.scrollY,
      top: -window.scrollY,
      bottom: 768 - window.scrollY,
      left: 0,
      right: 600,
      width: 600,
      height: 768,
      toJSON: () => ({}),
    }));
    const scrollTo = jest
      .spyOn(window, 'scrollTo')
      .mockImplementation((optionsOrX?: ScrollToOptions | number, y?: number) => {
        const top = typeof optionsOrX === 'number' ? y : optionsOrX?.top;
        if (top !== undefined) {
          Object.defineProperty(window, 'scrollY', { configurable: true, value: top });
          window.dispatchEvent(new Event('scroll'));
        }
      });
    restoreGeometry = () => {
      offsetHeight.mockRestore();
      rect.mockRestore();
      scrollTo.mockRestore();
    };
  });
  afterEach(() => {
    restoreGeometry();
    ResizeObserverStub.instances.clear();
  });
  it('recovers an initially zero window viewport from its resize observation alone', () => {
    const height = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 0 });
    try {
      mount(list);
      expect(container.querySelector('[data-index]')).toBeNull();
      act(() => {
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
        window.dispatchEvent(new Event('resize'));
      });
      expect(getByText(container, 'Measured 0')).toBeInTheDocument();
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
    } finally {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
    }
  });
  it('renders a short list when its parent scroll ref attaches after child layout effects', () => {
    const scrollRef = React.createRef<HTMLDivElement>();
    const metrics = {
      scrollY: makeMutable(0),
      contentHeight: makeMutable(920),
      viewportHeight: makeMutable(768),
    };
    mount(
      <div ref={scrollRef}>
        <ScreenViewportContext.Provider
          value={{ kind: 'element', active: true, scrollRef, metrics, scrollTo: () => {} }}
        >
          {list}
        </ScreenViewportContext.Provider>
      </div>,
    );
    expect(getByText(container, 'Measured 0')).toBeInTheDocument();
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
  });
  it('recovers a zero-height panel from its ResizeObserver without changing the list origin', () => {
    const panel = document.createElement('div');
    panel.setAttribute('data-viewport-height', '0');
    document.body.append(panel);
    const scrollRef = { current: panel };
    const metrics = {
      scrollY: makeMutable(0),
      contentHeight: makeMutable(920),
      viewportHeight: makeMutable(0),
    };
    try {
      mount(
        <ScreenViewportContext.Provider
          value={{ kind: 'element', active: true, scrollRef, metrics, scrollTo: () => {} }}
        >
          {list}
        </ScreenViewportContext.Provider>,
      );
      expect(container.querySelector('[data-index]')).toBeNull();
      panel.setAttribute('data-viewport-height', '768');
      act(() => {
        for (const observer of ResizeObserverStub.instances) {
          if (observer.targets.has(panel))
            observer.callback(
              [
                {
                  target: panel,
                  contentRect: panel.getBoundingClientRect(),
                  borderBoxSize: [{ inlineSize: 600, blockSize: 768 }],
                  contentBoxSize: [],
                  devicePixelContentBoxSize: [],
                },
              ],
              observer,
            );
        }
      });
      expect(getByText(container, 'Measured 0')).toBeInTheDocument();
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
    } finally {
      panel.remove();
    }
  });
  it('moves observers to a replacement element behind the same screen ref', () => {
    const original = document.createElement('div');
    const replacement = document.createElement('div');
    document.body.append(original, replacement);
    const scrollRef = { current: original };
    const metrics = {
      scrollY: makeMutable(0),
      contentHeight: makeMutable(920),
      viewportHeight: makeMutable(768),
    };
    const ui = () => (
      <ScreenViewportContext.Provider
        value={{ kind: 'element', active: true, scrollRef, metrics, scrollTo: () => {} }}
      >
        {list}
      </ScreenViewportContext.Provider>
    );
    try {
      mount(ui());
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
      expect(
        [...ResizeObserverStub.instances].some((observer) => observer.targets.has(original)),
      ).toBe(true);
      scrollRef.current = replacement;
      mount(ui());
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
      expect(
        [...ResizeObserverStub.instances].some((observer) => observer.targets.has(original)),
      ).toBe(false);
      expect(
        [...ResizeObserverStub.instances].some((observer) => observer.targets.has(replacement)),
      ).toBe(true);
    } finally {
      original.remove();
      replacement.remove();
    }
  });
  it('keeps measured row heights on resize when the row boxes have not changed', () => {
    mount(list);
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
    act(() => window.dispatchEvent(new Event('resize')));
    expectMeasuredRows();
  });
  it('updates row positions when resized content reports a new height', () => {
    mount(list);
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
    getByText(container, 'Measured 0').setAttribute('data-height', '280');
    act(() => {
      window.dispatchEvent(new Event('resize'));
      ResizeObserverStub.deliverRows();
    });
    expect(container.querySelector('[data-index="1"]')).toHaveStyle({
      transform: 'translateY(280px)',
    });
    expect(container.querySelector('[data-index="2"]')).toHaveStyle({
      transform: 'translateY(840px)',
    });
  });
  it('measures retained rows with their new scroll owner after switching document and panel', () => {
    const platform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const ui = (kind: 'document' | 'element') => (
      <BloomThemeProvider fonts={false}>
        <ScreenHostContext.Provider value={{ active: true, kind }}>
          <Screen scroll="auto">{list}</Screen>
        </ScreenHostContext.Provider>
      </BloomThemeProvider>
    );
    try {
      mount(ui('document'));
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
      mount(ui('element'));
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
      mount(ui('document'));
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
    }
  });
  it('remeasures changed row sizes and identities when restored after a width change', () => {
    const adapter = { useScreenContentId: () => '/feed', useScreenFocusEffect: () => {} };
    const resized = [
      { id: '2', height: 300 },
      { id: '0', height: 280 },
      { id: 'new', height: 200 },
    ];
    const width = window.innerWidth;
    const ui = (data: typeof rows | null) => (
      <ScrollRestorationProvider adapter={adapter}>
        {data && (
          <VirtualList
            restorationKey="viewer-a:home"
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <div data-height={item.height}>{item.id}</div>}
          />
        )}
      </ScrollRestorationProvider>
    );
    try {
      mount(ui(rows));
      act(() => ResizeObserverStub.deliverRows());
      mount(ui(null));
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
      mount(ui(resized));
      act(() => ResizeObserverStub.deliverRows());
      expect(container.querySelector('[data-index="1"]')).toHaveStyle({
        transform: 'translateY(300px)',
      });
      expect(container.querySelector('[data-index="2"]')).toHaveStyle({
        transform: 'translateY(580px)',
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    }
  });
  it('keeps snapshots tied to their row grouping when column count changes live', () => {
    const save = jest.spyOn(ScrollOffsetStore.prototype, 'saveMeasurements');
    const adapter = { useScreenContentId: () => '/feed', useScreenFocusEffect: () => {} };
    const ui = (shown: boolean, columns: number) => (
      <ScrollRestorationProvider adapter={adapter}>
        {shown && (
          <VirtualList
            restorationKey="grid"
            numColumns={columns}
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <div data-height={item.height}>{item.id}</div>}
          />
        )}
      </ScrollRestorationProvider>
    );
    try {
      mount(ui(true, 1));
      act(() => ResizeObserverStub.deliverRows());
      mount(ui(true, 2));
      act(() => ResizeObserverStub.deliverRows());
      expect(save.mock.calls.at(-1)?.[1].columns).toBe(1);
      mount(ui(false, 2));
      expect(save.mock.calls.at(-1)?.[1].columns).toBe(2);
      mount(ui(true, 2));
      expect(container.querySelectorAll('[data-index]')).toHaveLength(2);
      mount(ui(true, 1));
      act(() => ResizeObserverStub.deliverRows());
      expectMeasuredRows();
    } finally {
      save.mockRestore();
    }
  });
  it('restores offscreen row sizes before the first range after an actual route unmount', () => {
    const data = Array.from({ length: 60 }, (_, index) => ({
      id: String(index),
      height: heights[index % heights.length] ?? 140,
    }));
    const adapter = { useScreenContentId: () => '/feed', useScreenFocusEffect: () => {} };
    const ui = (shown: boolean, identity = 'viewer-a:home') => (
      <ScrollRestorationProvider adapter={adapter}>
        {shown && (
          <VirtualList
            restorationKey={identity}
            data={data}
            estimatedItemSize={400}
            overscan={1}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <div data-height={item.height}>Restored {item.id}</div>}
          />
        )}
      </ScrollRestorationProvider>
    );
    try {
      mount(ui(true));
      act(() => ResizeObserverStub.deliverRows());
      for (const offset of [1800, 3600, 5400])
        act(() => {
          Object.defineProperty(window, 'scrollY', { configurable: true, value: offset });
          window.dispatchEvent(new Event('scroll'));
          ResizeObserverStub.deliverRows();
        });
      const anchor = [...container.querySelectorAll<HTMLDivElement>('[data-index]')].find(
        (node) => {
          const top = Number.parseFloat(node.style.transform.replace('translateY(', ''));
          return top >= window.scrollY && top < window.scrollY + window.innerHeight;
        },
      );
      if (!anchor) throw new Error('Expected a mounted deep row');
      const index = anchor.dataset.index;
      const transform = anchor.style.transform;
      const spacer = anchor.parentElement;
      mount(ui(false));
      expect(spacer?.isConnected).toBe(false);
      mount(ui(true));
      expect(container.querySelector(`[data-index="${index}"]`)).toHaveStyle({ transform });
      mount(ui(true, 'viewer-b:home'));
      expect(
        container.querySelector<HTMLDivElement>(`[data-index="${index}"]`)?.style.transform,
      ).not.toBe(transform);
      mount(ui(true));
      expect(container.querySelector(`[data-index="${index}"]`)).toHaveStyle({ transform });
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });
  it('ignores collapsed row measurements when data appends to an inactive screen', () => {
    const metrics = {
      scrollY: makeMutable(0),
      contentHeight: makeMutable(1200),
      viewportHeight: makeMutable(768),
    };
    const ui = (active: boolean, appended: boolean) => (
      <ScreenViewportContext.Provider
        value={{ kind: 'document', active, scrollRef: null, metrics, scrollTo: () => {} }}
      >
        <VirtualList
          data={appended ? [...rows, { id: '3', height: 280 }] : rows}
          estimatedItemSize={400}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <div data-height={active ? item.height : 0}>Hidden {item.id}</div>
          )}
        />
      </ScreenViewportContext.Provider>
    );
    mount(ui(true, false));
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
    mount(ui(false, true));
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
    expect(
      [...ResizeObserverStub.instances]
        .flatMap((observer) => [...observer.targets])
        .filter((node) => node.hasAttribute('data-index')),
    ).toHaveLength(0);
    mount(ui(true, true));
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
    expect(container.querySelector('[data-index="3"]')).toHaveStyle({
      transform: 'translateY(920px)',
    });
  });
  it('preserves offscreen measurements when a retained Screen becomes inactive and resumes', () => {
    const data = Array.from({ length: 60 }, (_, index) => ({
      id: String(index),
      height: heights[index % heights.length] ?? 140,
    }));
    const metrics = {
      scrollY: makeMutable(0),
      contentHeight: makeMutable(24000),
      viewportHeight: makeMutable(768),
    };
    const ui = (active: boolean) => (
      <ScreenViewportContext.Provider
        value={{ kind: 'document', active, scrollRef: null, metrics, scrollTo: () => {} }}
      >
        <VirtualList
          data={data}
          estimatedItemSize={400}
          overscan={1}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <div data-height={item.height}>Deep {item.id}</div>}
        />
      </ScreenViewportContext.Provider>
    );
    try {
      mount(ui(true));
      act(() => ResizeObserverStub.deliverRows());
      for (const offset of [1800, 3600, 5400])
        act(() => {
          Object.defineProperty(window, 'scrollY', { configurable: true, value: offset });
          window.dispatchEvent(new Event('scroll'));
          ResizeObserverStub.deliverRows();
        });
      expect(container.querySelector('[data-index="0"]')).toBeNull();
      const anchor = container.querySelector<HTMLDivElement>('[data-index]');
      if (!anchor) throw new Error('Expected a mounted deep row');
      const index = anchor.dataset.index;
      const transform = anchor.style.transform;
      mount(ui(false));
      expect(
        [...ResizeObserverStub.instances]
          .flatMap((observer) => [...observer.targets])
          .filter((node) => node.hasAttribute('data-index')),
      ).toHaveLength(0);
      jest.mocked(window.scrollTo).mockClear();
      act(() => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 });
        window.dispatchEvent(new Event('scroll'));
        ResizeObserverStub.deliverRows();
      });
      expect(window.scrollTo).not.toHaveBeenCalled();
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 5400 });
      mount(ui(true));
      act(() => ResizeObserverStub.deliverRows());
      expect(container.querySelector(`[data-index="${index}"]`)).toHaveStyle({ transform });
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });
  it('keeps measured row heights when an Activity restores the same content', () => {
    mount(<React.Activity mode="visible">{list}</React.Activity>);
    act(() => ResizeObserverStub.deliverRows());
    expectMeasuredRows();
    mount(<React.Activity mode="hidden">{list}</React.Activity>);
    mount(<React.Activity mode="visible">{list}</React.Activity>);
    expectMeasuredRows();
  });
});
