/**
 * @jest-environment jsdom
 */

// Exercises the NATIVE scroll-restoration hook (`scroll/index`). The jsdom
// environment is used only for a DOM-free React renderer host — nothing in this
// suite touches the DOM; the target is a plain `FlatList`-shaped ref, which is
// exactly what a native call site passes.
//
// The line this suite defends is narrow and easy to erase by accident:
// native-stack keeps a screen MOUNTED across a push/pop, so it already restores
// scroll for free and the hook must not interfere. What it does NOT survive is a
// key change — an in-screen tab swap, a genuine remount — which is the one case
// the hook exists for.

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

import { ScrollRestorationProvider, useScrollRestoration } from '../scroll/index';
import type {
  ScreenFocusEffect,
  ScrollRestorationBinding,
  ScrollRouterAdapter,
} from '../scroll/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// ---- A test router ---------------------------------------------------------

const ContentContext = createContext<string | null>(null);
const FocusContext = createContext(true);

const testAdapter: ScrollRouterAdapter = {
  useScreenContentId: () => useContext(ContentContext),
  useScreenFocusEffect: (effect: ScreenFocusEffect) => {
    const focused = useContext(FocusContext);
    useEffect(() => (focused ? effect() : undefined), [effect, focused]);
  },
};

// ---- requestAnimationFrame harness ----------------------------------------
// The native restore is deferred one frame so the incoming rows get their
// layout pass. Driving frames by hand keeps that deterministic.

type FrameCallback = (time: number) => void;

class FrameScheduler {
  private queue = new Map<number, FrameCallback>();
  private nextId = 1;

  install(): void {
    globalThis.requestAnimationFrame = ((cb: FrameCallback): number => {
      const id = this.nextId++;
      this.queue.set(id, cb);
      return id;
    }) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = (id: number): void => {
      this.queue.delete(id);
    };
  }

  flushOneFrame(): void {
    const batch = [...this.queue.entries()];
    this.queue.clear();
    for (const [, cb] of batch) cb(0);
  }

  get pending(): number {
    return this.queue.size;
  }
}

// ---- A fake native list ----------------------------------------------------
// Records every imperative scroll it is asked to perform, so "did not scroll
// anything" is a claim the suite can actually check rather than infer.

class FakeList {
  readonly scrolls: number[] = [];

  scrollToOffset({ offset }: { offset: number; animated?: boolean }): void {
    this.scrolls.push(offset);
  }

  get lastScroll(): number | undefined {
    return this.scrolls[this.scrolls.length - 1];
  }
}

function scrollEvent(y: number): NativeSyntheticEvent<NativeScrollEvent> {
  return {
    nativeEvent: { contentOffset: { x: 0, y } },
  } as NativeSyntheticEvent<NativeScrollEvent>;
}

// ---- Render harness --------------------------------------------------------

interface ScreenProps {
  list: FakeList;
  subKey?: string;
  enabled?: boolean;
  onBinding: (binding: ScrollRestorationBinding) => void;
}

function Screen({ list, subKey, enabled, onBinding }: ScreenProps): ReactNode {
  const ref = useRef(list);
  const binding = useScrollRestoration(ref, { key: subKey, enabled });
  onBinding(binding);
  return null;
}

interface ShowOptions {
  list: FakeList;
  content: string | null;
  subKey?: string;
  enabled?: boolean;
  focused?: boolean;
  onBinding?: (binding: ScrollRestorationBinding) => void;
}

class Harness {
  readonly root: Root;
  private readonly container: HTMLElement;
  private bindingRef: ScrollRestorationBinding | null = null;

