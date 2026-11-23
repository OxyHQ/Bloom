/**
 * @jest-environment jsdom
 */

/**
 * An open floating surface follows its trigger, and its own size, when either
 * changes size with nothing scrolling or resizing the window.
 *
 * A trigger's label can widen after the surface opened (its web font lands,
 * its text changes), and so can the surface's own content. The surface was
 * placed against the old boxes; listening only to `scroll` and `resize` left it
 * there, a pixel or more off its trigger (a popover beside a button moved
 * 1.36px between two renders of the same page, depending on which painted
 * first). Each one is watched with a `ResizeObserver` while the surface is open.
 *
 * jsdom has no layout and no `ResizeObserver`: the suite gives the trigger a box
 * it can widen, the panel an `offsetWidth` it can change, and an observer it
 * fires by hand for the element whose size changed.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';

import { PortalOutlet, PortalProvider } from '../portal';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { FloatingAlign, FloatingSide } from '../floating/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The trigger's right edge, moved by the tests to widen it. */
let triggerRight = 110;
/** The panel's laid-out width, changed by the tests. */
let panelWidth = 0;

/** Every observer made, with what it watches. */
const observers: { callback: () => void; targets: Element[]; live: boolean }[] = [];

class FakeResizeObserver {
  private readonly entry: (typeof observers)[number];
  constructor(callback: () => void) {
    this.entry = { callback, targets: [], live: true };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.push(target);
  }
  unobserve(target: Element) {
    this.entry.targets = this.entry.targets.filter((watched) => watched !== target);
  }
  disconnect() {
    this.entry.live = false;
    this.entry.targets = [];
  }
}

/** `element` changed size: each live observer watching it reports. */
function resized(element: Element) {
  act(() => {
    for (const observer of observers) {
      if (observer.live && observer.targets.includes(element)) observer.callback();
    }
  });
  frame();
}

function frame() {
  act(() => {
    jest.advanceTimersByTime(32);
  });
}

const realRect = Element.prototype.getBoundingClientRect;
const realResizeObserver = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  triggerRight = 110;
  panelWidth = 0;
  observers.length = 0;
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver;
  Element.prototype.getBoundingClientRect = function rect(this: Element): DOMRect {
    const right = this.closest('[data-testid="trigger"]') ? triggerRight : 110;
    return {
      top: 100,
      bottom: 120,
      left: 10,
      right,
      width: right - 10,
      height: 20,
      x: 10,
      y: 100,
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
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = realResizeObserver;
  jest.useRealTimers();
});

function open(side: FloatingSide, align: FloatingAlign): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <PortalProvider>
          <Popover defaultOpen>
            <PopoverTrigger testID="trigger">
              <Text>Open</Text>
            </PopoverTrigger>
            <PopoverContent label="Panel" testID="panel" side={side} align={align}>
              <Text>Body</Text>
            </PopoverContent>
          </Popover>
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
  });
  frame();
  const panel = document.querySelector('[data-testid="panel"]') as HTMLElement;
  Object.defineProperty(panel, 'offsetWidth', { configurable: true, get: () => panelWidth });
  return panel;
}

const trigger = () => document.querySelector('[data-testid="trigger"]') as HTMLElement;
const leftOf = (panel: HTMLElement) => Number.parseFloat(panel.style.left);

describe('an open popover', () => {
  it('moves with its trigger when the trigger widens after it opened', () => {
    const panel = open('right', 'start');
    const before = leftOf(panel);
    expect(Number.isFinite(before)).toBe(true);
    triggerRight = 140;
    resized(trigger());
    expect(leftOf(panel)).toBe(before + 30);
  });

  it('is placed again when its own width changes after it opened', () => {
    const panel = open('bottom', 'end');
    const before = leftOf(panel);
    expect(Number.isFinite(before)).toBe(true);
    panelWidth = 60;
    resized(panel);
    expect(leftOf(panel)).toBe(before - 60);
  });

  it('watches its trigger and itself while open, and neither once it is gone', () => {
    const panel = open('bottom', 'start');
    const watched = () =>
      observers.filter((observer) => observer.live).flatMap((observer) => observer.targets);
    expect(watched()).toEqual(expect.arrayContaining([trigger(), panel]));
    act(() => root.unmount());
    root = createRoot(container);
    expect(watched()).toEqual([]);
  });
});
