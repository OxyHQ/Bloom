import { useCallback, useRef, type ReactNode } from 'react';
import type { EditorController } from './controller';
import { type StyleProp, View, type ViewStyle } from 'react-native';

/**
 * Controls that act on the text being edited. Native: pressing a button does
 * not take the keyboard from the input, so this is a plain view.
 */
export function KeepFocus({
  children,
  style,
  owner,
}: {
  children: ReactNode;
  owner?: EditorController;
  style?: StyleProp<ViewStyle>;
}) {
  const previous = useRef<unknown>(null);
  const attach = useCallback(
    (node: unknown) => {
      if (previous.current) owner?.controlHosts.delete(previous.current);
      previous.current = node;
      if (node) owner?.controlHosts.add(node);
    },
    [owner],
  );
  return (
    <View ref={attach} style={style}>
      {children}
    </View>
  );
}
