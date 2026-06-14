/**
 * @jest-environment jsdom
 */

// Exercises the WEB scroll-restoration hook (`scroll/index.web`) against the
// exact failure mode it was written to survive: React Navigation's web stack
// collapses a hidden background screen (forcing its `scrollTop` to 0) on push,
// and a re-shown virtualized list re-lays out its rows — and thus reaches its
// full scroll height — over SEVERAL frames after focus.
//
// We mock `@react-navigation/native` so `useFocusEffect` runs the effect on
// mount and its cleanup on unmount, and drive `requestAnimationFrame` manually
// so the multi-frame restore is deterministic.

import { createElement, useRef, type ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// React 19's `act` requires this flag to be set when driving updates manually
// outside a testing-library renderer.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// ---- React Navigation mock ------------------------------------------------
// `useFocusEffect` here mirrors the real contract closely enough for this hook:
// it runs the callback in a layout effect and runs the returned cleanup on
// unmount. `useRoute` yields a stable per-test route key.

let currentRouteKey = 'route-test';

jest.mock('@react-navigation/native', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (effect: () => undefined | (() => void)) => {
      react.useEffect(effect, [effect]);
    },
    useRoute: () => ({ key: currentRouteKey, name: 'Test', params: {} }),
  };
});

// Imported AFTER the mock is registered.
import {
  ScrollRestorationProvider,
  useScrollRestoration,
} from '../scroll/index.web';

// ---- requestAnimationFrame harness ---------------------------------------

type FrameCallback = (time: number) => void;

class FrameScheduler {
  private queue = new Map<number, FrameCallback>();
  private nextId = 1;

  install(): void {
    window.requestAnimationFrame = ((cb: FrameCallback): number => {
      const id = this.nextId++;
      this.queue.set(id, cb);
      return id;
    }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = (id: number): void => {
      this.queue.delete(id);
    };
  }

  /** Run one frame's worth of scheduled callbacks (those queued before now). */
  flushOneFrame(): void {
    const batch = [...this.queue.entries()];
    this.queue.clear();
    for (const [, cb] of batch) cb(performance.now());
  }

  get pending(): number {
    return this.queue.size;
  }
}

// ---- A fake RNW scrollable -------------------------------------------------
// Models a FlashList's underlying DOM node. It MUST be a real HTMLElement
// because the scroller resolves the live node via `instanceof HTMLElement`.
// jsdom does no layout, so we own `scrollHeight`/`clientHeight`/`scrollTop`
// ourselves: `scrollTop` is clamped to `scrollHeight - clientHeight` on write
// (as a real element is), content starts collapsed and grows on "relayout".

const VIEWPORT_HEIGHT = 879;

class FakeScrollNode {
  readonly el: HTMLDivElement;
  private _scrollHeight = VIEWPORT_HEIGHT; // collapsed: equals clientHeight
  private _scrollTop = 0;

  constructor() {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientHeight', {
      configurable: true,
      get: () => VIEWPORT_HEIGHT,
    });
    Object.defineProperty(el, 'scrollHeight', {
      configurable: true,
      get: () => this._scrollHeight,
    });
    Object.defineProperty(el, 'scrollTop', {
      configurable: true,
      get: () => this._scrollTop,
      set: (value: number) => {
        const max = Math.max(0, this._scrollHeight - VIEWPORT_HEIGHT);
        this._scrollTop = Math.min(Math.max(0, value), max);
      },
    });
    this.el = el;
  }

  get scrollTop(): number {
    return this.el.scrollTop;
  }
  set scrollTop(value: number) {
    this.el.scrollTop = value;
  }

  /** Grow content to its full laid-out height (re-show relayout). */
  growTo(height: number): void {
    this._scrollHeight = height;
  }

  /**
   * Reproduce what React Navigation's web stack does to a hidden background
   * screen: collapse its content to the viewport height and force scrollTop to
   * 0 (a collapsed container cannot hold a non-zero offset).
   */
  collapseLikeNavigator(): void {
    this._scrollHeight = VIEWPORT_HEIGHT;
    this._scrollTop = 0;
  }

  emitScroll(): void {
    this.el.dispatchEvent(new Event('scroll'));
  }
}

// A RNW-style handle exposing `getScrollableNode()` -> the DOM node.
function makeHandle(node: FakeScrollNode): { getScrollableNode: () => HTMLElement } {
  return { getScrollableNode: () => node.el };
}