  constructor() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
  }

  private render(children: ReactNode): void {
    act(() => {
      this.root.render(
        createElement(ScrollRestorationProvider, { adapter: testAdapter, children }),
      );
    });
  }

  show({ content, focused = true, onBinding, ...screen }: ShowOptions): void {
    this.render(
      createElement(
        FocusContext.Provider,
        { value: focused },
        createElement(
          ContentContext.Provider,
          { value: content },
          createElement(Screen, {
            ...screen,
            onBinding: (binding) => {
              this.bindingRef = binding;
              onBinding?.(binding);
            },
          }),
        ),
      ),
    );
  }

  /** Unmount the screen while keeping the provider (and its store) alive. */
  unmountScreen(): void {
    this.render(null);
    this.bindingRef = null;
  }

  /** The binding from the most recent render. */
  binding(): ScrollRestorationBinding {
    if (this.bindingRef === null) throw new Error('no screen mounted');
    return this.bindingRef;
  }

  /** Report a scroll the way a list wired to the binding would. */
  scroll(offset: number): void {
    const binding = this.bindingRef;
    if (binding === null) throw new Error('no screen mounted');
    act(() => {
      binding.onScroll(scrollEvent(offset));
    });
  }

  teardown(): void {
    act(() => {
      this.root.unmount();
    });
    this.container.remove();
  }
}

let contentSeq = 0;
/** A content id no earlier test has used, i.e. never seen this session. */
function unseenContent(): string {
  contentSeq += 1;
  return `route-${contentSeq}?`;
}

