/**
 * @jest-environment jsdom
 */

// Exercises the WEB scroll-restoration hook (`scroll/index.web`) against the
// three things it exists to get right:
//
//   1. Restore-or-reset. A document-scrolled app shares ONE scroller across
//      every route, so a key with nothing saved has to be written to 0 — doing
//      nothing leaves the previous screen's offset in place.
//   2. Identity on two axes. An entry the router RECYCLED to show different
//      content is a different screen; the same content in a new entry is too.
//   3. The collapsed-screen behaviour of the (expo-router-wrapped) React
//      Navigation web stack, which forces a hidden screen's `scrollTop` to 0
//      and re-lays out a re-shown virtualized list over SEVERAL frames.
//
// The router is supplied through the adapter the core now takes, so this suite
// mocks nothing: it drives identity and focus directly, which is also how a
// non-expo consumer would use the hook. `requestAnimationFrame` is driven
// manually so the multi-frame restore is deterministic.

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import {
  ScrollRestorationProvider,
  useScrollRestoration,
} from '../scroll/index.web';
import type {
  ScreenFocusEffect,
  ScrollRestorationBinding,
  ScrollRouterAdapter,
} from '../scroll/types';

// React 19's `act` requires this flag to be set when driving updates manually
// outside a testing-library renderer.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// ---- A test router ---------------------------------------------------------
// `useScreenFocusEffect` mirrors expo-router's contract on the two points this
// hook depends on: while the screen is focused the effect re-runs whenever its
// IDENTITY changes (which is how a key change mid-focus is seen at all), and it
// does not run while the screen is blurred.

const ContentContext = createContext<string | null>(null);
const FocusContext = createContext(true);

const testAdapter: ScrollRouterAdapter = {
  useScreenContentId: () => useContext(ContentContext),
  useScreenFocusEffect: (effect: ScreenFocusEffect) => {
    const focused = useContext(FocusContext);
    useEffect(() => (focused ? effect() : undefined), [effect, focused]);
  },
};

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
const FULL_CONTENT_HEIGHT = 6586;

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

  /** The user grabs the scroller mid-restore (wheel, touch, scrollbar, keys). */
  emitUserTakeover(type: string): void {
    this.el.dispatchEvent(new Event(type));
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
// screen under it changes identity, focus and mount state.

interface ScreenProps {
  node: FakeScrollNode;
  subKey?: string;
  enabled?: boolean;
  onBinding?: (binding: ScrollRestorationBinding) => void;
}

function Screen({ node, subKey, enabled, onBinding }: ScreenProps): ReactNode {
  const ref = useRef(makeHandle(node));
  const binding = useScrollRestoration(ref, { key: subKey, enabled });
  onBinding?.(binding);
  return null;
}

interface ShowOptions extends ScreenProps {
  content: string | null;
  focused?: boolean;
}

class Harness {
  readonly root: Root;
  private readonly container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
  }

  /** Render the screen showing `content`, with a focus state and options. */
  show({ content, focused = true, ...screen }: ShowOptions): void {
    act(() => {
      this.root.render(
        createElement(ScrollRestorationProvider, {
          adapter: testAdapter,
          children: createElement(
            FocusContext.Provider,
            { value: focused },
            createElement(
              ContentContext.Provider,
              { value: content },
              createElement(Screen, screen),
            ),
          ),
        }),
      );
    });
  }

  teardown(): void {
    act(() => {
      this.root.unmount();
    });
    this.container.remove();
  }
}

function scrollTo(node: FakeScrollNode, offset: number): void {
  node.scrollTop = offset;
  act(() => {
    node.emitScroll();
  });
}

let contentSeq = 0;
/** A content id no earlier test has used, i.e. never seen this session. */
function unseenContent(): string {
  contentSeq += 1;
  return `route-${contentSeq}?`;
}

