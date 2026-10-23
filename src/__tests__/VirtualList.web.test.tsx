/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByText, queryByText } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, useScreen } from '../screen';
import type { ScreenContextValue } from '../screen/context';
import { VirtualList } from '../list/index.web';

// `@tanstack/react-virtual` measures rows via ResizeObserver + getBoundingClientRect,
// neither of which jsdom implements with a real layout engine. Stub both so the
// window virtualizer computes a deterministic, non-empty range against jsdom's
// default 768px-tall window — exactly the path that regressed in production
// (rows present, wrapper sized, but `getVirtualItems()` came back empty).
class ResizeObserverStub {
  constructor(_cb: ResizeObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
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
});
