import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type TabsVariant = 'underline' | 'filled' | 'outlined';

export interface TabsProps {
  /** The currently selected tab value. */
  value: string;
  /** Called when a tab is selected. */
  onValueChange: (value: string) => void;
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
  /** Whether this tab is disabled. */
  disabled?: boolean;
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
