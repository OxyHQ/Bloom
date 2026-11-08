/** @jest-environment jsdom */
import { act, useRef, type ComponentRef, type Ref } from 'react';
import { createRoot } from 'react-dom/client';
import type { View } from 'react-native';
import { useTrackEvents } from '../use-track-events';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

it('keeps listeners mounted while dispatching the latest callbacks and removes them on unmount', () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'),
    root = createRoot(container);
  const first = jest.fn(() => true),
    next = jest.fn(() => false),
    wheel = jest.fn();
  function Host({ onKey, onWheel }: { onKey: () => boolean; onWheel?: (delta: number) => void }) {
    const ref = useRef<ComponentRef<typeof View>>(null);
    useTrackEvents(ref, onWheel, onKey);
    return <div ref={ref as unknown as Ref<HTMLDivElement>} />;
  }
  act(() => root.render(<Host onKey={first} onWheel={wheel} />));
  const node = container.firstElementChild!;
  const added = jest.spyOn(node, 'addEventListener'),
    removed = jest.spyOn(node, 'removeEventListener');
  act(() => root.render(<Host onKey={next} onWheel={wheel} />));
  expect(added).not.toHaveBeenCalled();
  expect(removed).not.toHaveBeenCalled();
  const key = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
  node.dispatchEvent(key);
  expect(next).toHaveBeenCalledTimes(1);
  expect(first).not.toHaveBeenCalled();
  expect(key.defaultPrevented).toBe(false);
  node.dispatchEvent(new WheelEvent('wheel', { deltaX: 2, deltaMode: 1, cancelable: true }));
  expect(wheel).toHaveBeenCalledWith(32);
  act(() => root.render(<Host onKey={next} />));
  node.dispatchEvent(new WheelEvent('wheel', { deltaX: 10, cancelable: true }));
  expect(wheel).toHaveBeenCalledTimes(1);
  removed.mockClear();
  act(() => root.unmount());
  expect(removed).toHaveBeenCalledTimes(3);
});
