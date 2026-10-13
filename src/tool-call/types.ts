import type { ReactNode, Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

export type ToolCallStatus = 'running' | 'done' | 'error';
export type ToolCallSize = 'sm' | 'md' | 'lg';

export interface ToolCallProps {
  /** The tool's identifier, e.g. `web_search`. Titles the row when there is no `label`. */
  name: string;
  /** Human title, e.g. "Searching the web". */
  label?: string;
  status: ToolCallStatus;
  /** One-line argument or result summary under the title. */
  detail?: string;
  /** Shown instead of `detail` in the `error` state. */
  error?: string;
  /** How long the call took (or has taken), in milliseconds. */
  durationMs?: number;
  /** The tool's glyph. Defaults to a wrench. */
  icon?: BloomIconComponent;
  /**
   * Makes the whole row a button that opens the result, with a chevron. With
   * `children` as well, a press also toggles the inline body.
   */
  onPress?: () => void;
  /** An inline result body revealed under the row. Makes the row a disclosure. */
  children?: ReactNode;
  expanded?: boolean;
  /** Default `false`. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Default `'md'`. */
  size?: ToolCallSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
  testID?: string;
}

export interface ToolCallListProps {
  /** Names the list for assistive technology, e.g. "Tool calls". */
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
  testID?: string;
  children?: ReactNode;
}
