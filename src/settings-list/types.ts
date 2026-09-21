import type { StyleProp, ViewStyle } from 'react-native';

export interface SettingsListItemProps {
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
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Accessibility hint override */
  accessibilityHint?: string;
  /** Accessibility role override (defaults to button when pressable) */
  accessibilityRole?: 'button' | 'link' | 'none';
  /** Left inset to align text when no icon is provided */
  leftInset?: number;
}

export interface SettingsListGroupProps {
  /** Optional section header text */
  title?: string;
  /** Optional section footer text */
  footer?: string;
  /** Group items */
  children: React.ReactNode;
  /** Override group container style */
  style?: StyleProp<ViewStyle>;
  /**
   * The surface the group's card paints, named after `Card`'s own variants.
   * `plain` is the `card` colour, which reads as a raised card on a page painted
   * in `background`; `filled` is `backgroundSecondary`.
   *
   * UNSET IS THE NORMAL CASE, and it is not one of these two. The group asks the
   * surrounding surface what colour it actually painted
   * (`styles/surface-levels.ts` `useSurfaceFill()`) and resolves off that: on the
   * page, `card`; on anything else, one ladder step off the real fill — a step
   * that cannot land on its own parent, whether that parent is a `ContentPanel`,
   * a menu or a container Bloom has never heard of. `./surface.ts` carries the
   * rule and the measurements behind it.
   *
   * Passing it per call site is what a whole app ends up repeating — and
   * forgetting once renders a group invisible, which is exactly the kind of
   * mistake a default can make impossible.
   *
   * Pass it only for a surface Bloom does not paint and so cannot publish a fill
   * for — your own coloured section — where it always wins over the ambient one.
   * If that container is yours and holds more than a settings list, publishing
   * the surface once is better than annotating everything inside it:
   * `<SurfaceLevelProvider level={1} fill={myColour}>` from
   * `@oxy.so/bloom/styles`.
   */
  variant?: SettingsListGroupVariant;
}

/** The card surface a {@link SettingsListGroupProps} paints. */
export type SettingsListGroupVariant = 'plain' | 'filled';

export interface SettingsListDividerProps {
  /** Inset from left edge to align with text (default: 52) */
  inset?: number;
}
