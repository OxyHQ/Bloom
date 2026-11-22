import {
  ActivityFeed as BloomActivityFeed,
  type ActivityFeedEntry,
  type ActivityFeedProps,
} from '@oxy.so/bloom/activity-feed';

import { Node, type ViewModifiers } from '../node';
import type { ActivityFeedGrouping, ControlDensity } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** The activity feed: who did what, by day. */
export type ActivityFeedKind = 'activityFeed';

/** Bloom `ActivityFeed`'s words and its logged-by trail. */
export type ActivityFeedOptions = Omit<
  ActivityFeedProps,
  'entries' | 'density' | 'grouping' | 'bodyLines' | 'style' | 'testID' | 'accessibilityLabel'
>;

/** Bloom `ActivityFeed`; `.label()` names the list. */
export interface ActivityFeedView extends ViewModifiers<ActivityFeedView> {
  /** `day` (default): under day headings; `none`: in the order given, with separators. */
  style(value: ActivityFeedGrouping): ActivityFeedView;
  /** `default` (Bloom's comfortable rhythm) or `compact`. */
  density(value: ControlDensity): ActivityFeedView;
  /** The lines a body clamps to before its reveal: 3 by default, `0` never clamps. */
  lines(value: number): ActivityFeedView;
}

/** Bloom `ActivityFeed` of `entries` (Bloom's `ActivityFeedEntry`s, in the order they arrived). */
export function ActivityFeed(
  entries: readonly ActivityFeedEntry[],
  options: ActivityFeedOptions = {},
): ActivityFeedView {
  return new Node('activityFeed', { entries, options }, []);
}

/** Bloom's density of a content rhythm: the language's `default` is its `comfortable`. */
export function rhythm(d: ControlDraw): 'comfortable' | 'compact' | undefined {
  const density = d.own('density')?.value;
  return density === undefined ? undefined : density === 'compact' ? 'compact' : 'comfortable';
}

export const ACTIVITY_FEEDS: Record<ActivityFeedKind, ControlRenderer> = {
  activityFeed: product(BloomActivityFeed, {
    own: (d) => ({
      grouping: d.own('style')?.value,
      density: rhythm(d),
      bodyLines: d.own('lines')?.value,
    }),
  }),
};
