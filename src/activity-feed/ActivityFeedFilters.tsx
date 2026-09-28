import React, { memo } from 'react';

import { Chip, ChipRow } from '../chip';
import { useMessages } from '../locale/messages';
import { ACTIVITY_FEED_MESSAGES } from './messages';
import type { ActivityFeedFiltersProps } from './types';

/**
 * The kind filter, as a row of toggle pills.
 *
 * A `group` of toggles rather than a `tablist` or a `radiogroup`, because the
 * kinds combine: turning "Call" on does not turn "Email" off, and a `tab` or a
 * `radio` announcing a multi-select would say the opposite of what the control
 * does. `Chip` spells the state for the role it is given — here `aria-pressed`
 * plus the native `accessibilityState` — so the pill is a real toggle to a
 * screen reader and not a pill that looks selected.
 *
 * It is CONTROLLED and filters nothing itself: which entries reach
 * `ActivityFeed` is the app's decision, and a filter row that also held the
 * answer would be a second source of truth for the same list.
 */
function ActivityFeedFiltersComponent({
  kinds,
  selected,
  onToggle,
  counts,
  labels,
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
}: ActivityFeedFiltersProps) {
  const { messages } = useMessages(ACTIVITY_FEED_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.filterActivity;
  return (
    <ChipRow
      role="group"
      accessibilityLabel={accessibilityLabel}
      gap={6}
      // A flex item's automatic minimum is its content width, so a scrolling
      // row of pills widens its parent unless this says otherwise.
      style={[{ minWidth: 0 }, style]}
      testID={testID}
    >
      {kinds.map((kind) => {
        const label = labels?.[kind] ?? messages.kinds[kind];
        const count = counts?.[kind];
        return (
          <Chip
            key={kind}
            size="xl"
            selected={selected.includes(kind)}
            onPress={() => onToggle(kind)}
            accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
            testID={testID ? `${testID}-${kind}` : undefined}
          >
            {count === undefined ? label : `${label} ${count}`}
          </Chip>
        );
      })}
    </ChipRow>
  );
}

export const ActivityFeedFilters = memo(ActivityFeedFiltersComponent);
ActivityFeedFilters.displayName = 'ActivityFeedFilters';
