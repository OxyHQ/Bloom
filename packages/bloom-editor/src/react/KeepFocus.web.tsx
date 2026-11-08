import { useCallback, useRef, type ReactNode } from 'react';
import type { EditorController } from './controller';
import { type StyleProp, View, type ViewStyle } from 'react-native';

/**
 * Controls that act on the text being edited. In a browser, pressing a button
 * moves focus to it — the editor loses its selection before the button runs —
 * so the press's default (`mousedown` focusing) is prevented, as every web
 * editor's toolbar does. Text fields inside still take focus.
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
    // biome-ignore lint/a11y/noStaticElementInteractions: not a control; it keeps the buttons inside from taking focus.
    <div
      role="presentation"
      style={{ display: 'contents' }}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest('input, textarea, [contenteditable="true"]')) event.preventDefault();
      }}
    >
      <View ref={attach} style={style}>
        {children}
      </View>
    </div>
  );
}
