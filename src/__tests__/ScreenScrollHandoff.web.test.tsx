/** @jest-environment jsdom */
import { act, createContext, useContext, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { ScrollRestorationProvider, useScrollRestoration } from '../scroll/index.web';
import { recordScrollOwnerHandoff, takeScrollOwnerHandoff } from '../scroll/owner-handoff';
import type { ScrollRouterAdapter } from '../scroll/types';
import {
  useScreenViewportBinding,
  createScreenViewportRestoration,
} from '../screen/use-screen-viewport';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const Content = createContext('post');
// Expo's focus adapter obtains its navigation object in a passive effect. A
// newly mounted restorer cannot run its focus effect until the next commit.
const delayedAdapter: ScrollRouterAdapter = {
  useScreenContentId: () => useContext(Content),
  useScreenFocusEffect(effect) {
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(true), []);
    useEffect(() => (ready ? effect() : undefined), [effect, ready]);
  },
};
const Restoration = createScreenViewportRestoration(useScrollRestoration);
let root: Root;
let container: HTMLDivElement;
let owner: HTMLDivElement;
let ownerRef: { current: HTMLDivElement };
let scrollY: number;
let frames: Map<number, FrameRequestCallback>;
const originalOS = Platform.OS;

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  scrollY = 0;
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 6000,
  });
  window.scrollTo = ((first: number | ScrollToOptions, y?: number) => {
    scrollY = typeof first === 'number' ? (y ?? 0) : (first.top ?? scrollY);
  }) as typeof window.scrollTo;
  frames = new Map();
  let nextFrame = 0;
  window.requestAnimationFrame = (callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    if (id != null) frames.delete(id);
  };
  container = document.createElement('div');
  owner = document.createElement('div');
  Object.defineProperties(owner, {
    scrollHeight: { configurable: true, value: 6000 },
    clientHeight: { configurable: true, value: 800 },
  });
  ownerRef = { current: owner };
  document.body.append(container, owner);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  owner.remove();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

function Owner({
  documentFlow,
  active = true,
  restore = true,
}: {
  documentFlow: boolean;
  active?: boolean;
  restore?: boolean;
}) {
  const screen = {
    active,
    scrollY: useSharedValue(0),
    collapseProgress: useSharedValue(0),
    collapseTarget: useSharedValue(0),
    activeScrollerId: useSharedValue<string | null>(null),
    topInset: 0,
    bottomInset: 0,
  };
  const viewport = useScreenViewportBinding(screen, true, documentFlow, 0, {
    active,
    scrollRef: ownerRef,
  });
  // The shell owns document restoration. The Screen sidecar mounts for the
  // first time only when this retained screen becomes an element scroller.
  return !documentFlow && restore ? (
    <Restoration target={ownerRef} active={active} restoring={viewport.restoring} />
  ) : null;
}
function show(documentFlow: boolean, options: { active?: boolean; restore?: boolean } = {}) {
  act(() =>
    root.render(
      <ScrollRestorationProvider adapter={delayedAdapter}>
        <Owner documentFlow={documentFlow} {...options} />
      </ScrollRestorationProvider>,
    ),
  );
}
function flushFrames() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(performance.now());
  });
}
function readDocumentAt(offset: number) {
  act(() => {
    window.scrollTo(0, offset);
    window.dispatchEvent(new Event('scroll'));
  });
}

it('keeps the reading offset when the incoming owner focus initializes after the passive phase', () => {
  show(true);
  readDocumentAt(200);
  show(false);
  flushFrames();
  expect(owner.scrollTop).toBe(200);
});

it('retains an unconsumed transfer through unrelated renders until restoration mounts', () => {
  show(true);
  readDocumentAt(200);
  show(false, { restore: false });
  show(false, { restore: false });
  show(false);
  flushFrames();
  expect(owner.scrollTop).toBe(200);
  expect(takeScrollOwnerHandoff(owner)).toBeUndefined();
});

it.each(['unmount', 'inactive', 'owner change'] as const)(
  'releases an unconsumed transfer on %s so a future route cannot inherit it',
  (departure) => {
    show(true);
    readDocumentAt(200);
    show(false, { restore: false });
    if (departure === 'unmount') act(() => root.render(null));
    else if (departure === 'inactive') show(false, { restore: false, active: false });
    else show(true, { restore: false });
    expect(takeScrollOwnerHandoff(owner)).toBeUndefined();
  },
);

it('does not let a departing screen release another screen transfer on the window', () => {
  const releaseFirst = recordScrollOwnerHandoff(window, 200);
  const releaseSecond = recordScrollOwnerHandoff(window, 400);
  releaseFirst();
  expect(takeScrollOwnerHandoff(window)).toBe(400);
  expect(takeScrollOwnerHandoff(window)).toBeUndefined();
  releaseSecond();
});

it('does not hand a recycled route the previous content offset on the same active owner', () => {
  function draw(content: string, documentFlow: boolean, restore: boolean) {
    act(() =>
      root.render(
        <ScrollRestorationProvider adapter={delayedAdapter}>
          <Content.Provider value={content}>
            <Owner documentFlow={documentFlow} restore={restore} />
          </Content.Provider>
        </ScrollRestorationProvider>,
      ),
    );
  }
  draw('post-a', true, false);
  readDocumentAt(200);
  draw('post-a', false, false);
  // Recycled route params can change without a blur or Screen remount. A later
  // restorer for the new content must reset rather than consume post-a's transfer.
  draw('post-b', false, true);
  flushFrames();
  expect(owner.scrollTop).toBe(0);
});

it('preserves user scrolling that happens before the deferred restorer mounts', () => {
  show(true);
  readDocumentAt(200);
  show(false, { restore: false });
  act(() => {
    owner.dispatchEvent(new Event('wheel'));
    owner.scrollTop = 300;
    owner.dispatchEvent(new Event('scroll'));
  });
  show(false);
  flushFrames();
  expect(owner.scrollTop).toBe(300);
});

it('keeps the transfer target through an unsolicited geometry clamp before focus', () => {
  show(true);
  readDocumentAt(200);
  show(false, { restore: false });
  act(() => {
    owner.scrollTop = 0;
    owner.dispatchEvent(new Event('scroll'));
  });
  show(false);
  flushFrames();
  expect(owner.scrollTop).toBe(200);
});
