import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  ACTIVITY_AVATAR_SIZE,
  ACTIVITY_ENTRY_GAP,
  ACTIVITY_FEED_KIND,
  ACTIVITY_KIND_MARK_SIZE,
} from './constants';
import { activityBodyIsLong, groupActivityByDay, resolveActivityFeedPaint } from './shared';
import type { ActivityFeedEntry, ActivityFeedProps } from './types';

/**
 * Everything anyone did with a customer, newest block first, grouped by day.
 *
 * **This is a FEED, not a status timeline.** `TenancyTimeline` and
 * `EvictionTimeline` draw one PROCESS advancing: homogeneous steps on a spine,
 * each with a state (`complete` / `current` / `upcoming`), connected top to
 * bottom because the connector IS the claim that one step follows another. An
 * activity feed has no spine and no next step — the entries are heterogeneous
 * (a call, a note, a stage change), each belongs to a different PERSON, and they
 * are grouped into days rather than sequenced. So the leading mark here is the
 * ACTOR's avatar with the kind on its corner, there is no connector, and the
 * only ordering claim the component makes is the day heading.
 *
 *   heading   the day, `caption-1-semibold` on a rule that runs to the edge
 *   entry     the actor's avatar (32) with the kind mark (18) on its corner;
 *             the actor's name and the title on one line; the timestamp and the
 *             kind's word under it; the body, clamped with a reveal; the
 *             outcome as a pill; the "logged by" trail last
 *   rhythm    16 between entries, 12 between the mark and the text
 *
 * A `list` of `listitem`s. The kind mark is hidden from assistive technology —
 * the kind's word is already in the entry's text, and an `img` announcing
 * "Call" a second time reads as two events.
 */
function ActivityFeedComponent({
  entries,
  bodyLines = 3,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  formatLoggedBy = (name: string) => `Logged by ${name}`,
  emptyLabel = 'Nothing logged yet',
  accessibilityLabel,
  style,
  testID,
}: ActivityFeedProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveActivityFeedPaint(theme, surface), [theme, surface]);
  const groups = useMemo(() => groupActivityByDay(entries), [entries]);

  const [revealed, setRevealed] = useState<readonly string[]>([]);
  const toggle = useCallback((id: string) => {
    setRevealed((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }, []);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  if (entries.length === 0) {
    return (
      <View style={style} testID={testID}>
        <Text variant="body-2-regular" style={{ color: paint.textTertiary }} testID={id('empty')}>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  const renderEntry = (entry: ActivityFeedEntry) => {
    const kind = ACTIVITY_FEED_KIND[entry.kind];
    const KindIcon = kind.icon;
    const markPaint = resolveAccentColors(theme.colors, kind.tone, 'subtle');
    const open = revealed.includes(entry.id);
    const long = activityBodyIsLong(entry.body, bodyLines);
    const eid = (part: string) => (testID ? `${testID}-${entry.id}-${part}` : undefined);

    return (
      <View
        key={entry.id}
        role="listitem"
        style={{ flexDirection: 'row', gap: 12 }}
        testID={eid('entry')}
      >
        <View style={{ width: ACTIVITY_AVATAR_SIZE, height: ACTIVITY_AVATAR_SIZE }}>
          <Avatar size={ACTIVITY_AVATAR_SIZE} source={entry.actor.avatar} name={entry.actor.name} />
          <View
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: ACTIVITY_KIND_MARK_SIZE,
              height: ACTIVITY_KIND_MARK_SIZE,
              borderRadius: ACTIVITY_KIND_MARK_SIZE / 2,
              backgroundColor: markPaint.background,
              borderWidth: 2,
              borderColor: paint.markRing,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            testID={eid('mark')}
          >
            <KindIcon width={10} height={10} fill={markPaint.foreground} />
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="body-medium" style={{ color: paint.text }} testID={eid('title')}>
            <Text variant="body-semibold" style={{ color: paint.text }}>
              {entry.actor.name}
            </Text>
            {` ${entry.title}`}
          </Text>
          <Text
            variant="caption-1-regular"
            style={{ color: paint.textTertiary }}
            testID={eid('meta')}
          >
            {[kind.label, entry.timestamp].filter(Boolean).join(' · ')}
          </Text>

          {entry.body ? (
            <View style={{ marginTop: 4, gap: 2, alignItems: 'flex-start' }}>
              <Text
                variant="body-2-regular"
                numberOfLines={long && !open ? bodyLines : undefined}
                style={{ color: paint.textSecondary }}
                testID={eid('body')}
              >
                {entry.body}
              </Text>
              {long ? (
                <Button
                  variant="text"
                  size="xs"
                  onPress={() => toggle(entry.id)}
                  accessibilityLabel={`${open ? lessLabel : moreLabel}: ${entry.title}`}
                  testID={eid('reveal')}
                >
                  {open ? lessLabel : moreLabel}
                </Button>
              ) : null}
            </View>
          ) : null}

          {entry.outcome ? (
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              <Badge
                content={entry.outcome}
                variant="subtle"
                color={entry.outcomeTone ?? 'default'}
                size="label-small"
                testID={eid('outcome')}
              />
            </View>
          ) : null}

          {entry.loggedBy ? (
            <Text
              variant="caption-2-regular"
              style={{ color: paint.textTertiary, marginTop: 4 }}
              testID={eid('logged-by')}
            >
              {formatLoggedBy(entry.loggedBy)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View role="list" accessibilityLabel={accessibilityLabel} style={style} testID={testID}>
      {groups.map((group, index) => (
        <View key={group.day} style={{ marginTop: index === 0 ? 0 : ACTIVITY_ENTRY_GAP + 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: ACTIVITY_ENTRY_GAP,
            }}
            testID={id(`day-${group.day}`)}
          >
            <Text variant="caption-1-semibold" style={{ color: paint.textSecondary }}>
              {group.day}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: paint.hairline }} />
          </View>
          <View style={{ gap: ACTIVITY_ENTRY_GAP }}>{group.entries.map(renderEntry)}</View>
        </View>
      ))}
    </View>
  );
}

export const ActivityFeed = memo(ActivityFeedComponent);
ActivityFeed.displayName = 'ActivityFeed';
