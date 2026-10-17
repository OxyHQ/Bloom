import type { StyleProp, ViewStyle } from 'react-native';

/** One bucket of the context window. */
/** @deprecated Use UsageSegment from @oxy.so/bloom/usage-card. */
export interface AgentLimitsContextSegment {
  label: string;
  /** Tokens the bucket holds. */
  tokens: number;
  /**
   * Any colour. Defaults to the card's chart palette by index — a hue
   * order, re-tinted around the theme's `primary` (primary first).
   */
  color?: string;
  /** Listed in the breakdown, but neither drawn in the bar nor counted as used. */
  deferred?: boolean;
}

/** A collapsible breakdown row (MCP tools, memory files…) listing its members. */
/** @deprecated Use UsageGroup from @oxy.so/bloom/usage-card. */
export interface AgentLimitsContextGroup {
  label: string;
  tokens: number;
  items: ReadonlyArray<{ label: string; tokens: number }>;
}

/** The context-window section: a stacked usage bar with an expandable breakdown. */
/** @deprecated Use UsageData from @oxy.so/bloom/usage-card. */
export interface AgentLimitsContext {
  /** Window size in tokens (e.g. `1_000_000`). */
  max: number;
  segments: ReadonlyArray<AgentLimitsContextSegment>;
  groups?: ReadonlyArray<AgentLimitsContextGroup>;
}

/** One rolling plan limit. */
/** @deprecated Use UsageLimit from @oxy.so/bloom/usage-card. */
export interface AgentLimitsUsageLimit {
  label: string;
  /** 0–1 share of the limit already used. Clamped. */
  used: number;
  /** "Resets in 2 hr 46 min", "Resets Tue 3:00 PM"… */
  resets: string;
}

/** The card's fixed strings, localised via `BloomProvider locale`; each key here wins. */
/** @deprecated Use UsageCardLabels from @oxy.so/bloom/usage-card. */
export interface AgentLimitsCardLabels {
  /** `'Context window'` in English. */
  contextWindow?: string;
  /** `'Free space'` in English. */
  freeSpace?: string;
  /** `'Plan usage limits'` in English. `plan` is appended as `· <plan>`. */
  planUsageLimits?: string;
  /** Names the plan arrow button. `'Manage plan'` in English. */
  managePlan?: string;
}

/** @deprecated Use UsageCardProps from @oxy.so/bloom/usage-card. */
export interface AgentLimitsCardProps {
  /** Context-window usage. Omit to show only the plan limits. */
  context?: AgentLimitsContext;
  /** Plan name shown after "Plan usage limits ·". */
  plan?: string;
  /** Plan limits, one bar each. Omit (with no `plan`) to show only the context window. */
  limits?: ReadonlyArray<AgentLimitsUsageLimit>;
  /** Shows the arrow button beside the plan heading, and handles its press. */
  onPlanPress?: () => void;
  /** Controlled breakdown state. */
  expanded?: boolean;
  /** Initial breakdown state when uncontrolled. Default `false`. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Token formatter. Default: `482_800 → "482.8k"`, `1_000_000 → "1M"`. */
  formatTokens?: (tokens: number) => string;
  labels?: AgentLimitsCardLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
