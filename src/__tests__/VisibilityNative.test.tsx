import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Dimensions, Platform } from 'react-native';
import { ViewportProvider } from '../viewport/ViewportProvider';
import { useViewportBinding } from '../viewport/use-viewport-binding';
import { useInView } from '../viewport/use-in-view';
import { intersectionRatio, visibilityThreshold, type VisibilityRect } from '../viewport/geometry';
import type { VisibilityHandle, ViewportHandle } from '../viewport/types';

const screen = { x: 0, y: 0, width: 375, height: 800 };
function host(rect: VisibilityRect) {
  return {
    rect,
    measureInWindow: jest.fn((callback: Parameters<VisibilityHandle['measureInWindow']>[0]) => {
      callback(rect.x, rect.y, rect.width, rect.height);
    }),
  };
}
let observed: ReturnType<typeof useInView>;
let binding: ReturnType<typeof useViewportBinding>;
let resize: () => void;
let outerBinding: ReturnType<typeof useViewportBinding>;
const originalOS = Platform.OS;
const originalRAF = global.requestAnimationFrame;
const originalCancelRAF = global.cancelAnimationFrame;
beforeEach(() => {
  jest.useFakeTimers();
  Platform.OS = 'ios';
  const addListener = Dimensions.addEventListener;
  jest.spyOn(Dimensions, 'addEventListener').mockImplementation((_event, listener) => {
    resize = () => listener({ window: Dimensions.get('window'), screen: Dimensions.get('screen') });
    return addListener(_event, listener);
  });
  global.requestAnimationFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16) as unknown as number;
  global.cancelAnimationFrame = (id) => clearTimeout(id);
});
afterEach(() => {
  Platform.OS = originalOS;
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCancelRAF;
  jest.restoreAllMocks();
  jest.useRealTimers();
});
function Target({ once = false }: { once?: boolean }) {
  observed = useInView({ threshold: 1, once });
  return null;
}
function Bound({
  viewport,
  children,
  outer = false,
}: {
  viewport: ViewportHandle;
  children?: React.ReactNode;
  outer?: boolean;
}) {
  const viewportRef = React.useRef(viewport);
  const result = useViewportBinding({ viewportRef });
  if (outer) outerBinding = result;
  else binding = result;
  return <>{children}</>;
}
const frame = () => act(() => jest.advanceTimersByTime(20));
const scroll = () => act(() => binding.onScroll({ nativeEvent: {} } as never));
function setup({ once = false, nested = false, root = false } = {}) {
  const viewport = host({ ...screen });
  const outer = host({ ...screen, height: 100 });
  const target = host({ x: 10, y: 780, width: 200, height: 40 });
  const content = (
    <ViewportProvider root={root}>
      <Bound viewport={{ getNativeScrollRef: () => viewport }}>
        <Target once={once} />
      </Bound>
    </ViewportProvider>
  );
  const view = render(
    nested ? (
      <ViewportProvider>
        <Bound outer viewport={outer}>
          {content}
        </Bound>
      </ViewportProvider>
    ) : (
      content
    ),
  );
  act(() => observed.targetProps.ref(target));
  frame();
  return { ...view, target, viewport, outer };
}
it('measures full visibility on scroll/layout/resize and does no idle polling', () => {
  const { target } = setup();
  expect(observed.inView).toBe(false);
  expect(observed.targetProps.collapsable).toBe(false);
  target.rect.y = 740;
  scroll();
  scroll();
  scroll();
  frame();
  expect(observed.inView).toBe(true);
  frame();
  const reads = target.measureInWindow.mock.calls.length;
  act(() => jest.advanceTimersByTime(10000));
  expect(target.measureInWindow).toHaveBeenCalledTimes(reads);
  target.rect.x = -5;
  act(() => observed.targetProps.onLayout());
  frame();
  expect(observed.inView).toBe(false);
  target.rect.x = 10;
  act(() => binding.onContentSizeChange(375, 1200));
  frame();
  expect(observed.inView).toBe(true);
  target.rect.y = 900;
  act(() => resize());
  frame();
  expect(observed.inView).toBe(false);
});
it('once stops measuring after entering and does not hide on a later scroll', () => {
  const { target } = setup({ once: true });
  target.rect.y = 20;
  scroll();
  frame();
  expect(observed.inView).toBe(true);
  const reads = target.measureInWindow.mock.calls.length;
  target.rect.y = 1000;
  scroll();
  frame();
  expect(observed.inView).toBe(true);
  expect(target.measureInWindow).toHaveBeenCalledTimes(reads);
});
it('intersects nested viewport clips and follows ancestor scrolling', () => {
  const { target, outer } = setup({ nested: true });
  target.rect.y = 200;
  scroll();
  frame();
  expect(observed.inView).toBe(false);
  outer.rect.height = 400;
  act(() => outerBinding.onLayout({ nativeEvent: { layout: outer.rect } } as never));
  frame();
  expect(observed.inView).toBe(true);
});
it('root separates a portaled viewport from the page clip', () => {
  const { target } = setup({ nested: true, root: true });
  target.rect.y = 200;
  scroll();
  frame();
  expect(observed.inView).toBe(true);
});
it('never infers visibility from mount or an unbound viewport', () => {
  const target = host({ x: 0, y: 0, width: 10, height: 10 });
  render(
    <ViewportProvider>
      <Target />
    </ViewportProvider>,
  );
  expect(observed.inView).toBe(false);
  act(() => observed.targetProps.ref(target));
  frame();
  expect(observed.inView).toBe(false);
});
it('validates thresholds and refuses empty/unmeasured geometry', () => {
  expect(() => visibilityThreshold(2)).toThrow();
  expect(intersectionRatio({ ...screen, width: 0 }, [screen])).toBe(0);
  expect(intersectionRatio(screen, [{ ...screen, height: 400 }])).toBe(0.5);
});

it('discards asynchronous measurements from an older scroll event', () => {
  const { target } = setup();
  const callbacks: Array<Parameters<VisibilityHandle['measureInWindow']>[0]> = [];
  target.measureInWindow.mockImplementation((callback) => {
    callbacks.push(callback);
  });
  scroll();
  frame();
  scroll();
  frame();
  expect(callbacks).toHaveLength(2);
  act(() => callbacks[0]!(0, 0, 100, 40));
  expect(observed.inView).toBe(false);
  act(() => callbacks[1]!(0, 20, 100, 40));
  expect(observed.inView).toBe(true);
});
it('composes the original scrolling and layout callbacks once', () => {
  const onScroll = jest.fn(),
    onLayout = jest.fn(),
    onContentSizeChange = jest.fn();
  function Owner() {
    const viewportRef = React.useRef(host(screen));
    binding = useViewportBinding({ viewportRef, onScroll, onLayout, onContentSizeChange });
    return null;
  }
  render(
    <ViewportProvider>
      <Owner />
    </ViewportProvider>,
  );
  const event = { nativeEvent: {} } as never;
  act(() => {
    binding.onScroll(event);
    binding.onLayout(event);
    binding.onContentSizeChange(100, 200);
  });
  expect(onScroll.mock.calls).toEqual([[event]]);
  expect(onLayout.mock.calls).toEqual([[event]]);
  expect(onContentSizeChange.mock.calls).toEqual([[100, 200]]);
});