describe('native scroll-restoration hook', () => {
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

  it('restores through scrollToOffset when the key changes while mounted', () => {
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content, subKey: 'posts' });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(2400);

    // Swap to another tab of the same screen and back.
    harness.show({ list, content, subKey: 'media' });
    act(() => {
      frames.flushOneFrame();
    });
    harness.show({ list, content, subKey: 'posts' });
    act(() => {
      frames.flushOneFrame();
    });

    expect(list.lastScroll).toBe(2400);
  });

  it('sends a never-seen key back to the top rather than leaving the last one in place', () => {
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content, subKey: 'posts' });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(2400);

    harness.show({ list, content, subKey: 'media' });
    act(() => {
      frames.flushOneFrame();
    });

    expect(list.lastScroll).toBe(0);
  });

  it('scrolls nothing when a push/pop re-focuses the same screen', () => {
    // The behaviour native-stack already provides. Re-applying an offset here
    // would at best be a no-op and at worst fight a list that legitimately
    // moved, so the hook must stay out of it entirely.
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(1800);
    const scrollsBeforeNavigation = list.scrolls.length;

    // Push a screen on top (this one blurs but stays mounted), then pop back.
    harness.show({ list, content, focused: false });
    act(() => {
      frames.flushOneFrame();
    });
    harness.show({ list, content, focused: true });
    act(() => {
      frames.flushOneFrame();
    });

    expect(list.scrolls.length).toBe(scrollsBeforeNavigation);
  });

  it('restores after a genuine remount of the same screen', () => {
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(3100);

    harness.unmountScreen();
    harness.show({ list, content });
    act(() => {
      frames.flushOneFrame();
    });

    expect(list.lastScroll).toBe(3100);
  });

  it('resets when the route name is the same but the params differ', () => {
    const list = new FakeList();
    const cats = 'search?"q":"cats"';
    const dogs = 'search?"q":"dogs"';

    harness.show({ list, content: cats });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(2000);

    harness.show({ list, content: dogs });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.lastScroll).toBe(0);

    harness.show({ list, content: cats });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.lastScroll).toBe(2000);
  });

  it('restores content already seen, whatever entry it is reached through', () => {
    // The same rule as on web: an offset belongs to WHAT the user was looking
    // at, so a tab press or an in-app link back to it restores.
    const list = new FakeList();
    const post = 'p/[id]?"id":"42"';
    const elsewhere = unseenContent();

    harness.show({ list, content: post });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(1500);

    harness.show({ list, content: elsewhere });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.lastScroll).toBe(0);

    harness.show({ list, content: post });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.lastScroll).toBe(1500);
  });

  it('waits for the caller to report its rows before restoring', () => {
    // `enabled` is the native equivalent of the web path's re-apply loop: there
    // is no scroll event to retry from, so the caller gates on its own content.
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(2600);
    harness.unmountScreen();

    // Remount with no rows yet: nothing scheduled, nothing scrolled.
    harness.show({ list, content, enabled: false });
    expect(frames.pending).toBe(0);
    const scrollsWhileEmpty = list.scrolls.length;

    // Rows arrive.
    harness.show({ list, content, enabled: true });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.scrolls.length).toBe(scrollsWhileEmpty + 1);
    expect(list.lastScroll).toBe(2600);
  });

  it('is completely inert while disabled — no save, no restore, no reset', () => {
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content, enabled: false });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(4200);
    expect(list.scrolls).toEqual([]);

    // Nothing was recorded either, which the enabled render proves by resetting
    // to the top instead of restoring 4200.
    harness.show({ list, content, enabled: true });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.scrolls).toEqual([0]);
  });

  it('is inert when the adapter cannot identify the screen', () => {
    const list = new FakeList();

    harness.show({ list, content: null });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(900);

    expect(list.scrolls).toEqual([]);
    expect(frames.pending).toBe(0);
  });

  it('ignores relayout noise the outgoing content emits under a new key', () => {
    // A list re-keyed to new data fires onScroll(0) as it settles. Recording
    // that against the incoming key would erase whatever the incoming key had
    // saved, so the binding stays deaf until the effect's own write lands.
    const list = new FakeList();
    const content = unseenContent();

    harness.show({ list, content, subKey: 'posts' });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(2400);

    harness.show({ list, content, subKey: 'media' });
    act(() => {
      frames.flushOneFrame();
    });
    harness.scroll(700);

    // Re-key back to 'posts'; the list settles at 0 BEFORE the restore frame.
    harness.show({ list, content, subKey: 'posts' });
    harness.scroll(0);
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.lastScroll).toBe(2400);

    // ...and the spurious 0 did not overwrite what 'media' had saved.
    harness.show({ list, content, subKey: 'media' });
    act(() => {
      frames.flushOneFrame();
    });
    expect(list.lastScroll).toBe(700);
  });

  describe('restorePending', () => {
    it('is true from the FIRST render until the deferred write lands', () => {
      // Native defers its write a frame so the incoming rows get their layout
      // pass, so there IS something to wait for — unlike web, that covers a
      // reset too, because that write is deferred as well.
      //
      // The first render is asserted specifically: the effect raises the flag
      // anyway, so reading only the latest binding would pass whether or not
      // the mount seed exists, and a caller hiding its list would still get one
      // painted frame at the wrong offset.
      const list = new FakeList();
      const seen: ScrollRestorationBinding[] = [];
      harness.show({
        list,
        content: unseenContent(),
        onBinding: (b) => seen.push(b),
      });
      expect(seen[0]?.restorePending).toBe(true);
      expect(harness.binding().restorePending).toBe(true);

      act(() => {
        frames.flushOneFrame();
      });
      expect(harness.binding().restorePending).toBe(false);
    });

    it('is true for a restore too, and false once the offset is applied', () => {
      const list = new FakeList();
      const content = unseenContent();
      harness.show({ list, content });
      act(() => {
        frames.flushOneFrame();
      });
      harness.scroll(2400);
      harness.unmountScreen();

      harness.show({ list, content });
      expect(harness.binding().restorePending).toBe(true);
      act(() => {
        frames.flushOneFrame();
      });
      expect(list.lastScroll).toBe(2400);
      expect(harness.binding().restorePending).toBe(false);
    });

    it('is false while disabled — there is no write coming', () => {
      const list = new FakeList();
      harness.show({ list, content: unseenContent(), enabled: false });
      expect(harness.binding().restorePending).toBe(false);
    });

    it('is false when the adapter cannot identify the screen', () => {
      const list = new FakeList();
      harness.show({ list, content: null });
      expect(harness.binding().restorePending).toBe(false);
    });
  });

  it('throws outside a provider, the same as on web', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      const list = new FakeList();
      function Bare(): ReactNode {
        const ref = useRef(list);
        useScrollRestoration(ref);
        return null;
      }
      expect(() => {
        act(() => {
          harness.root.render(createElement(Bare));
        });
      }).toThrow(
        /useScrollRestoration must be used within a <ScrollRestorationProvider>/,
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
