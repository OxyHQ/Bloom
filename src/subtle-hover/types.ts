import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

export interface SubtleHoverProps {
  /**
   * JS-driven visibility for a coordinated highlight — e.g. every post of one
   * thread lighting up together. When omitted, the wash instead follows CSS
   * `group-hover` on web with ZERO React state: the parent element must carry
   * `className="group"`.
   */
  active?: boolean;
  /** Extra style merged last — e.g. `borderRadius` to match the parent. */
  style?: StyleProp<ViewStyle>;
  /**
   * Render on native too (default `false`). Hover is a web pointer affordance,
   * so the CSS `group-hover` mode is web-only; native only shows the wash in the
   * JS `active` mode, and only when this is set.
   */
  native?: boolean;
}
