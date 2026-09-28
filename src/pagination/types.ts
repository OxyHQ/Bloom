import type { StyleProp, ViewStyle } from 'react-native';

export interface PaginationProps {
  /** The current page, 1-based. Controlled. */
  page: number;
  /** Total number of pages. Renders nothing when 1 or fewer. */
  totalPages: number;
  /** Called with the requested page. */
  onChange: (page: number) => void;
  /** Page numbers shown on each side of the current page. Default 1 (0 when compact). */
  siblingCount?: number;
  /** Label of the Previous button, and its accessible name when compact; `"Previous"` in English. */
  previousLabel?: string;
  /** Label of the Next button, and its accessible name when compact; `"Next"` in English. */
  nextLabel?: string;
  /** Accessible name of a page button; `` `Go to page ${page}` `` in English. */
  getPageLabel?: (page: number) => string;
  /** Names the navigation landmark; `"Pagination"` in English. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
