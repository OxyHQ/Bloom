import type { StyleProp, ViewStyle } from 'react-native';

export interface SettingsListItemProps {
  /** Icon element (e.g. SVG icon component) or Ionicons-style string */
  icon?: React.ReactNode;
  /** Primary label */
  title: string;
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
}

export interface SettingsListDividerProps {
  /** Inset from left edge to align with text (default: 52) */
  inset?: number;
}
