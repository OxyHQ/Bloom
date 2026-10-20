import type { ComponentRef, ComponentType, RefAttributes } from 'react';
import type { ScrollView, ScrollViewProps, ViewProps } from 'react-native';

export interface ScreenKeyboardComponents {
  KeyboardAwareScrollView: ComponentType<
    ScrollViewProps &
      RefAttributes<ComponentRef<typeof ScrollView>> & {
        enabled?: boolean;
        bottomOffset?: number;
        extraKeyboardSpace?: number;
      }
  >;
  KeyboardStickyView: ComponentType<ViewProps & { enabled?: boolean }>;
}

let components: ScreenKeyboardComponents | undefined;

/** Resolve the optional native integration only when a Screen requests keyboard following. */
export function getScreenKeyboardComponents(): ScreenKeyboardComponents {
  if (components) return components;
  if (typeof require === 'function') {
    try {
      const keyboardController = require('react-native-keyboard-controller');
      if (keyboardController.KeyboardAwareScrollView && keyboardController.KeyboardStickyView) {
        const resolved: ScreenKeyboardComponents = keyboardController;
        components = resolved;
        return resolved;
      }
    } catch {
      // Report the requested integration rather than silently losing focused-input visibility.
    }
  }
  throw new Error(
    'Screen bottomBarKeyboardBehavior="follow" requires react-native-keyboard-controller and its KeyboardProvider.',
  );
}
