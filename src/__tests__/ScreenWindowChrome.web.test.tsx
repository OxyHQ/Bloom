/** @jest-environment jsdom */
/**
 * A Screen's header as the window's title area, in react-native-web's REAL
 * responder system and markup: a press on the header's empty chrome or its
 * title moves the window, a button in it keeps its own press, and the bar
 * keeps the controls' room through its own CSS (the side inset is an
 * `!important` stylesheet rule, so the room is a custom property the
 * stylesheet reads, never an inline padding that would lose to it).
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Pressable, Text } from 'react-native';
import { PageHeader } from '../page-header';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { Screen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
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

function mountWindow(options: Parameters<typeof fakeWindow>[0], onPressIn = () => {}) {
  const { window, adapter } = fakeWindow(options);
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PlatformSurfaceProvider value={adapter}>
          <Screen
            testID="root"
            header={
              <PageHeader
                testID="bar"
                title="Notes"
                actions={
                  <Pressable testID="action" onPressIn={onPressIn}>
                    <Text>New</Text>
                  </Pressable>
                }
              />
            }
          >
            <Text testID="body">Body</Text>
          </Screen>
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
    ),
  );
  const node = (id: string) => {
    const found = container.querySelector(`[data-testid="${id}"]`);
    if (!found) throw new Error(`no ${id}`);
    return found as HTMLElement;
  };
  return { window, node };
}

it("the header's title moves the window; the content below does not", () => {
  const { window, node } = mountWindow({});
  mouse(node('bar-title'), 'mousedown');
  mouse(node('bar-title'), 'mouseup');
  expect(window.startMove).toHaveBeenCalledTimes(1);
  mouse(node('body'), 'mousedown');
  mouse(node('body'), 'mouseup');
  expect(window.startMove).toHaveBeenCalledTimes(1);
});

it('a button in the header keeps its own press', () => {
  const action = jest.fn();
  const { window, node } = mountWindow({}, action);
  jest.useFakeTimers();
  mouse(node('action'), 'mousedown');
  act(() => jest.advanceTimersByTime(60));
  mouse(node('action'), 'mouseup');
  jest.useRealTimers();
  expect(action).toHaveBeenCalledTimes(1);
  expect(window.startMove).not.toHaveBeenCalled();
});

it('the bar keeps the room through its stylesheet', () => {
  const { node } = mountWindow({});
  const bar = node('bar-bar');
  expect(bar.getAttribute('data-bloom-page-header-bar')).toBe('');
  expect(bar.getAttribute('data-bloom-page-header-window')).toBe('');
  expect(bar.style.getPropertyValue('--bloom-page-header-window-room')).toBe('88px');
  expect(node('root-window-controls')).toBeTruthy();
});

it('full screen: the header is not the chrome, and presses pass as before', () => {
  const { window, node } = mountWindow({ state: { fullscreen: true } });
  const bar = node('bar-bar');
  expect(bar.hasAttribute('data-bloom-page-header-window')).toBe(false);
  expect(bar.style.getPropertyValue('--bloom-page-header-window-room')).toBe('');
  mouse(node('bar-title'), 'mousedown');
  mouse(node('bar-title'), 'mouseup');
  expect(window.startMove).not.toHaveBeenCalled();
  expect(container.querySelector('[data-testid="root-window-controls"]')).toBeNull();
});
