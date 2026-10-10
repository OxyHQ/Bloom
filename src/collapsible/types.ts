import type { ReactNode, RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SurfaceTransition } from '../motion/types';

/** A DOM or native host capable of receiving focus, without a fabricated trigger. */
export interface CollapsibleFocusTarget {
  focus(options?: { preventScroll?: boolean }): void;
}
export interface CollapsibleProps {
  open: boolean;
  children?: ReactNode;
  /** Defaults to 300ms CSS ease-in-out. Live reduced motion settles immediately. */
  transition?: SurfaceTransition;
  /** Used only if focus was inside when closing; never steals deliberate outside focus. */
  returnFocusRef?: RefObject<CollapsibleFocusTarget | null>;
  className?: string;
  style?: StyleProp<ViewStyle>;
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  nativeID?: string;
  testID?: string;
}
