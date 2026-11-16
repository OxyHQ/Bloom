/** @jest-environment jsdom */
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import type { TabBarButtonProps, TabBarProps } from '../tab-bar/types';
import { BottomBarBase } from '../bottom-bar/BottomBarBase';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
// Keep this test about the BottomBar's sizing before measurements. The scroll
// owner and navigation interaction each have their own integration suites.
jest.mock('../layout/ScrollArea', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('../layout/bottom-edge', () => ({
  ...jest.requireActual('../layout/bottom-edge'),
  useClaimBottomEdge: jest.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Navigation({ children }: TabBarProps) {
  return <div role="tablist">{children}</div>;
}
function Item({ item }: TabBarButtonProps) {
  return (
    <button type="button" role="tab">
      {item.label}
    </button>
  );
}

it('recovers the intrinsic action after a hidden desktop frame and follows a changed action label', async () => {
  const original = globalThis.ResizeObserver;
  const observers = new Set<{ callback: ResizeObserverCallback; nodes: Set<Element> }>();
  let hidden = true;
  let naturalWidth = 132;
  class Observer {
    nodes = new Set<Element>();
    constructor(readonly callback: ResizeObserverCallback) {
      observers.add(this);
    }
    observe(node: Element) {
      this.nodes.add(node);
    }
    unobserve(node: Element) {
      this.nodes.delete(node);
    }
    disconnect() {
      this.nodes.clear();
    }
  }
  globalThis.ResizeObserver = Observer as unknown as typeof ResizeObserver;
  const deliver = () => {
    for (const observer of observers) {
      const entries = [...observer.nodes].map((node) => {
        const measured = node as HTMLElement;
        const fixed = Number.parseFloat(measured.style.width);
        const width = hidden
          ? 0
          : measured.dataset.testid === 'bar-action-content'
            ? Number.isFinite(fixed)
              ? fixed
              : naturalWidth
            : 320;
        return { target: node, borderBoxSize: [{ inlineSize: width, blockSize: hidden ? 0 : 50 }] };
      });
      observer.callback(
        entries as unknown as ResizeObserverEntry[],
        observer as unknown as ResizeObserver,
      );
    }
  };
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <BottomBarBase
          Navigation={Navigation}
          Item={Item}
          Blur={() => null}
          items={Array.from({ length: 3 }, (_, i) => ({
            name: String(i),
            label: String(i),
            icon: null,
          }))}
          value="0"
          onValueChange={() => {}}
          action={<button type="button">Compose</button>}
          testID="bar"
        />,
      ),
    );
    act(deliver);
    hidden = false;
    act(deliver);
    const action = host.querySelector<HTMLElement>('[data-testid="bar-action"]')!;
    expect(action.style.width).toBe('132px');
    expect(action.style.position).toBe('absolute');
    naturalWidth = 180;
    act(deliver);
    expect(action.style.width).toBe('180px');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.ResizeObserver = original;
  }
});

it.each([2, 5])(
  'renders %s destinations before measurements and preserves them through hydration',
  async (count) => {
    const items = Array.from({ length: count }, (_, i) => ({
      name: `tab-${i}`,
      label: `Tab ${i}`,
      icon: null,
    }));
    const app = (
      <BottomBarBase
        Navigation={Navigation}
        Item={Item}
        Blur={() => null}
        items={items}
        value="tab-0"
        onValueChange={() => {}}
        action={<button type="button">Compose</button>}
        testID="bar"
      />
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(app);
    document.body.appendChild(host);
    const navigation = host.querySelector<HTMLElement>('[data-testid="bar-navigation"]');
    expect(navigation?.style.width).toBe(`${count * 88 + 8}px`);
    expect(navigation?.style.flexShrink).toBe('1');
    expect(navigation?.style.minWidth).toBe('0px');
    const tablist = host.querySelector('[role="tablist"]');
    const content = tablist?.parentElement;
    expect(content?.style.width).toBe('100%');
    expect(content?.style.minWidth).toBe(`${count * 44 + 8}px`);
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(count);
    const onRecoverableError = jest.fn();
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, app, { onRecoverableError });
      });
      expect(host.querySelector('[data-testid="bar-navigation"]')).toBe(navigation);
      expect(host.querySelector('[role="tablist"]')).toBe(tablist);
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      error.mockRestore();
      host.remove();
    }
  },
);
