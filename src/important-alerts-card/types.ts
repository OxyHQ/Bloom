import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** An icon COMPONENT (`RiHeartPulseFill`, not an element) — the row sizes it and paints it white. */
export type ImportantAlertsCardIcon = ComponentType<{ width?: number; height?: number; fill?: string }>;

/**
 * The icon circle's tint: `rose` is `rose-600`, `amber` `amber-400`,
 * `emerald` `emerald-500`, `blue` `blue-400`, `purple` `purple-400`, `teal`
 * `teal-400` — each resolved from the theme (see
 * `docs/important-alerts-card.mdx`).
 */
export type ImportantAlertsCardTone = 'rose' | 'amber' | 'emerald' | 'blue' | 'purple' | 'teal';

export interface ImportantAlertsCardAlert {
  icon: ImportantAlertsCardIcon;
  /** Icon circle tint. Ignored when `iconBackground` is set. */
  tone?: ImportantAlertsCardTone;
  /** An explicit icon circle colour (opaque). Wins over `tone`. */
  iconBackground?: string;
  title: string;
  description: string;
  /** Pre-formatted date for the corner pill (`"June, 12"`). */
  date: string;
  /** Stable key. Defaults to title + index. */
  id?: string;
}

export interface ImportantAlertsCardProps {
  /** The feed, newest first. It scrolls inside the card. */
  alerts: readonly ImportantAlertsCardAlert[];
  /**
   * The headline number — the total for the period, which can be higher than
   * `alerts.length` when the feed lists only the most recent ones.
   */
  count: number | string;
  /** Card title. Defaults to `"Important alerts"`. */
  title?: string;
  /** Caption after the count. Defaults to `"this week"`. */
  countCaption?: string;
  /** Label of the range pill in the corner (`"29 Jun - 5 Jul"`). Omit to hide the pill. */
  rangeLabel?: string;
  /** Card height. Defaults to `330`. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
