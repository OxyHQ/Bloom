import { createContext, type KeyboardEvent } from 'react';
import type { View } from 'react-native';

export interface RadioGroupContextValue {
  tabValue: string | undefined;
  register: (value: string, node: View | null) => void;
  onKeyDown: (value: string, event: KeyboardEvent<HTMLElement>) => void;
}
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
