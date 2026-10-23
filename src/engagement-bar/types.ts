import type { ReactNode } from 'react';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  Insets,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';

/** The colour an action takes while `active`: any accent tone but the neutral one. */
export type EngagementTone = Exclude<AccentTone, 'default'>;

export interface EngagementBarProps {
  /** The leading actions, in reading order. */
  children: ReactNode;
  /** Actions pushed to the far edge of the row (save, translate, insights). */
  trailing?: ReactNode;
  /**
   * Formats every count in the bar. Defaults to Bloom's locale-aware compact
   * form (`12.5K` in English, `12,5 mil` in Spanish).
   */
  formatCount?: (count: number) => string;
  /** Locale for the default count format. Defaults to the nearest `LocaleProvider`. */
  locale?: string;
  /** A light impact on press and a medium one on long press. Defaults to `true`. */
  haptics?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface EngagementActionProps {
  /** The glyph at rest. */
  icon: BloomIconComponent;
  /** The glyph while `active` (a filled heart). Defaults to `icon`. */
  activeIcon?: BloomIconComponent;
  /** Required: the action is a glyph, so nothing else names it. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Drawn beside the glyph through the bar's `formatCount`; hidden when `0` or absent. */
  count?: number | null;
  /**
   * Whether the viewer has done this (liked, reposted, saved). Defined makes the
   * action a toggle: it paints in `tone` and announces its pressed state.
   */
  active?: boolean;
  /** The colour while `active`. Defaults to `primary`. */
  tone?: EngagementTone;
  /**
   * Return `false` to reject the press (the viewer must sign in first): no
   * haptic and no animation follow.
   */
  onPress?: () => unknown;
  onLongPress?: () => void;
  /** Screen-reader actions — the way to reach whatever `onLongPress` does. */
  accessibilityActions?: readonly AccessibilityActionInfo[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
  /** Pops the glyph with a ring when a press turns the action on. */
  popOnActivate?: boolean;
  /** Rolls the count to its new value when a press changes it. */
  rollCount?: boolean;
  /** Working: a spinner replaces the glyph and presses are ignored, without dimming. */
  busy?: boolean;
  disabled?: boolean;
  /** Defaults to 8 on every side. */
  hitSlop?: Insets | number;
  testID?: string;
}

export interface EngagementGroupProps {
  /** Adjacent actions that read as one control, such as an up/down vote. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
