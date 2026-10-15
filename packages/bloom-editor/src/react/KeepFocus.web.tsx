import type { ReactNode } from 'react';
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
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
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
      <View style={style}>{children}</View>
    </div>
  );
}
