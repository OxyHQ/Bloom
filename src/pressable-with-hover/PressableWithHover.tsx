import React, { forwardRef } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';

import { useInteractionState } from '../hooks/useInteractionState';

export interface PressableWithHoverProps extends Omit<PressableProps, 'style'> {
  /** Base style; `hoverStyle` is merged on top while the pointer is over it. */
  style?: StyleProp<ViewStyle>;
  /**
   * Style merged over `style` while hovered. Web-only: react-native-web fires
   * `onHoverIn`/`onHoverOut`, so on touch platforms this is simply never applied.
   */
  hoverStyle: StyleProp<ViewStyle>;
}

/**
 * A {@link Pressable} that merges `hoverStyle` on top of `style` while hovered.
 * Hover is a web-only affordance (native platforms have no pointer hover), so
 * this behaves like a plain `Pressable` on touch devices.
 */
export const PressableWithHover = forwardRef<View, PressableWithHoverProps>(
  function PressableWithHover({ style, hoverStyle, ...props }, ref) {
    const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();

    return (
      <Pressable
        {...props}
        ref={ref}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={hovered ? [style, hoverStyle] : style}
      />
    );
  },
);

PressableWithHover.displayName = 'PressableWithHover';
