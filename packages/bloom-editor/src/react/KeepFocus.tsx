import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

/**
 * Controls that act on the text being edited. Native: pressing a button does
 * not take the keyboard from the input, so this is a plain view.
 */
export function KeepFocus({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}
