/** @jest-environment jsdom */
/** Real RNW events: the AppShell adapter must not take gestures from text or scrollers.
 * The removed chat-specific responder's measured thresholds are archived in docs/ai-chat.mdx.
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
          onNavOpenChange={onNavOpenChange}
        >
          <View />
        </AiChatShell>
      </BloomThemeProvider>,
    );
  });
  const shell = container.querySelector('[data-testid="shell"]');
  if (!shell) throw new Error('the shell did not render');
  return shell as HTMLElement;
}

/**
 * The events' clock. The release reads the finger's velocity off `timeStamp`,
 * and jsdom stamps real time, so two events dispatched in the same millisecond
 * made the outcome depend on the machine. One frame (16ms) apart, always.
 */
let clock = 0;
const tick = (event: Event) => Object.defineProperty(event, 'timeStamp', { value: (clock += 16) });

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
  tick(event);
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
  tick(event);
  act(() => {
    target.dispatchEvent(event);
  });
}

/** Drag from `from` to `to` in steps, so the responder sees a moving finger. */
function drag(target: HTMLElement, kind: 'touch' | 'mouse', from: Point, to: Point, steps = 4) {
  const send =
    kind === 'touch' ? touch : (t: HTMLElement, type: string, p: Point) => mouse(t, type, p);
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
  it('leaves a touch drag at the edge with the existing scroll owner', () => {
    const onNavOpenChange = jest.fn();
    const shell = mount(onNavOpenChange);

    drag(shell, 'touch', { x: 6, y: 400 }, { x: 240, y: 404 });

    expect(onNavOpenChange).not.toHaveBeenCalled();
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
