/**
 * @jest-environment jsdom
 */

/**
 * What an OPEN floating surface costs while the page scrolls.
 *
 * Every anchored surface listens to `scroll` in the capture phase, which is the
 * only listener that hears a scroll inside an ancestor. The cost is in the
 * cadence, and it is invisible to a prop-level test: a scroll gesture dispatches
 * a stream of events, and each one used to re-measure the trigger, hand the
 * panel a NEW anchor object, re-measure the panel, store a new placement and —
 * because the effect that read the anchor also owned the listeners — detach and
 * re-attach the pair. Roughly three renders and three forced layouts per event,
 * for every open hover card, popover, dropdown and select.
 *
 * So this suite measures the three properties that make it cheap, in a real DOM
 * with real react-native-web, against the real `getBoundingClientRect`:
 *
 *  1. **One measurement per FRAME**, not per event — counted on the element.
 *  2. **No commit when nothing moved** — counted with a `Profiler`, because a
 *     wasted state update produces an identical tree and is otherwise
 *     unobservable. The anchor's identity and the placement's identity are both
 *     in this number: either one changing schedules a commit.
 *  3. **The listeners are registered once**, across any number of scrolls AND
 *     any number of real moves.
 *
 * And, against all three, that the surface still FOLLOWS its anchor: the panel's
 * `top` tracks the trigger as the page scrolls, which is the behaviour the
 * cheapness must not buy.
 */
import React, { Profiler, useRef } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

// eslint-disable-next-line import/first
import { Text, type View } from 'react-native';

// eslint-disable-next-line import/first
import { useAnchorRect } from '../floating/use-anchor-rect';
// eslint-disable-next-line import/first
import type { FloatingAnchor } from '../floating/types';
// eslint-disable-next-line import/first
import { PortalOutlet, PortalProvider } from '../portal';
// eslint-disable-next-line import/first
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index.web';
// eslint-disable-next-line import/first
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Where the (single) measured box sits. Moved by the tests to fake a scroll. */
let boxTop = 100;
/** Every element `getBoundingClientRect` was called on, in order. */
let measured: Element[] = [];

const realRect = Element.prototype.getBoundingClientRect;

function measurements(node: Element | null): number {
  return node === null ? 0 : measured.filter((element) => element === node).length;
}

let container: HTMLDivElement;
let root: Root;
/** Commits of the profiled tree — `mount` and `update` phases both counted. */
let commits = 0;

beforeEach(() => {
  jest.useFakeTimers();
  boxTop = 100;
  measured = [];
  commits = 0;
  // jsdom reports a zero box for everything, which cannot move — so the suite
  // provides the one that can. Every element answers the same box; only the
  // trigger's is read for the anchor, and the panel's own extent is read from
  // `offsetWidth`/`offsetHeight` (0 here), which is what the panel's placement
  // arithmetic already falls back from.
  Element.prototype.getBoundingClientRect = function rect(this: Element): DOMRect {
    measured.push(this);
    return {
      top: boxTop,
      bottom: boxTop + 20,
      left: 10,
      right: 110,
      width: 100,
      height: 20,
      x: 10,
      y: boxTop,
      toJSON: () => ({}),
    } as DOMRect;
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  Element.prototype.getBoundingClientRect = realRect;
  jest.useRealTimers();
});

function onRender() {
  commits += 1;
}

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <Profiler id="floating" onRender={onRender}>
        {ui}
      </Profiler>,
    );
  });
}

/** One scroll event, from an element, so the capture listeners on `window` hear it. */
function scroll(times = 1) {
  act(() => {
    for (let i = 0; i < times; i += 1) {
      container.dispatchEvent(new Event('scroll'));
    }
  });
}

/** Let the frame the scroll scheduled its measurement on run. */
function frame() {
  act(() => {
    jest.advanceTimersByTime(32);
  });
}

// ---------------------------------------------------------------------------
//  The anchor
// ---------------------------------------------------------------------------