describe('web scroll-restoration hook', () => {
  let frames: FrameScheduler;
  let harness: Harness;

  beforeEach(() => {
    frames = new FrameScheduler();
    frames.install();
    harness = new Harness();
  });

  afterEach(() => {
    harness.teardown();
  });

  it('resets an unseen screen to the top instead of leaving it where the last one was', () => {
    // The defect this replaces: a key with nothing saved read 0 and the hook
    // did nothing at all. On a document-scrolled app (one window scroller for
    // every route) that means the new screen opens at the previous screen's
    // offset.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    node.scrollTop = 3000; // where the previous screen left the shared scroller

    harness.show({ node, content: unseenContent() });

    expect(node.scrollTop).toBe(0);
  });

  it('restores a saved offset across frames while the list is still short', () => {
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();

    harness.show({ node, content });
    scrollTo(node, 3520);
    harness.show({ node, content, focused: false });

    // Re-show: list starts collapsed (rows not yet rendered) and grows over
    // frames. A single-frame restore would be clamped to 0 and never recover.
    node.collapseLikeNavigator();
    harness.show({ node, content });

    // Frame 1: still collapsed — the write is clamped to 0, loop keeps retrying.
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(0);
    expect(frames.pending).toBeGreaterThan(0);

    // A few frames later the rows lay out and the content reaches full height.
    node.growTo(FULL_CONTENT_HEIGHT);
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('saves the outgoing list and restores-or-resets the incoming one when the key changes MID-FOCUS', () => {
    // An in-screen tab or folder swap: the screen never blurs, so nothing in a
    // focus transition can be relied on to notice.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();

    harness.show({ node, content, subKey: 'posts' });
    scrollTo(node, 3520);

    // Swap to a never-seen tab while still focused: reset to the top.
    harness.show({ node, content, subKey: 'media' });
    expect(node.scrollTop).toBe(0);

    scrollTo(node, 900);

    // Back to the first tab: its own offset is intact.
    harness.show({ node, content, subKey: 'posts' });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);

    // ...and so is the second tab's.
    harness.show({ node, content, subKey: 'media' });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(900);
  });

  it('resets when the route name is the same but the params differ', () => {
    // The case that makes params part of the content id: expo-router RECYCLES
    // one route object — `route.key` included — when `NAVIGATE` targets the
    // current route name and its dynamic segments match, i.e. when only the
    // query changed. Measured on 56.2.10 and 57.0.9 with `search?q=cats` ->
    // `search?q=dogs`.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const cats = 'search?"q":"cats"';
    const dogs = 'search?"q":"dogs"';

    harness.show({ node, content: cats });
    scrollTo(node, 2000);

    harness.show({ node, content: dogs });
    expect(node.scrollTop).toBe(0);

    // ...and cats keeps its own offset.
    harness.show({ node, content: cats });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(2000);
  });

  it('restores content already seen, whatever entry it is reached through', () => {
    // The rule in one test: an offset belongs to WHAT the user was looking at.
    // The same url reached through a second history entry — a tab press, an
    // in-app link, `router.replace` — is the same content and restores.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const post = 'p/[id]?"id":"42"';
    const elsewhere = unseenContent();

    harness.show({ node, content: post });
    scrollTo(node, 1500);

    harness.show({ node, content: elsewhere });
    expect(node.scrollTop).toBe(0);

    harness.show({ node, content: post });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(1500);
  });

  it('is completely inert while disabled — no save, no restore, no reset', () => {
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    node.scrollTop = 3000;
    const content = unseenContent();

    harness.show({ node, content, enabled: false });

    // No reset, and no restore loop scheduled.
    expect(node.scrollTop).toBe(3000);
    expect(frames.pending).toBe(0);

    // No save either: scrolling while disabled records nothing, which the
    // enabled render below proves by resetting instead of restoring.
    scrollTo(node, 4200);
    harness.show({ node, content, enabled: true });
    expect(node.scrollTop).toBe(0);
    expect(frames.pending).toBe(0);
  });

  it('does not clobber the saved offset when the navigator collapses the screen on blur', () => {
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();
    harness.show({ node, content });

    // User scrolls to 3520 — the live scroll listener records it.
    scrollTo(node, 3520);

    // Navigator collapses the hidden screen and forces scrollTop to 0 while the
    // screen is still technically focused (a stray scroll event fires). This
    // must NOT be persisted over the good 3520.
    node.collapseLikeNavigator();
    act(() => {
      node.emitScroll();
    });

    // Blur: cleanup runs and must persist the last GOOD offset, not the 0.
    harness.show({ node, content, focused: false });

    // Re-show with full content height: restore should reach 3520 in one frame.
    node.growTo(FULL_CONTENT_HEIGHT);
    node.scrollTop = 0;
    harness.show({ node, content });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('persists a genuine scroll-to-top over a previously-saved offset', () => {
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();
    harness.show({ node, content });
    scrollTo(node, 3520);

    // User scrolls all the way back to the top; container is NOT collapsed, so
    // this 0 is genuine and must overwrite the saved 3520.
    scrollTo(node, 0);
    harness.show({ node, content, focused: false });

    // Re-show: the saved 0 is written back, so anything that nudged the shared
    // scroller in between is undone.
    node.scrollTop = 500;
    harness.show({ node, content });
    expect(node.scrollTop).toBe(0);
    // A write to 0 always sticks, so it never schedules the re-apply loop.
    expect(frames.pending).toBe(0);
  });

  it('stops retrying after the frame cap even if the content never grows', () => {
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();
    harness.show({ node, content });
    scrollTo(node, 3520);
    harness.show({ node, content, focused: false });

    // Re-show that never reaches full height.
    node.collapseLikeNavigator();
    harness.show({ node, content });

    // Flush far more than the cap; the loop must terminate.
    for (let i = 0; i < 60; i++) {
      act(() => {
        frames.flushOneFrame();
      });
    }
    expect(frames.pending).toBe(0);
  });

  it.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])(
    'abandons the restore as soon as the user takes over (%s)',
    (takeoverEvent) => {
      // HTML §7.4.6.5 makes this a condition on the browser's own restoration:
      // it re-attempts the saved position "until document's has been scrolled by
      // the user becomes true". Without the abort the loop yanks the user back
      // up to once a frame for the whole frame budget.
      const node = new FakeScrollNode();
      node.growTo(FULL_CONTENT_HEIGHT);
      const content = unseenContent();
      harness.show({ node, content });
      scrollTo(node, 3520);
      harness.show({ node, content, focused: false });

      // Re-show collapsed, so the loop is still retrying rather than done.
      node.collapseLikeNavigator();
      harness.show({ node, content });
      act(() => {
        frames.flushOneFrame();
      });
      expect(frames.pending).toBeGreaterThan(0);

      // The user grabs it and scrolls somewhere of their own.
      act(() => {
        node.emitUserTakeover(takeoverEvent);
      });
      node.growTo(FULL_CONTENT_HEIGHT);
      scrollTo(node, 120);

      for (let i = 0; i < 10; i++) {
        act(() => {
          frames.flushOneFrame();
        });
      }
      expect(frames.pending).toBe(0);
      expect(node.scrollTop).toBe(120);
    },
  );

  it('does not abandon the restore on the scroll events its own writes produce', () => {
    // The naive form of the abort above — "any scroll event cancels" — cancels
    // on the first frame, because `setOffset` IS a scroll. This is the control
    // that keeps the two apart.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();
    harness.show({ node, content });
    scrollTo(node, 3520);
    harness.show({ node, content, focused: false });

    node.collapseLikeNavigator();
    harness.show({ node, content });

    act(() => {
      frames.flushOneFrame();
      node.emitScroll(); // what a real browser emits after our clamped write
    });
    expect(frames.pending).toBeGreaterThan(0);

    node.growTo(FULL_CONTENT_HEIGHT);
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('is inert when the adapter cannot identify the screen', () => {
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    node.scrollTop = 3000;

    harness.show({ node, content: null });

    expect(node.scrollTop).toBe(3000);
    expect(frames.pending).toBe(0);
  });

  it('follows the real navigation sequence: home -> post -> TAP HOME -> back -> back', () => {
    // The user's own scenario, and the reason the key is CONTENT rather than
    // the navigation entry. Driving expo-router's own forked router
    // (`build/layouts/StackClient.js`) on 56.2.10 and 57.0.9 shows what tapping
    // Home actually does:
    //
    //   [home#A]                      user scrolls home
    //   push /p/1   -> [home#A, post#B]
    //   navigate /  -> [home#A, post#B, home#C]   <- a NEW entry, NEW key
    //   back        -> post#B  (resetRoot to the recorded state, keys intact)
    //   back        -> home#A
    //
    // Keyed on the entry, home#C misses and opens at the top. Keyed on content,
    // every one of these is `index?` or `p/[id]?"id":"1"` and the user gets
    // back what they were looking at — the Twitter/Instagram convention.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const home = 'index?';
    const post = 'p/[id]?"id":"1"';

    harness.show({ node, content: home });
    scrollTo(node, 2400);

    harness.show({ node, content: post });
    expect(node.scrollTop).toBe(0);
    scrollTo(node, 800);

    // TAP HOME — a new history entry, but the same content.
    harness.show({ node, content: home });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(2400);

    // Browser Back to the post.
    harness.show({ node, content: post });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(800);

    // Browser Back again to home.
    harness.show({ node, content: home });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(2400);
  });

  it('opens content never seen this session at the top', () => {
    // The other half of the rule, and the defect that started the task: with
    // one shared document scroller, "never seen" has to mean "written to 0".
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);

    harness.show({ node, content: unseenContent() });
    scrollTo(node, 2600);

    harness.show({ node, content: unseenContent() });
    expect(node.scrollTop).toBe(0);
    expect(frames.pending).toBe(0);
  });

  it('sends content to the top ONCE, not on every re-run for the same key', () => {
    // `enabled` turning on after being off is not a fresh arrival. The hook was
    // inert while it was off, so a scroll during that window was never
    // recorded — resetting on the way back in would throw it away with nothing
    // to restore from. Restoring twice is harmless; resetting twice is loss.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();

    harness.show({ node, content });
    expect(node.scrollTop).toBe(0);

    harness.show({ node, content, enabled: false });
    node.scrollTop = 1800; // the user scrolls while the hook is inert

    harness.show({ node, content, enabled: true });
    expect(node.scrollTop).toBe(1800);
  });

  it('does not persist the browser echo of its own reset write', () => {
    // A real browser dispatches `scroll` for our `setOffset(0)` (jsdom does
    // not, hence the explicit emit). Persisting it records an offset the user
    // never chose — and under content keying a SIBLING screen showing the same
    // content shares the key, so the echo can land after that sibling saved a
    // real offset and clobber it. This is the two-live-entries trade made
    // observable.
    const shared = 'p/[id]?"id":"42"';
    const first = new FakeScrollNode();
    const second = new FakeScrollNode();
    first.growTo(FULL_CONTENT_HEIGHT);
    second.growTo(FULL_CONTENT_HEIGHT);

    // Two live screens on the same content, both arriving with nothing saved.
    act(() => {
      harness.root.render(
        createElement(ScrollRestorationProvider, {
          adapter: testAdapter,
          children: createElement(
            ContentContext.Provider,
            { value: shared },
            createElement(Screen, { node: first }),
            createElement(Screen, { node: second }),
          ),
        }),
      );
    });

    // The first screen scrolls and saves a real offset under the shared key...
    scrollTo(first, 2400);
    // ...and only then does the second screen's reset echo arrive.
    act(() => {
      second.emitScroll();
    });

    // A later visit to that content must still get 2400, not the echoed 0.
    const later = new FakeScrollNode();
    later.growTo(FULL_CONTENT_HEIGHT);
    harness.show({ node: later, content: shared });
    act(() => {
      frames.flushOneFrame();
    });
    expect(later.scrollTop).toBe(2400);
  });

  it('does not persist a PARTIAL offset when the restore is aborted mid-loop', () => {
    // The corruption this closes: every loop write echoes back as a `scroll`
    // event, so before suppression an interrupted restore left whatever the
    // browser had clamped to in the store, and that content's remembered
    // position stayed wrong for the rest of the session. A swipe that commits
    // a route change mid-restore hits this every time.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();

    harness.show({ node, content });
    scrollTo(node, 3520);
    harness.show({ node, content, focused: false });

    // Re-show with the content still short, so the write clamps to a partial.
    node.collapseLikeNavigator();
    node.growTo(1500); // 621px of scroll range against a 3520 target
    harness.show({ node, content });
    act(() => {
      frames.flushOneFrame();
      node.emitScroll(); // the browser echoing our own clamped write
    });
    expect(node.scrollTop).toBe(1500 - 879);

    // The user grabs it, which aborts the loop, and then navigates away.
    act(() => {
      node.emitUserTakeover('touchstart');
    });
    harness.show({ node, content, focused: false });

    // The original offset must have survived, not the partial.
    node.growTo(FULL_CONTENT_HEIGHT);
    node.scrollTop = 0;
    harness.show({ node, content });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('keeps the original target when the loop exhausts its frame budget', () => {
    // Same mechanism, the other end state. Content that is short right now is
    // usually a list still loading, not a permanent shrink — remembering the
    // target means the position is right once the rows arrive.
    const node = new FakeScrollNode();
    node.growTo(FULL_CONTENT_HEIGHT);
    const content = unseenContent();

    harness.show({ node, content });
    scrollTo(node, 3520);
    harness.show({ node, content, focused: false });

    node.collapseLikeNavigator();
    node.growTo(1500);
    harness.show({ node, content });
    for (let i = 0; i < 40; i++) {
      const wrote = frames.pending > 0;
      act(() => {
        frames.flushOneFrame();
        // Only a frame that actually wrote produces an echo; a real browser
        // dispatches `scroll` when something moves, not on a timer.
        if (wrote) node.emitScroll();
      });
    }
    expect(frames.pending).toBe(0);
    harness.show({ node, content, focused: false });

    node.growTo(FULL_CONTENT_HEIGHT);
    node.scrollTop = 0;
    harness.show({ node, content });
    act(() => {
      frames.flushOneFrame();
    });
    expect(node.scrollTop).toBe(3520);
  });

  it('returns a binding that is safe to wire onto a list on either platform', () => {
    const node = new FakeScrollNode();
    const seen: ScrollRestorationBinding[] = [];

    harness.show({
      node,
      content: unseenContent(),
      onBinding: (binding) => seen.push(binding),
    });

    expect(typeof seen[0]?.onScroll).toBe('function');
    // Calling it on web must be harmless: this platform records offsets from
    // the DOM node's own scroll event, and a shared call site still passes it.
    expect(() =>
      seen[0]?.onScroll({
        nativeEvent: { contentOffset: { x: 0, y: 1234 } },
      } as NativeSyntheticEvent<NativeScrollEvent>),
    ).not.toThrow();
  });
});

// ---- history.scrollRestoration ---------------------------------------------
// jsdom does not implement `history.scrollRestoration` at all ('scrollRestoration'
// in history === false), so the provider's feature detect makes it a no-op in
// every other suite here. This block installs the property first, which is what
// makes these the only tests that exercise the switch.

describe('manual browser scroll restoration', () => {
  let installed: HTMLElement | null = null;
  let root: Root | null = null;

  function mountProvider(): void {
    installed = document.createElement('div');
    document.body.appendChild(installed);
    root = createRoot(installed);
    act(() => {
      root?.render(
        createElement(ScrollRestorationProvider, {
          adapter: testAdapter,
          children: null,
        }),
      );
    });
  }

  beforeEach(() => {
    Object.defineProperty(window.history, 'scrollRestoration', {
      configurable: true,
      writable: true,
      value: 'auto',
    });
  });

  afterEach(() => {
    if (root && installed) {
      act(() => {
        root?.unmount();
      });
      installed.remove();
    }
    root = null;
    installed = null;
    delete (window.history as { scrollRestoration?: string }).scrollRestoration;
  });

  it('takes restoration over while the provider is mounted', () => {
    mountProvider();
    expect(history.scrollRestoration).toBe('manual');
  });

  it('hands restoration back to the browser on pagehide', () => {
    // The offset map is in memory only: a reload starts empty and a bfcache
    // restore resumes a document whose focus effects never re-run. Leaving it
    // 'manual' on the way out means nobody restores at all.
    mountProvider();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(history.scrollRestoration).toBe('auto');
  });

  it('hands restoration back on unmount', () => {
    mountProvider();
    expect(history.scrollRestoration).toBe('manual');
    act(() => {
      root?.unmount();
    });
    installed?.remove();
    root = null;
    installed = null;
    expect(history.scrollRestoration).toBe('auto');
  });
});
