import { forwardRef, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';

import type { RefComponent } from '../styles/native-refs';
import { StyledView } from '../styles/styled-primitives';
import { ACCEPTS_FIRST_MOUSE, WINDOW_DOUBLE_PRESS_MS } from './constants';
import type { WindowDragRegionProps } from './types';
import { useWindow } from './use-window';

/**
 * A window's empty chrome: a press here that no control inside takes starts a
 * move of the window, and a double press zooms it.
 *
 * It is a `View` (Bloom's `StyledView`, so a `className` styles it on every
 * platform, whether or not the application polyfills React Native) that asks for the press in the responder system's
 * BUBBLE phase (`onStartShouldSetResponder`), which asks the deepest view
 * first: any button, field or other pressable inside takes its own presses,
 * and only a press on the region itself (or on text and boxes that take
 * none) reaches it. It takes the press that activates an inactive window
 * (`ACCEPTS_FIRST_MOUSE`), so an inactive window moves in one gesture and
 * zooms on a double press, as a Mac's title bar does; a control inside decides
 * for itself. Without the `window` capability, while the window is full
 * screen, and while `disabled`, it is just the `View`.
 */
export const WindowDragRegion: RefComponent<WindowDragRegionProps> = forwardRef<
  ComponentRef<typeof View>,
  WindowDragRegionProps
>(function WindowDragRegion({ children, disabled = false, ...props }, ref) {
  const appWindow = useWindow();
  const lastPress = useRef<number | null>(null);
  if (!appWindow || appWindow.fullscreen || disabled)
    return (
      <StyledView ref={ref} {...props}>
        {children}
      </StyledView>
    );
  return (
    <StyledView
      ref={ref}
      {...props}
      {...ACCEPTS_FIRST_MOUSE}
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
    </StyledView>
  );
});

WindowDragRegion.displayName = 'WindowDragRegion';
