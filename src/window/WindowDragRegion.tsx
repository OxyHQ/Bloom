import { forwardRef, useRef, type ComponentRef } from 'react';
import { View } from 'react-native';

import type { RefComponent } from '../styles/native-refs';
import { WINDOW_DOUBLE_PRESS_MS } from './constants';
import type { WindowDragRegionProps } from './types';
import { useWindow } from './use-window';

/**
 * A window's empty chrome: a press here that no control inside takes starts a
 * move of the window, and a double press zooms it.
 *
 * It is a plain `View` that asks for the press in the responder system's
 * BUBBLE phase (`onStartShouldSetResponder`), which asks the deepest view
 * first: any button, field or other pressable inside takes its own presses,
 * and only a press on the region itself (or on text and boxes that take
 * none) reaches it. Without the `window` capability, and while the window is
 * full screen, it is just the `View`.
 */
export const WindowDragRegion: RefComponent<WindowDragRegionProps> = forwardRef<
  ComponentRef<typeof View>,
  WindowDragRegionProps
>(function WindowDragRegion({ children, ...props }, ref) {
  const appWindow = useWindow();
  const lastPress = useRef<number | null>(null);
  if (!appWindow || appWindow.fullscreen)
    return (
      <View ref={ref} {...props}>
        {children}
      </View>
    );
  return (
    <View
      ref={ref}
      {...props}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => true}
      onResponderGrant={() => {
        const now = Date.now();
        const previous = lastPress.current;
        if (previous !== null && now - previous <= WINDOW_DOUBLE_PRESS_MS) {
          lastPress.current = null;
          appWindow.zoom();
          return;
        }
        lastPress.current = now;
        appWindow.startMove();
      }}
    >
      {children}
    </View>
  );
});

WindowDragRegion.displayName = 'WindowDragRegion';
