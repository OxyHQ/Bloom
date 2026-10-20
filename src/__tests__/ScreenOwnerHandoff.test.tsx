/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useScreenViewportBinding } from '../screen/use-screen-viewport';
import type { ScreenContextValue } from '../screen/context';

const originalOS = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' }));
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }));

function setup(initialDocument = true) {
  const element = document.createElement('div');
  const scrollRef = { current: element };
  const value = (initial: unknown) => ({ value: initial });
  const screen = {
    active: true,
    scrollY: value(0),
    collapseProgress: value(0),
    collapseTarget: value(0),
    activeScrollerId: value(null),
  } as ScreenContextValue;
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });
  const writeWindow = jest.spyOn(window, 'scrollTo').mockImplementation(((
    options: ScrollToOptions | number,
  ) => {
    window.scrollY = typeof options === 'object' ? (options.top ?? 0) : 0;
  }) as typeof window.scrollTo);
  const hook = renderHook<
    ReturnType<typeof useScreenViewportBinding>,
    { documentFlow: boolean; active: boolean }
  >(
    ({ documentFlow, active }) =>
      useScreenViewportBinding({ ...screen, active }, true, documentFlow, 0, {
        active,
        scrollRef,
      }),
    { initialProps: { documentFlow: initialDocument, active: true } },
  );
  const scrollDocument = (offset: number) =>
    act(() => {
      window.scrollY = offset;
      window.dispatchEvent(new Event('scroll'));
    });
  const scrollElement = (offset: number) =>
    act(() => {
      element.scrollTop = offset;
      element.dispatchEvent(new Event('scroll'));
    });
  return { ...hook, element, writeWindow, scrollDocument, scrollElement };
}
afterEach(() => jest.restoreAllMocks());

it('transfers the last live offset through document/element changes even after browser clamping', () => {
  const tree = setup();
  tree.scrollDocument(250);
  // The newly bounded layout has already collapsed the outgoing document.
  window.scrollY = 0;
  tree.rerender({ documentFlow: false, active: true });
  expect(tree.element.scrollTop).toBe(250);
  tree.scrollElement(420);
  // Removing overflow can similarly clear the former element owner.
  tree.element.scrollTop = 0;
  tree.rerender({ documentFlow: true, active: true });
  expect(tree.writeWindow).toHaveBeenLastCalledWith({ top: 420, behavior: 'instant' });
  expect(window.scrollY).toBe(420);
  expect(tree.result.current.value.metrics.scrollY.value).toBe(420);
});

it('does not transfer offsets from inactive retained screens or reset on initial mount', () => {
  const tree = setup(false);
  expect(tree.writeWindow).not.toHaveBeenCalled();
  tree.scrollElement(300);
  tree.rerender({ documentFlow: false, active: false });
  tree.rerender({ documentFlow: true, active: false });
  tree.rerender({ documentFlow: true, active: true });
  expect(tree.writeWindow).not.toHaveBeenCalled();
});
