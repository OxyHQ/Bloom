import { createContext, useContext, type RefObject, type ReactNode } from 'react';
import type { AppColorName } from '../theme/color-presets';
import type { ScrollMetrics } from '../layout/scroll-metrics';
import type { SharedValue } from 'react-native-reanimated';

export interface ScreenContextValue {
  active: boolean;
  scrollY: SharedValue<number>;
  collapseProgress: SharedValue<number>;
  collapseTarget: SharedValue<number>;
  activeScrollerId: SharedValue<string | null>;
  /** Document-flow Screen has already reserved its content clearance. */
  contentInsetsHandled?: boolean;
  /** Web `documentScroll`: the window is this screen's scroller, so content stays in document flow. */
  documentScroll?: boolean;
  topInset: number;
  bottomInset: number;
}

export type ScreenNavigationState = Pick<
  ScreenContextValue,
  'collapseProgress' | 'collapseTarget' | 'activeScrollerId'
> & { bottomInset?: number };
export const ScreenNavigationContext = createContext<ScreenNavigationState | null>(null);

/** Only the Screen header slot owns chrome positioning; content headers remain independent. */
export const ScreenFooterContext = createContext<ScreenContextValue | null>(null);

export const ScreenHeaderContext = createContext<ScreenContextValue | null>(null);

export const ScreenContext = createContext<ScreenContextValue | null>(null);
export function useScreenContext() {
  return useContext(ScreenContext);
}
export function useScreen(): ScreenContextValue {
  const screen = useScreenContext();
  if (!screen) throw new Error('Screen content must be rendered inside <Screen>.');
  return screen;
}

export interface ScreenViewportValue {
  kind: 'document' | 'element' | 'native';
  scrollRef: RefObject<unknown> | null;
  metrics: ScrollMetrics;
  active: boolean;
  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
}
export const ScreenViewportContext = createContext<ScreenViewportValue | null>(null);
/** The screen's existing scroll owner; never creates another scroll container. */
export function useScreenViewport(): ScreenViewportValue | null {
  return useContext(ScreenViewportContext);
}
/** Host metadata, independent of the screen's declarative chrome. */
export interface ScreenHostValue {
  /** Overlays own independent screen state and must not restore the underlying route. */
  restoreScroll?: boolean;
  active: boolean;
  restoresDocument?: boolean;
  headerActions?: ReactNode;
  claimColorPreset?: (preset: AppColorName) => () => void;
  navigation?: { canGoBack: boolean; canGoForward: boolean; back(): void; forward(): void };
  kind?: ScreenViewportValue['kind'];
  scrollRef?: RefObject<unknown>;
  metrics?: ScrollMetrics;
}
export const ScreenHostContext = createContext<ScreenHostValue>({ active: true });