describe('useAnchorRect', () => {
  let anchors: Array<FloatingAnchor | null> = [];
  let node: HTMLDivElement | null = null;

  function Probe() {
    const ref = useRef<HTMLDivElement | null>(null);
    const anchor = useAnchorRect(ref as unknown as React.RefObject<View | null>, true);
    anchors.push(anchor);
    return (
      <div
        ref={(element) => {
          ref.current = element;
          node = element;
        }}
      />
    );
  }

  beforeEach(() => {
    anchors = [];
    node = null;
  });

  it('measures the trigger once per frame, however many scroll events arrive', () => {
    mount(<Probe />);
    // Opening measures synchronously, in a layout effect, so the surface's first
    // painted frame is already in place.
    expect(measurements(node)).toBe(1);
    expect(anchors[anchors.length - 1]).toEqual({ top: 100, bottom: 120, left: 10, right: 110 });

    scroll(6);
    // Nothing yet: the browser paints once per frame, so the only measurement
    // worth making is the last one before it does.
    expect(measurements(node)).toBe(1);
    frame();
    expect(measurements(node)).toBe(2);

    scroll(6);
    frame();
    expect(measurements(node)).toBe(3);
  });

  it('hands back the SAME box object while the trigger has not moved', () => {
    mount(<Probe />);
    const settled = anchors[anchors.length - 1];
    const renders = anchors.length;

    scroll(4);
    frame();

    // Identity, not equality: the anchor is the input to every surface's
    // placement, so a fresh object for an unmoved trigger is what re-resolves
    // the panel, re-measures it and re-runs its effects.
    expect(anchors[anchors.length - 1]).toBe(settled);
    expect(anchors.length).toBe(renders);
  });

  it('still follows the trigger when it really moves', () => {
    mount(<Probe />);
    const settled = anchors[anchors.length - 1];

    boxTop = 340;
    scroll();
    frame();

    expect(anchors[anchors.length - 1]).not.toBe(settled);
    expect(anchors[anchors.length - 1]).toEqual({ top: 340, bottom: 360, left: 10, right: 110 });
  });
});

// ---------------------------------------------------------------------------
//  The panel
// ---------------------------------------------------------------------------

describe('an open FloatingPanel', () => {
  /** Scroll listeners added to / removed from `window` while the suite runs. */
  let added = 0;
  let removed = 0;
  const realAdd = window.addEventListener;
  const realRemove = window.removeEventListener;

  beforeEach(() => {
    added = 0;
    removed = 0;
    window.addEventListener = function add(this: Window, type: string, ...rest: unknown[]) {
      if (type === 'scroll') added += 1;
      return (realAdd as (...args: unknown[]) => void).call(this, type, ...rest);
    } as typeof window.addEventListener;
    window.removeEventListener = function remove(this: Window, type: string, ...rest: unknown[]) {
      if (type === 'scroll') removed += 1;
      return (realRemove as (...args: unknown[]) => void).call(this, type, ...rest);
    } as typeof window.removeEventListener;
  });

  afterEach(() => {
    window.addEventListener = realAdd;
    window.removeEventListener = realRemove;
  });

  function open() {
    mount(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <PortalProvider>
          <Popover defaultOpen>
            <PopoverTrigger testID="trigger">
              <Text>Open</Text>
            </PopoverTrigger>
            <PopoverContent label="Panel" testID="panel">
              <Text>Body</Text>
            </PopoverContent>
          </Popover>
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    frame();
    commits = 0;
    return document.querySelector('[data-testid="panel"]') as HTMLElement;
  }

  it('places the panel against its trigger', () => {
    const panel = open();
    expect(panel).not.toBeNull();
    // `bottom` of the trigger (120) + the popover's 8px side offset.
    expect(panel.style.top).toBe('128px');
  });

  it('keeps following the trigger as the page scrolls', () => {
    const panel = open();

    boxTop = 400;
    scroll();
    frame();

    expect(panel.style.top).toBe('428px');
  });

  it('commits nothing at all for a scroll that moved nothing', () => {
    const panel = open();
    const before = measurements(panel);

    scroll(8);
    frame();

    // One pass, not eight: the panel's extent is read once per frame.
    expect(measurements(panel)).toBe(before + 1);
    // And it produced the placement the panel already had, so React was never
    // asked to render — neither for the anchor nor for the placement.
    expect(commits).toBe(0);
    expect(panel.style.top).toBe('128px');
  });

  it('registers its scroll listeners once, however far the page moves', () => {
    open();
    // One from `useAnchorRect` (the trigger) and one from the panel itself.
    const registered = added;
    expect(registered).toBe(2);
    const detached = removed;

    for (const top of [200, 260, 275]) {
      boxTop = top;
      scroll(3);
      frame();
    }

    // Three real moves, nine scroll events, and the pair is the same pair.
    expect(added).toBe(registered);
    expect(removed).toBe(detached);
  });
});
