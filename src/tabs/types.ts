import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type TabsVariant = 'underline' | 'filled' | 'outlined';

export interface TabsProps {
  /**
   * The currently selected tab value — the CONTROLLED path, where the bar owns
   * the underline and reports presses through {@link TabsProps.onValueChange}.
   *
   * OMIT it for the focus-driven path, where each trigger supplies its own
   * {@link TabsTriggerProps.isFocused} and performs its own navigation. That is
   * how `@oxyhq/bloom/tabs/expo-router` keeps the underline correct through
   * deep links, browser Back and back gestures — none of which pass through a
   * press handler. Providing both would put two writers on one shared value.
   */
  value?: string;
  /** Called when a tab is selected. Controlled path only. */
  onValueChange?: (value: string) => void;
  /**
   * Focus-driven path only: whether ANY trigger is currently focused.
   *
   * `false` fades the underline out where it stands. This is not the same as
   * "the selection moved", and it is not hypothetical: a strip rendered by a
   * LAYOUT keeps rendering while the layout's other, non-tab children are
   * showing — a profile's `/followers` sits beside its tab routes under one
   * layout — and without this the underline stays parked on whichever tab was
   * last visited, asserting a selection that is not there.
   *
   * Fading is the whole response; the underline is deliberately NOT moved,
   * because there is no position that means "nowhere" and travelling to a
   * sentinel would drag it across every tab on the way out.
   *
   * `RouterTabs` sets it, so an app author never passes it by hand. Defaults to
   * `true`, which is correct for the controlled path (a `value` naming no
   * trigger simply leaves the underline where it was, as it always has).
   */
  hasSelection?: boolean;
  /** Visual variant for the tab bar. */
  variant?: TabsVariant;
  /**
   * When true, the tab bar spans the full container width and each trigger
   * takes an equal share of it (edge to edge), instead of the default
   * content-sized, horizontally scrollable layout. Best for a small, fixed
   * set of tabs (e.g. 2–3). Defaults to `false`.
   */
  fullWidth?: boolean;
  /** The tab items. Must be TabsTrigger components. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TabsTriggerProps {
  /** Unique value identifying this tab. */
  value: string;
  /** Tab label text. */
  label: string;
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
  /**
   * Optional tally rendered as a small muted number beside the label. Omitted
   * (or `0`) renders nothing. The underline tracks the trigger's measured
   * width, so a count never changes where it sits.
   */
  count?: number;
  /**
   * Whether the ROUTER considers this tab focused — the focus-driven path.
   * Supplying it makes this trigger, not the bar, the writer of the shared
   * underline, and suppresses {@link TabsProps.onValueChange} on press because
   * navigation is then the caller's job. Leave it `undefined` on the controlled
   * path.
   */
  isFocused?: boolean;
  /** Whether this tab is disabled. */
  disabled?: boolean;
  /** Extra press handler. Runs on both paths, before any selection is reported. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface TabsContentProps {
  /** The tab value this panel corresponds to. */
  value: string;
  /** Panel content. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
