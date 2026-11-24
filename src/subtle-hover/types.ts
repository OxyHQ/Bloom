import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export interface SubtleHoverProps {
  /**
   * JS-driven visibility for a coordinated highlight — e.g. every post of one
   * thread lighting up together. When omitted, the wash instead follows the
   * pointer over its hover group on web, with ZERO React state: the parent
   * element spreads `hoverGroupProps`.
   */
  active?: boolean;
  /**
   * The row's press, from `usePressHighlight()` (iOS): the wash lights while
   * the row is held, at the full fill, on the UI thread. Ignored on the web.
   */
  pressed?: SharedValue<number>;
  /** Extra style merged last — e.g. `borderRadius` to match the parent. */
  style?: StyleProp<ViewStyle>;
  /**
   * Render on native too (default `false`). Hover is a web pointer affordance,
   * so the hover-group mode is web-only; native only shows the wash in the
   * JS `active` mode, and only when this is set.
   */
  native?: boolean;
}
