export { ActivityFeed } from './ActivityFeed';
export { ActivityFeedFilters } from './ActivityFeedFilters';
export {
  ACTIVITY_AVATAR_SIZE,
  ACTIVITY_BODY_CHARS_PER_LINE,
  ACTIVITY_ENTRY_GAP,
  ACTIVITY_FEED_KIND,
  ACTIVITY_FEED_KINDS,
  ACTIVITY_KIND_MARK_SIZE,
} from './constants';
export { activityBodyIsLong, groupActivityByDay, resolveActivityFeedPaint } from './shared';
export type { ActivityFeedPaint } from './shared';
export type {
  ActivityFeedActor,
  ActivityFeedEntry,
  ActivityFeedFiltersProps,
  ActivityFeedGroup,
  ActivityFeedKind,
  ActivityFeedProps,
} from './types';
