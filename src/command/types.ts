import type { StyleProp, ViewStyle } from 'react-native';
import type { Props as IconProps } from '../icons/common';

export interface CommandItem {
  /** Stable id. */
  id: string;
  /** Primary label. */
  label: string;
  /** Secondary text shown beneath the label. */
  description?: string;
  /** Optional leading icon component (a Bloom icon). */
  icon?: React.ComponentType<IconProps>;
  /** Optional keywords that also match the query (not displayed). */
  keywords?: string[];
  /** Trailing shortcut hint (e.g. `'⌘K'`) — rendered as `Kbd`. */
  shortcut?: string;
  /** Group label this item belongs to. */
  group?: string;
  disabled?: boolean;
  /** Invoked on select. The palette closes afterward. */
  onSelect: () => void;
}

export interface CommandProps {
  /** Whether the palette is open (controlled). */
  visible: boolean;
  /** Close request (Escape, backdrop, after a selection). */
  onClose: () => void;
  /** Command items. */
  items: CommandItem[];
  /** Input placeholder. Defaults to `'Type a command or search…'`. */
  placeholder?: string;
  /** Shown when no items match. Defaults to `'No results found.'`. */
  emptyText?: string;
  /** Controlled query. When omitted the palette owns the query. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /**
   * Custom filter. Defaults to a case-insensitive substring match against
   * `label`, `description` and `keywords`.
   */
  filter?: (item: CommandItem, query: string) => boolean;
  /** Max height of the results list in px. Defaults to `360`. */
  maxListHeight?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
