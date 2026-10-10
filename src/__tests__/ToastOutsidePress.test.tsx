/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: (props: object) => {
    const { View } = jest.requireActual('react-native-web');
    return React.createElement(View, props);
  },
}));

import { ToastHost } from '../toast/ToastHost';
import { toastStore } from '../toast/toast-store';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('web toast outside presses', () => {
  it('collapses without cancelling the original press, excludes rows, and removes its listener', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const onOutside = jest.fn();
    act(() =>
      root.render(
        <>
          <button onPointerDown={onOutside}>Background</button>
          <ToastHost>
            <button>Toast action</button>
          </ToastHost>
        </>,
      ),
    );
    const outside = container.querySelector('button')!;
    const inside = document.querySelector('[data-bloom-toast-host] button')!;
    expect(inside).not.toBeNull();
    act(() => toastStore.expand());
    act(() =>
      inside.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      ),
    );
    expect(toastStore.getSnapshot().isExpanded).toBe(true);
    act(() =>
      outside.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 2 }),
      ),
    );
    expect(toastStore.getSnapshot().isExpanded).toBe(true);
    const event = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => outside.dispatchEvent(event));
    expect(toastStore.getSnapshot().isExpanded).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(onOutside).toHaveBeenCalledTimes(2);
    act(() => root.unmount());
    act(() => toastStore.expand());
    document.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    expect(toastStore.getSnapshot().isExpanded).toBe(true);
    act(() => toastStore.collapse());
    container.remove();
  });
});
