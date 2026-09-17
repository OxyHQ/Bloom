/**
 * `HoverCard`'s own state, plus the one fact a child card needs to know.
 */
import { createContext, useContext, type RefObject } from 'react';
import type { View } from 'react-native';

export interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorRef: RefObject<View | null>;
  /** Open after the open delay (restarts nothing if already pending). */
  show: () => void;
  /** Close after the close delay. */
  hide: () => void;
  /** Cancel whatever is pending — the pointer arrived where it was headed. */
  hold: () => void;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);
HoverCardContext.displayName = 'BloomHoverCardContext';

export const HoverCardProvider = HoverCardContext.Provider;

export function useHoverCard(): HoverCardContextValue {
  const value = useContext(HoverCardContext);
  if (!value) {
    throw new Error('HoverCard parts must be rendered inside a <HoverCard>.');
  }
  return value;
}

/**
 * `true` inside a floating hover-card panel that ALREADY draws the surface
 * (border, background, shadow, inset) and runs the entrance. `UserHoverCard`
 * reads it to paint only its content, so the card never renders a surface
 * inside a surface.
 */
const HoverCardSurfaceContext = createContext(false);
HoverCardSurfaceContext.displayName = 'BloomHoverCardSurfaceContext';

export const HoverCardSurfaceProvider = HoverCardSurfaceContext.Provider;

export function useInsideHoverCardSurface(): boolean {
  return useContext(HoverCardSurfaceContext);
}
