import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface KbdProps {
  /** Key label, e.g. `⌘`, `K`, `Esc`, `Ctrl`. */
  children: React.ReactNode;
  /** Visual size. Defaults to `'md'`. */
  size?: 'sm' | 'md';
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  /** Text style override. */
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}
