/**
 * Bloom's shell and router families as named stand-ins, and the pager and the
 * router as values a test sets: what the router's hosts hand them is the
 * contract under test.
 */
import { createElement, type ReactNode } from 'react';

/** A host of that name that also draws the slots it is given, as the real one does. */
function slotted(name: string, slots: readonly string[]) {
  // biome-ignore lint/correctness/noComponentHookFactories: one stand-in per slotted component, at module scope
  return function Stand(props: Record<string, unknown>) {
    return createElement(name, props, ...slots.map((slot) => props[slot] as ReactNode));
  };
}

export const AppShell = slotted('AppShell', ['bottomBar', 'children']);
export const Screen = slotted('Screen', ['header', 'children', 'bottomBar']);
export const ScreenScrollView = 'ScreenScrollView';
export const Dialog = slotted('Dialog', ['children']);
export const BottomSheet = slotted('BottomSheet', ['children', 'footer']);
export const TabPagerLayout = 'TabPagerLayout';
export const TabPagerProvider = slotted('TabPagerProvider', ['children']);
export const Slot = 'Slot';

export function stackSceneLayout({ children }: { children: ReactNode }) {
  return createElement('StackScene', null, children);
}

interface Page {
  name: string;
  href: string;
  label?: string;
  icon?: unknown;
  activeIcon?: unknown;
  badge?: number;
  bar?: boolean;
}

export const pager = {
  pages: [] as Page[],
  activePage: null as string | null,
  progress: { value: 0 },
  chromeProgress: { value: 0 },
  selectTab: jest.fn(),
  leaveTab: jest.fn(),
  selectDestination: jest.fn(),
};

export function useTabPager() {
  return pager;
}

export const router = { push: jest.fn(), back: jest.fn() };

export function useRouter() {
  return router;
}

export { useScreenVisible } from './bloom-runtime';
