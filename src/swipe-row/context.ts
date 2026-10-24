import { createContext, type ComponentType, type ReactNode } from 'react';
import type { GestureType } from 'react-native-gesture-handler';

/**
 * Horizontal descendants keep ownership of their drag, including at either
 * edge. The row hands its scrollers the GATE that claims the drag (a native
 * gesture blocking the row's `pan`), so the gesture library is imported by the
 * row that needs it and not by every `ScrollArea` — which kept it out of every
 * web bundle that scrolls but never swipes (a menu panel, for one).
 */
export const SwipeRowScrollContext = createContext<{
  pan: GestureType;
  register: () => () => void;
  ScrollGate: ComponentType<{ children: ReactNode }>;
} | null>(null);
