import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';
import { ScreenContext, type ScreenContextValue } from '../screen/context';
import { useScreenScroll } from '../screen/use-screen-scroll';

it('publishes the activated scroller’s own offset, not the previous screen’s', () => {
  const value = (initial: unknown) => ({ value: initial });
  // Another screen of the same panel left the shared navigation scrolled and collapsed.
  const screen = {
    active: true,
    scrollY: value(5489),
    collapseProgress: value(1),
    collapseTarget: value(1),
    activeScrollerId: value(null),
  } as unknown as ScreenContextValue;
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(ScreenContext.Provider, { value: screen }, children);
  renderHook(() => useScreenScroll(), { wrapper });
  expect(screen.activeScrollerId.value).not.toBeNull();
  expect(screen.scrollY.value).toBe(0);
  expect(screen.collapseTarget.value).toBe(0);
});
