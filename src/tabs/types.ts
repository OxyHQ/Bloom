import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type TabsVariant = 'underline' | 'filled' | 'outlined';

export interface TabsProps {
  /** The currently selected tab value. */
  value: string;
  /** Called when a tab is selected. */
  onValueChange: (value: string) => void;
  /** Visual variant for the tab bar. */
  variant?: TabsVariant;
  /** The tab items. Must be Tab components. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TabProps {
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

export interface TabPanelProps {
  /** The tab value this panel corresponds to. */
  value: string;
  /** Panel content. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
