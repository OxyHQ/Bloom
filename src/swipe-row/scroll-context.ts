import { createContext } from 'react';
import type { GestureType } from 'react-native-gesture-handler';

/** Horizontal descendants keep ownership of their drag, including at either edge. */
export const SwipeRowScrollContext = createContext<{
  pan: GestureType;
  register: () => () => void;
} | null>(null);
