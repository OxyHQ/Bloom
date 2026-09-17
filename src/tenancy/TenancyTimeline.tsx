import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { IS_WEB, joinName, resolveHousingPalette } from './shared';
import type { TenancyTimelineDensity, TenancyTimelineEventState, TenancyTimelineProps } from './types';

/**
 * A vertical history of tenancy events, oldest first.
 *
 *   marker       comfortable: a 12 dot in a 24 column, or a 24 disc with a 14
 *                icon when the event has one; compact: an 8 dot in a 16 column.
 *                `complete` fills with the tone, `current` fills and adds a 3px
 *                tint halo, `upcoming` is hollow (1.5px neutral-300 / 500 ring on the
 *                surface) and its text turns secondary.
 *   connector    2px hairline (neutral-200 / 700) from under a marker to the
 *                next row, radius 1, 4 clear of the marker
 *   text         title body-medium (compact body-2-medium; semibold when
 *                `current`), meta "date · actor" body-2-regular (compact
 *                caption-1-regular) text-secondary, description body-2-regular
 *   rhythm       20 between events (compact 12), 12 between marker and text
 *
 * A `list` of `listitem`s. Each marker is an `img` named by its state ("Done",
 * "In progress", "Not yet"), so a screen reader hears the state before the
 * title it belongs to.
 */

const GEOMETRY: Record<
  TenancyTimelineDensity,
  { column: number; dot: number; line: number; gap: number; title: 'body-medium' | 'body-2-medium'; meta: 'body-2-regular' | 'caption-1-regular' }
> = {
  comfortable: { column: 24, dot: 12, line: 20, gap: 20, title: 'body-medium', meta: 'body-2-regular' },
  compact: { column: 16, dot: 8, line: 18, gap: 12, title: 'body-2-medium', meta: 'caption-1-regular' },
};

const DEFAULT_STATE_LABELS: Record<TenancyTimelineEventState, string> = {
  complete: 'Done',
  current: 'In progress',
  upcoming: 'Not yet',
};

function TenancyTimelineComponent({
  events,
  density = 'comfortable',
  accessibilityLabel,
  stateLabels,
  style,
  testID,
}: TenancyTimelineProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveHousingPalette(theme), [theme]);
  const g = GEOMETRY[density];
  const labels = { ...DEFAULT_STATE_LABELS, ...stateLabels };

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      style={style}
      testID={testID}
    >
      {events.map((event, index) => {
        const state = event.state ?? 'complete';
        const last = index === events.length - 1;
        const accent = resolveAccentColors(theme.colors, event.tone ?? 'primary', 'solid');
        const tint = resolveAccentColors(theme.colors, event.tone ?? 'primary', 'subtle').background;
        const Icon = density === 'comfortable' ? event.icon : undefined;
        const upcoming = state === 'upcoming';
        const id = (part: string) => (testID ? `${testID}-${index}-${part}` : undefined);

        const markerSize = Icon ? g.column : state === 'current' ? g.dot + 6 : g.dot;
        // The marker sits centred on the title's first line; a disc is as tall as the column.
        const markerBox = Math.max(g.line, markerSize);

        const marker = (
          <View
            accessible
            accessibilityLabel={labels[state]}
            {...(IS_WEB ? { role: 'img' as const } : { accessibilityRole: 'image' as const })}
            testID={id('marker')}
            style={{
              width: markerSize,
              height: markerSize,
              borderRadius: markerSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: upcoming ? palette.surface : accent.background,
              borderWidth: upcoming ? 1.5 : state === 'current' && !Icon ? 3 : 0,
              borderColor: upcoming ? palette.markerRing : tint,
            }}
          >
            {Icon ? (
              <Icon width={14} height={14} fill={upcoming ? palette.textSecondary : accent.foreground} />
            ) : null}
          </View>
        );

        const meta = joinName([event.date, event.actor], ' · ');

        return (
          <View
            key={event.id ?? index}
            role="listitem"
            testID={id('item')}
            style={{ flexDirection: 'row', gap: 12 }}
          >
            <View style={{ width: g.column, alignItems: 'center' }}>
              <View style={{ height: markerBox, alignItems: 'center', justifyContent: 'center' }}>{marker}</View>
              {!last ? (
                <View
                  testID={id('connector')}
                  style={{
                    flex: 1,
                    width: 2,
                    minHeight: 8,
                    marginTop: 4,
                    borderRadius: 1,
                    backgroundColor: palette.hairline,
                  }}
                />
              ) : null}
            </View>
            <View
              style={{
                flex: 1,
                minWidth: 0,
                gap: 2,
                paddingTop: (markerBox - g.line) / 2,
                paddingBottom: last ? 0 : g.gap,
              }}
            >
              <Text
                variant={state === 'current' ? (density === 'compact' ? 'body-2-semibold' : 'body-semibold') : g.title}
                style={{ color: upcoming ? palette.textSecondary : palette.text }}
                testID={id('title')}
              >
                {event.title}
              </Text>
              {meta ? (
                <Text variant={g.meta} style={{ color: palette.textSecondary }} testID={id('meta')}>
                  {meta}
                </Text>
              ) : null}
              {event.description ? (
                <Text
                  variant="body-2-regular"
                  style={{ color: upcoming ? palette.textSecondary : palette.text, marginTop: 2 }}
                >
                  {event.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const TenancyTimeline = memo(TenancyTimelineComponent);
TenancyTimeline.displayName = 'TenancyTimeline';
