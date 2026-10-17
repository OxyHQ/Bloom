import type { ReactNode } from 'react';
import type { CardProps } from '../card/types';
import type { StyleProp, ViewStyle } from 'react-native';

/** One counted or deferred bucket of usage. */
export interface UsageSegment {
  label: string;
  /** Amount the bucket holds, in the same units as max. */
  value: number;
  /**
   * Any colour. Defaults to the card's chart palette by index — a hue
   * order, re-tinted around the theme's `primary` (primary first).
   */
  color?: string;
  /** Listed in the breakdown, but neither drawn in the bar nor counted as used. */
  deferred?: boolean;
}

/** A collapsible breakdown row (MCP tools, memory files…) listing its members. */
export interface UsageGroup {
  label: string;
  value: number;
  items: ReadonlyArray<{ label: string; value: number }>;
}

/** The usage section: a stacked usage bar with an expandable breakdown. */
export interface UsageData {
  /** Total capacity in the same units as segment values. */
  max: number;
  segments: ReadonlyArray<UsageSegment>;
  groups?: ReadonlyArray<UsageGroup>;
}

/** One rolling plan limit. */
export interface UsageLimit {
  label: string;
  /** 0–1 share of the limit already used. Clamped. */
  used: number;
  /** "Resets in 2 hr 46 min", "Resets Tue 3:00 PM"… */
  resets: string;
}

/** The card's fixed strings, localised via `BloomProvider locale`; each key here wins. */
export interface UsageCardLabels {
  /** `'Usage'` in English. */
  usage?: string;
  /** `'Free space'` in English. */
  freeSpace?: string;
  /** `'Plan usage limits'` in English. `plan` is appended as `· <plan>`. */
  planUsageLimits?: string;
  /** Names the plan arrow button. `'Manage plan'` in English. */
  managePlan?: string;
}

export interface UsageCardProps {
  /** Outer radius; defaults to radius-28. */
  radius?: CardProps['radius'];
  /** Usage section heading. Overrides labels.usage. */
  title?: string;
  /** Content shown when usage is unavailable; no meter or fabricated zero is rendered. */
  fallback?: ReactNode;
  /** Actions or supporting content below the usage and plan sections. */
  footer?: ReactNode;
  /** Measured usage. Omit to show only the plan limits. */
  usage?: UsageData;
  /** Plan name shown after "Plan usage limits ·". */
  plan?: string;
  /** Plan limits, one bar each. Omit (with no `plan`) to show only the context window. */
  limits?: ReadonlyArray<UsageLimit>;
  /** Shows the arrow button beside the plan heading, and handles its press. */
  onPlanPress?: () => void;
  /** Controlled breakdown state. */
  expanded?: boolean;
  /** Initial breakdown state when uncontrolled. Default `false`. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Value formatter. Default: `482_800 → "482.8k"`, `1_000_000 → "1M"`. */
  formatValue?: (value: number) => string;
  labels?: UsageCardLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
