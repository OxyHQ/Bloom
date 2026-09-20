import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';

/** What was done. Each kind carries its own glyph, word and tone (`constants.ts`). */
export type ActivityFeedKind = 'call' | 'email' | 'meeting' | 'note' | 'stage-change' | 'task';

/** Who did it. The feed is actor-led: the avatar is the entry's leading mark. */
export interface ActivityFeedActor {
  name: string;
  /** A URL or an `ImageResolver` id. Without it the avatar draws initials. */
  avatar?: string;
}

export interface ActivityFeedEntry {
  /** Stable identity. Also the key the reveal state is held under. */
  id: string;
  kind: ActivityFeedKind;
  /** What happened, in one line — "Called about the renewal". */
  title: string;
  actor: ActivityFeedActor;
  /**
   * The day this entry belongs to, PRE-FORMATTED ("Today", "12 March").
   * Grouping is by this exact string: Bloom does no date maths, owns no
   * timezone and knows no locale, and a component that parsed a date here would
   * be guessing at all three.
   */
  day: string;
  /** Time of day, pre-formatted ("14:10"). */
  timestamp?: string;
  /** The note itself. Clamped, with a reveal — see {@link ActivityFeedProps.bodyLines}. */
  body?: string;
  /** What came of it — "Renewed for 12 months", "No answer". */
  outcome?: string;
  /** The outcome pill's tone. Default `default`. */
  outcomeTone?: AccentTone;
  /** Who RECORDED it, when that is not who did it. */
  loggedBy?: string;
}

/** Entries that share a `day`, in the order they arrived. */
export interface ActivityFeedGroup {
  day: string;
  entries: readonly ActivityFeedEntry[];
}

export interface ActivityFeedProps {
  entries: readonly ActivityFeedEntry[];
  /**
   * Lines a `body` clamps to before the reveal is offered. Default 3. `0` never
   * clamps, and never draws a reveal.
   */
  bodyLines?: number;
  /** Default `"Show more"`. */
  moreLabel?: string;
  /** Default `"Show less"`. */
  lessLabel?: string;
  /** The trail under an entry. Default `` (name) => `Logged by ${name}` ``. */
  formatLoggedBy?: (name: string) => string;
  /** What an empty feed says. Default `"Nothing logged yet"`. */
  emptyLabel?: string;
  /** Names the list. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ActivityFeedFiltersProps {
  /** The kinds offered, in the order given. */
  kinds: readonly ActivityFeedKind[];
  /** The kinds currently ON. Controlled — the feed does not filter itself. */
  selected: readonly ActivityFeedKind[];
  onToggle: (kind: ActivityFeedKind) => void;
  /** A count drawn after a kind's word. */
  counts?: Partial<Record<ActivityFeedKind, number>>;
  /** Overrides a kind's word, for a localised feed. */
  labels?: Partial<Record<ActivityFeedKind, string>>;
  /** Names the row. Default `"Filter activity"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
