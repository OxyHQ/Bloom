import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import type { ContributionCell } from '../chart-cards/contributions-cells';

/** One tile under the headline (`"9B"` over `"Lifetime tokens"`). */
export interface AiProfileCardStat {
  value: string;
  label: string;
}

/** A segment of the Activity switcher. */
export interface AiProfileCardPeriod {
  id: string;
  label: string;
}

export interface AiProfileCardProps {
  /** Display name, `title-2-medium`. */
  name: string;
  /** Handle beside the badge (`"@sitenley"`). */
  handle?: string;
  /** The neutral counter badge after the handle (`"PRO"`). */
  badge?: string;
  /** Cover photo across the top 165px. Without one the band is `background-tertiary`. */
  coverSource?: string | ImageSourcePropType | null;
  /**
   * Where the cover's crop sits, as fractions (`object-position`). Default
   * `{ x: 0.5, y: 0.45 }` — CSS `object-[50%_45%]`.
   */
  coverPosition?: { x: number; y: number };
  /** Avatar photo. Without one the 80px disc shows `initials`. */
  avatarSource?: string | ImageSourcePropType | null;
  /** Initials for the photo-less disc. Defaults to the first letter of `name`. */
  initials?: string;
  /**
   * Buttons pinned 20px under the cover's right edge (e.g. secondary small
   * `Share` / `Edit`).
   */
  actions?: ReactNode;

  /** Label over the headline. Default `"Contributions this year"`. */
  contributionsLabel?: string;
  /** The headline number; counts up from 0 on mount (1.6s). */
  contributions: number;
  /** Headline format. Default `$7,462`. */
  format?: (value: number) => string;
  /** Duration of the mount count-up, ms. Default 1600; 0 shows the number at once. */
  countUpDuration?: number;
  /** Chip beside the headline (`"+14.8%"`), status-purple. No chip when omitted. */
  delta?: string;
  /** The tiles: one row from 640px, two columns below. */
  stats?: readonly AiProfileCardStat[];

  /** Label over the heatmap. Default `"Activity"`. */
  activityLabel?: string;
  /** Segments of the plain switcher. Default Weekly / Monthly / Yearly. Empty hides it. */
  periods?: readonly AiProfileCardPeriod[];
  /** Controlled selected period id. */
  period?: string;
  /** Initial period when uncontrolled. Defaults to the first. */
  defaultPeriod?: string;
  onPeriodChange?: (id: string) => void;
  /** Heatmap cells, column-major (`columns × 7`). */
  cells: readonly ContributionCell[];
  /** Heatmap columns. Default 38. */
  columns?: number;
  /** Heatmap ramp base. Default violet-500 on the theme. */
  color?: string;
  /** Pop the heatmap cells in on mount. Default `true`. */
  animateIn?: boolean;
  activeCell?: number | null;
  onActiveCellChange?: (index: number | null) => void;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}
