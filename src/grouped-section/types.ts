import type { CollapsibleProps } from '../collapsible/types';
import type { ReactNode } from 'react';
import type { AccentTone } from '../theme/accent-colors';
import type { AccessibilityState, StyleProp, ViewStyle } from 'react-native';
import type { CardProps } from '../card/types';

export interface GroupedSectionItemProps {
  /** Icon element (e.g. SVG icon component) or Ionicons-style string */
  icon?: React.ReactNode;
  /** Primary label */
  title: string;
  /**
   * How many lines the title may take before it truncates. Default `1`.
   *
   * One line is right for a setting, whose title is a NOUN ("Language",
   * "Notifications") and whose value sits on the right. It is wrong for a row
   * whose title is the CONTENT — a postal address, a full file name — where
   * the tail that gets cut is the part that identifies it. `0` never
   * truncates.
   */
  titleNumberOfLines?: number;
  /** Secondary description text below title */
  description?: string;
  /**
   * Lines the description may take before it truncates. Defaults to `2`; `0`
   * never truncates (a help text or a policy that has to be read whole).
   */
  descriptionLines?: number;
  /** Right-side value text (e.g. "English", "On") */
  value?: string;
  /** Custom right-side element (toggle, badge, etc.) */
  rightElement?: React.ReactNode;
  /** Show trailing chevron (default: true when onPress is set) */
  showChevron?: boolean;
  /** Destructive action styling (red text) */
  destructive?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** State of the row. Disabled combines with the disabled prop. */
  accessibilityState?: AccessibilityState;
  /** Identifier on the interactive row (or static row when no handler is provided). */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Accessibility hint override */
  accessibilityHint?: string;
  /** Accessibility role override (defaults to button when pressable) */
  accessibilityRole?: 'button' | 'link' | 'none';
  /** Left inset to align text when no icon is provided */
  leftInset?: number;
}

export interface GroupedSectionProps {
  /** Outer corner radius of the clipped group. Defaults to radius-28. */
  radius?: CardProps['radius'];
  /** Space between rounded rows (default), legacy divider lines, or no separation. */
  separator?: 'space' | 'line' | 'none';
  /** Optional section header text */
  title?: string;
  /** Optional section footer text */
  footer?: string;
  /** Group items */
  children: React.ReactNode;
  /** Override group container style */
  style?: StyleProp<ViewStyle>;
  /** Explicit legacy fill override. Unset uses the same neutral material as Card/UsageCard. */
  variant?: GroupedSectionVariant;
}

/** The card surface a {@link GroupedSectionProps} paints. */
export type GroupedSectionVariant = 'plain' | 'filled';

export interface GroupedSectionDividerProps {
  /** Inset from left edge to align with text (default: 52) */
  inset?: number;
}

export interface GroupedSectionIconProps {
  /** Semantic filled color; default primary. */
  tone?: AccentTone;
  /** Optional explicit circle fill; the glyph uses this color darkened by 60%. */
  color?: string;
  /** Circle diameter in px; default 28. */
  size?: number;
  /** Glyph size passed to the renderer; default 16. */
  iconSize?: number;
  children: (props: { color: string; size: number }) => ReactNode;
  testID?: string;
}

/** Animated rows within a GroupedSection; keep mounted and toggle open. */
export type GroupedSectionCollapseProps = Pick<
  CollapsibleProps,
  'open' | 'children' | 'transition' | 'returnFocusRef' | 'testID'
>;
