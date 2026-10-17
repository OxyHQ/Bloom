import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type Direction = 'ltr' | 'rtl';
export interface DirectionProviderProps {
  locale: string;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}
