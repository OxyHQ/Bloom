/**
 * @jest-environment jsdom
 *
 * The nav drawer's edge swipe on the platform where `PanResponder` is not
 * `PanResponder` — react-native-web's responder system over real DOM events.
 *
 * `AiChatShellSwipe.test.tsx` pins the claim's arithmetic under the native
 * preset. Two things about it exist ONLY here, behind `IS_WEB`, and the native
 * suite cannot reach either:
 *
 * - **A mouse drag is never claimed.** react-native-web turns mouse events
 *   into fake touches (`createResponderEvent`), so without the check a drag
 *   from the left edge of a window narrower than `lg` would open the drawer
 *   and cancel whatever selection it started. The discriminator is the DOM
 *   event type the touch was made from.
 * - **The events arrive at all.** The gesture is spread onto the shell's root
 *   `View`; on web that means react-native-web registered the node with its
 *   ResponderSystem, which listens on `document`. This renders the real thing
 *   and dispatches real `touchstart`/`touchmove`/`touchend`, so a fork that
 *   silently stopped being wired up would fail here rather than in someone's
 *   browser.
 *
 * The window is made narrower than `lg` by way of `documentElement.clientWidth`,
 * which is what react-native-web's `Dimensions` measures.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  // Before the first `Dimensions.get`, which caches on first read.
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});

import { Text, View } from 'react-native';

import { AiChatShell } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(onNavOpenChange: (open: boolean) => void, navSwipeEnabled?: boolean) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AiChatShell
          testID="shell"
          sidebar={null}
          mobileSidebar={<Text>nav</Text>}
          navSwipeEnabled={navSwipeEnabled}
          onNavOpenChange={onNavOpenChange}>
          <View />
        </AiChatShell>
      </BloomThemeProvider>,
    );
  });
  const shell = container.querySelector('[data-testid="shell"]');
  if (!shell) throw new Error('the shell did not render');
  return shell as HTMLElement;
}

interface Point {
  x: number;
  y: number;
}

/** A DOM touch event carrying the fields react-native-web reads off it. */
function touch(target: HTMLElement, type: string, { x, y }: Point, up = false) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const point = {
    identifier: 1,
    target,
    force: 1,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
  };
  Object.assign(event, { changedTouches: [point], touches: up ? [] : [point] });
  act(() => {
    target.dispatchEvent(event);
  });
}

function mouse(target: HTMLElement, type: string, { x, y }: Point) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  // jsdom leaves `pageX`/`pageY` at 0, and they are what react-native-web reads
  // off a mouse event to build its fake touch — without them the drag would
  // measure zero travel and be rejected for the wrong reason.
  Object.defineProperty(event, 'pageX', { value: x });
  Object.defineProperty(event, 'pageY', { value: y });
  act(() => {
    target.dispatchEvent(event);
  });
}

/** Drag from `from` to `to` in steps, so the responder sees a moving finger. */
function drag(
  target: HTMLElement,
  kind: 'touch' | 'mouse',
  from: Point,
  to: Point,
  steps = 4,
) {
  const send = kind === 'touch' ? touch : (t: HTMLElement, type: string, p: Point) => mouse(t, type, p);
  send(target, kind === 'touch' ? 'touchstart' : 'mousedown', from);
  for (let step = 1; step <= steps; step += 1) {
    send(target, kind === 'touch' ? 'touchmove' : 'mousemove', {
      x: from.x + ((to.x - from.x) * step) / steps,
      y: from.y + ((to.y - from.y) * step) / steps,
    });
  }
  if (kind === 'touch') touch(target, 'touchend', to, true);
  else mouse(target, 'mouseup', to);
}

describe('AiChatShell nav swipe on web', () => {
  it('opens the drawer on a touch drag in from the left edge', () => {
    const onNavOpenChange = jest.fn();
    const shell = mount(onNavOpenChange);

    drag(shell, 'touch', { x: 6, y: 400 }, { x: 240, y: 404 });

    expect(onNavOpenChange).toHaveBeenCalledWith(true);
  });

  it('ignores a mouse drag along the same path, so a selection at the edge survives', () => {
    const onNavOpenChange = jest.fn();
    const shell = mount(onNavOpenChange);

    drag(shell, 'mouse', { x: 6, y: 400 }, { x: 240, y: 404 });

    expect(onNavOpenChange).not.toHaveBeenCalled();
  });

  it('ignores a touch drag that started away from the edge', () => {
    const onNavOpenChange = jest.fn();
    const shell = mount(onNavOpenChange);

    drag(shell, 'touch', { x: 300, y: 400 }, { x: 540, y: 404 });

    expect(onNavOpenChange).not.toHaveBeenCalled();
  });

  it('ignores every drag once navSwipeEnabled is false', () => {
    const onNavOpenChange = jest.fn();
    const shell = mount(onNavOpenChange, false);

    drag(shell, 'touch', { x: 6, y: 400 }, { x: 240, y: 404 });

    expect(onNavOpenChange).not.toHaveBeenCalled();
  });
});
