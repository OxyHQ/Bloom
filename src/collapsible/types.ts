import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface CollapsibleProps {
  /** Header title text */
  title: string;
  /** Content to show/hide */
  children: ReactNode;
  /** Whether to start open (defaults to false) */
  defaultOpen?: boolean;
  /** Custom chevron icon (defaults to "›" character with rotation) */
  chevronIcon?: ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Title text style */
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}
