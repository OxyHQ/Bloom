import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export interface SubtleHoverProps {
  /**
   * JS-driven visibility for a coordinated highlight — e.g. every post of one
   * thread lighting up together. When omitted, the wash instead follows CSS
   * `group-hover` on web with ZERO React state: the parent element must carry
   * `className="group"`.
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
   * so the CSS `group-hover` mode is web-only; native only shows the wash in the
   * JS `active` mode, and only when this is set.
   */
  native?: boolean;
}
