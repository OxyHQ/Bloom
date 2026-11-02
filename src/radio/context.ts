import { type ComponentRef, createContext, type KeyboardEvent } from 'react';
import type { View } from 'react-native';
import type { NativeRovingItemProps } from '../hooks/use-native-roving-group';

export interface RadioGroupContextValue {
  tabValue: string | undefined;
  register: (value: string, node: ComponentRef<typeof View> | null) => void;
  onKeyDown: (value: string, event: KeyboardEvent<HTMLElement>) => void;
  /** An option's keyboard props on a native host (`hooks/use-native-roving-group.ts`). */
  rovingItem: (value: string, disabled: boolean) => NativeRovingItemProps;
}
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
