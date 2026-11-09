/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 1440,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { View } from 'react-native';
import { createCanvasPanel } from '../canvas/CanvasPanelBase';
import { CanvasContext, createCanvasStore } from '../canvas/context';
import { registerModalOverlay } from '../overlay/modal-registry';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { SurfaceProps } from '../surface/types';
import type { ScrollAreaProps } from '../layout/types';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const Panel = createCanvasPanel(
  View as React.ComponentType<SurfaceProps>,
  View as React.ComponentType<ScrollAreaProps>,
);
it('renders adjustable semantics and keyboard transitions on real RNW nodes', () => {
  const store = createCanvasStore();
  store.frame({ x: 0, y: 0, width: 390, height: 844 }, { x: 0, y: 0, width: 390, height: 844 });
  const change = jest.fn();
  const handleRef = React.createRef<React.ComponentRef<typeof View>>();
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  act(() =>
    root.render(
      <BloomThemeProvider>
        <CanvasContext.Provider value={store}>
          <Panel
            handleRef={handleRef}
            snap="half"
            onSnapChange={change}
            accessibilityLabel="Places"
            scrollable={false}
          >
            <View />
          </Panel>
        </CanvasContext.Provider>
      </BloomThemeProvider>,
    ),
  );
  const handle = node.querySelector('[role="slider"]')!;
  expect(handleRef.current).toBe(handle);
  handleRef.current?.focus();
  expect(document.activeElement).toBe(handle);
  expect(handle.getAttribute('aria-label')).toBe('Places');
  expect(handle.getAttribute('aria-valuemin')).toBe('0');
  expect(handle.getAttribute('aria-valuemax')).toBe('2');
  expect(handle.getAttribute('aria-valuenow')).toBe('1');
  act(() =>
    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    ),
  );
  expect(change).toHaveBeenLastCalledWith('full');
  let release: () => void;
  act(() => {
    release = registerModalOverlay({});
  });
  act(() =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  expect(change).toHaveBeenCalledTimes(1);
  act(() => release!());
  act(() =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  expect(change).toHaveBeenLastCalledWith('peek');
  act(() => root.unmount());
  node.remove();
});
