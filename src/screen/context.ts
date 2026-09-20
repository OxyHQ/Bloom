import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export interface ScreenContextValue {
  active: boolean;
  scrollY: SharedValue<number>;
  collapseProgress: SharedValue<number>;
  collapseTarget: SharedValue<number>;
  activeScrollerId: SharedValue<string | null>;
  topInset: number;
  bottomInset: number;
}

export type ScreenNavigationState = Pick<ScreenContextValue, 'collapseProgress' | 'collapseTarget' | 'activeScrollerId'> & { bottomInset?: number };
export const ScreenNavigationContext = createContext<ScreenNavigationState | null>(null);

export const ScreenContext = createContext<ScreenContextValue | null>(null);
export function useScreenContext() { return useContext(ScreenContext); }
export function useScreen(): ScreenContextValue {
  const screen = useScreenContext();
  if (!screen) throw new Error('Screen content must be rendered inside <Screen>.');
  return screen;
}
