import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomIconComponent } from '../icons/icon-component';

/** An icon COMPONENT (`RiGroupLine`, not `<RiGroupLine />`) — the card sizes and colours it. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type StatCardsIcon = BloomIconComponent;

/**
 * Two looks:
 *
 * - `plain` — icon tile, label, value and a delta chip in a 132px card.
 * - `footer` — a gradient icon tile (plus an optional info tooltip), a
 *   display-size value, and an inner footer band with a caption and delta pill.
 */
export type StatCardsVariant = 'plain' | 'footer';

/** Tint of the `footer` variant's gradient icon tile. */
export type StatCardsTone = 'blue' | 'orange' | 'purple' | 'pink' | 'sky' | 'emerald';

/** Which way the delta reads: up (lime), down (rose) or flat (neutral). */
export type StatCardsDeltaColor = 'lime' | 'rose' | 'neutral';

export interface StatCardsItem {
  icon: StatCardsIcon;
  label: string;
  /** Pre-formatted value (`"14,592"`, `"$152,313.92"`). */
  value: string;
  /** Pre-formatted change (`"+5.3%"`). */
  delta: string;
  deltaColor: StatCardsDeltaColor;
  /** `footer` only: gradient tint of the icon tile. Defaults to `'blue'`. */
  tone?: StatCardsTone;
  /** `footer` only: comparison caption in the band. Defaults to `"From last month"`. */
  caption?: string;
  /** `footer` only: shows an info glyph with this text in a tooltip. */
  hint?: string;
  /** `footer` only: accessible name of the info glyph. Defaults to `` `About ${label}` ``. */
  hintLabel?: string;
  /**
   * `plain` only: a node at the top right, level with the icon tile — a
   * sparkline, a status dot. Decorative by default; give it its own name if it
   * carries information the label and value do not.
   */
  accessory?: ReactNode;
}

export interface StatCardProps {
  stat: StatCardsItem;
  /** Defaults to `'plain'`. */
  variant?: StatCardsVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface StatCardsProps {
  /** The KPI cards, in order. */
  stats: readonly StatCardsItem[];
  /** Defaults to `'plain'`. */
  variant?: StatCardsVariant;
  /** Render only the first `count` stats. */
  count?: number;
  /**
   * Columns at the widest breakpoint. The grid, by WINDOW width:
   *
   *   plain   2 columns, 4 from 1024px
   *   footer  1 column, 2 from 640px, 4 from 1280px
   *
   * `2` stops at two columns, `1` pins a single column at every width. Defaults to `4`.
   */
  columns?: 1 | 2 | 4;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
