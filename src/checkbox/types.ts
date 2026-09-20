import type { BloomSize } from '../appearance';
import type { BloomTone } from '../appearance';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type CheckboxSize = BloomSize;

export interface CheckboxProps {
  /** Whether the checkbox is checked. */
  checked: boolean;
  /** Called when the checked state changes. */
  onCheckedChange: (checked: boolean) => void;
  /** Optional label text. */
  label?: string;
  /** Optional description shown below the label. */
  description?: string;
  /** Size preset. */
  size?: CheckboxSize;
  /** Whether the checkbox is disabled. */
  disabled?: boolean;
  /** Whether the checkbox is in an indeterminate state. */
  indeterminate?: boolean;
  /** Semantic color when checked. Uses theme primary by default. */
  tone?: BloomTone;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export interface CheckboxCardProps {
  /** Whether the card's checkbox is checked. */
  checked: boolean;
  /** Called when the checked state changes. A press anywhere on the card toggles it. */
  onCheckedChange: (checked: boolean) => void;
  /** The card's title (one line); also its accessible name. */
  title: string;
  /** Optional one-line description under the title. */
  description?: string;
  /** Dims the whole card and stops it toggling. */
  disabled?: boolean;
  /** Whether the checkbox is in an indeterminate state. */
  indeterminate?: boolean;
  /** Accent for the checked box. Uses the theme primary by default. */
  tone?: BloomTone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}