// ---- Render harness --------------------------------------------------------
//
// A single <ScrollRestorationProvider> stays mounted (mirroring the real app
// root, where the offset store lives for the document's lifetime) while the
// screen under it mounts and unmounts to model push/pop navigation.

function Screen({ node }: { node: FakeScrollNode }): ReactNode {
  const ref = useRef(makeHandle(node));
  useScrollRestoration(ref);
  return null;
}

class Harness {
  readonly root: Root;
  private readonly container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
  }

  /** Mount (focus) the screen bound to `node`. */
  focus(node: FakeScrollNode): void {
    act(() => {
      this.root.render(
        createElement(
          ScrollRestorationProvider,
          null,
          createElement(Screen, { node }),
        ),
      );
    });
  }

  /** Unmount (blur) the screen while keeping the provider/store alive. */
  blur(): void {
    act(() => {
      this.root.render(createElement(ScrollRestorationProvider, null, null));
    });
  }

  teardown(): void {
    act(() => {
      this.root.unmount();
    });
    this.container.remove();
  }
}

describe('web scroll-restoration hook', () => {
  let frames: FrameScheduler;
  let harness: Harness;

  beforeEach(() => {
    frames = new FrameScheduler();
    frames.install();
    currentRouteKey = `route-${Math.random().toString(36).slice(2)}`;
    harness = new Harness();
  });

  afterEach(() => {
    harness.teardown();
  });

  it('does not clobber the saved offset when the navigator collapses the screen on blur (bug A)', () => {
    const node = new FakeScrollNode();
    node.growTo(6586); // real content
    harness.focus(node);

    // User scrolls to 3520 — the live scroll listener records it.
    node.scrollTop = 3520;
    act(() => {
      node.emitScroll();
    });

    // Navigator collapses the hidden screen and forces scrollTop to 0 while the
    // screen is still technically focused (a stray scroll event fires). This
    // must NOT be persisted over the good 3520.
    node.collapseLikeNavigator();
    act(() => {
      node.emitScroll();
    });

    // Blur: cleanup runs and must persist the last GOOD offset, not the 0.
    harness.blur();

    // Re-show with full content height: restore should reach 3520 in one frame.
    node.growTo(6586);
    node.scrollTop = 0;
    harness.focus(node);
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('re-applies the offset across frames until the list reaches full height (bug B)', () => {
    const node = new FakeScrollNode();
    node.growTo(6586);
    harness.focus(node);
    node.scrollTop = 3520;
    act(() => {
      node.emitScroll();
    });
    harness.blur();

    // Re-show: list starts collapsed (rows not yet rendered) and grows over
    // frames. A single-frame restore would be clamped to 0 and never recover.
    node.collapseLikeNavigator();
    harness.focus(node);

    // Frame 1: still collapsed — the write is clamped to 0, loop keeps retrying.
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(0);
    expect(frames.pending).toBeGreaterThan(0);

    // A few frames later the rows lay out and the content reaches full height.
    node.growTo(6586);
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('treats a saved offset of 0 as a no-op (no restore loop scheduled)', () => {
    const node = new FakeScrollNode();
    node.growTo(6586);
    harness.focus(node);
    // Nothing saved for this fresh route key => read() is 0 => no rAF queued.
    expect(frames.pending).toBe(0);
  });

  it('persists a genuine scroll-to-top over a previously-saved offset', () => {
    const node = new FakeScrollNode();
    node.growTo(6586);
    harness.focus(node);
    node.scrollTop = 3520;
    act(() => {
      node.emitScroll();
    });
    // User scrolls all the way back to the top; container is NOT collapsed, so
    // this 0 is genuine and must overwrite the saved 3520.
    node.scrollTop = 0;
    act(() => {
      node.emitScroll();
    });
    harness.blur();

    // Re-show: saved offset is 0 => restore is a no-op, nothing scheduled.
    node.scrollTop = 500; // pretend something nudged it after re-show
    harness.focus(node);
    expect(frames.pending).toBe(0);
    expect(node.scrollTop).toBe(500);
  });

  it('stops retrying after the frame cap even if the content never grows', () => {
    const node = new FakeScrollNode();
    node.growTo(6586);
    harness.focus(node);
    node.scrollTop = 3520;
    act(() => {
      node.emitScroll();
    });
    harness.blur();

    // Re-show that never reaches full height.
    node.collapseLikeNavigator();
    harness.focus(node);

    // Flush far more than the cap; the loop must terminate.
    for (let i = 0; i < 60; i++) {
      act(() => {
        frames.flushOneFrame();
      });
    }
    expect(frames.pending).toBe(0);
  });
});
