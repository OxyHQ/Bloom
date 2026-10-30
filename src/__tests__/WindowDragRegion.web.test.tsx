/** @jest-environment jsdom */
/**
 * `WindowDragRegion` in react-native-web's REAL responder system: a press is
 * offered to the deepest view first (the bubble phase of
 * `onStartShouldSetResponder`), so a pressable inside the region takes its own
 * press and only a press on the region's empty chrome moves the window.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Pressable, Text, View } from 'react-native';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { WindowDragRegion } from '../window/WindowDragRegion';
import { fakeWindow } from './support/fake-window';

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

function mouse(target: Element, type: 'mousedown' | 'mouseup') {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 });
  act(() => {
    target.dispatchEvent(event);
  });
}

function press(target: Element) {
  mouse(target, 'mousedown');
  mouse(target, 'mouseup');
}

function mountRegion(onPressIn: () => void) {
  const { window, adapter } = fakeWindow();
  act(() =>
    root.render(
      <PlatformSurfaceProvider value={adapter}>
        <WindowDragRegion testID="drag" style={{ height: 40, flexDirection: 'row' }}>
          <Text testID="title">Inbox</Text>
          <Pressable testID="action" onPressIn={onPressIn}>
            <View testID="action-icon" />
          </Pressable>
        </WindowDragRegion>
      </PlatformSurfaceProvider>,
    ),
  );
  const node = (id: string) => {
    const found = container.querySelector(`[data-testid="${id}"]`);
    if (!found) throw new Error(`no ${id}`);
    return found;
  };
  return { window, node };
}

it('moves the window from its empty chrome, and from text that takes no press', () => {
  const { window, node } = mountRegion(() => {});
  // `Date.now()` is real here: the two presses are well inside the interval.
  press(node('drag'));
  expect(window.startMove).toHaveBeenCalledTimes(1);
  press(node('title'));
  // The second press came straight after the first: a double press zooms.
  expect(window.zoom).toHaveBeenCalledTimes(1);
  expect(window.startMove).toHaveBeenCalledTimes(1);
});

it('leaves a press to a pressable inside it', () => {
  const action = jest.fn();
  const { window, node } = mountRegion(action);
  jest.useFakeTimers();
  mouse(node('action-icon'), 'mousedown');
  // react-native-web's press-in follows the grant by 50 ms.
  act(() => jest.advanceTimersByTime(60));
  mouse(node('action-icon'), 'mouseup');
  jest.useRealTimers();
  // The pressable took the press (it is the responder), so the region never did.
  expect(action).toHaveBeenCalledTimes(1);
  expect(window.startMove).not.toHaveBeenCalled();
  expect(window.zoom).not.toHaveBeenCalled();
});
