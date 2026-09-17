import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { RiCalendarLine } from '../icons/remix/RiCalendarLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaCard } from './MediaCard';
import { joinMeta, resolveMediaCardPaint, type MediaCardPaint } from './shared';
import type { EventCardProps } from './types';

/** Month over day: the calendar leaf of an event. */
export function DateBlock({
  month,
  day,
  paint,
  size,
  filled = false,
}: {
  month: string;
  day: string;
  paint: MediaCardPaint;
  size: number;
  filled?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: filled ? paint.placeholder : paint.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="caption-2-semibold" numberOfLines={1} style={{ color: paint.accent, textTransform: 'uppercase' }}>
        {month}
      </Text>
      <Text variant={size >= 56 ? 'title-3-bold' : 'headline-bold'} numberOfLines={1} style={{ color: paint.text, marginTop: -2 }}>
        {day}
      </Text>
    </View>
  );
}

/**
 * A concert or live show.
 *
 *   tile   the image (square, radius 8) with a 48 date leaf — month in the
 *          accent over the day — 8 in from its top-left; the title, "venue ·
 *          city", the time; under it `action` (the tickets button)
 *   row    the date leaf (56) takes the cover's place; the action trails
 *
 * `soldOut` replaces the action with a "Sold out" badge and names it.
 *
 * Name: "Mara Vell, Event, Oct 14, The Lantern Hall · Porto, Fri 20:00, Sold out".
 */
function EventCardComponent({
  title,
  month,
  day,
  image,
  imageVariant,
  venue,
  city,
  time,
  action,
  soldOut = false,
  soldOutLabel = 'Sold out',
  typeLabel = 'Event',
  layout = 'tile',
  testID,
  ...rest
}: EventCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const row = layout === 'row';
  const where = joinMeta([venue, city]);
  const status = soldOut ? (
    <Badge content={soldOutLabel} variant="subtle" color="default" testID={testID ? `${testID}-sold-out` : undefined} />
  ) : (
    action
  );

  return (
    <MediaCard
      {...rest}
      title={title}
      layout={layout}
      testID={testID}
      playButton="never"
      typeLabel={typeLabel}
      artwork={row ? undefined : image}
      artworkVariant={imageVariant}
      placeholderIcon={RiCalendarLine}
      subtitle={where || undefined}
      meta={time ? [time] : undefined}
      accessibilityLabel={
        rest.accessibilityLabel ??
        [title, typeLabel, `${month} ${day}`, where || null, time, soldOut ? soldOutLabel : null].filter(Boolean).join(', ')
      }
      renderArtwork={
        row
          ? () => <DateBlock month={month} day={day} paint={paint} size={56} filled />
          : undefined
      }
      trailing={row ? status : undefined}
      footer={!row && status ? <View style={{ alignItems: 'flex-start' }} pointerEvents="box-none">{status}</View> : undefined}
      artworkOverlay={
        row ? undefined : (
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <DateBlock month={month} day={day} paint={paint} size={48} />
          </View>
        )
      }
    />
  );
}

export const EventCard = memo(EventCardComponent);
EventCard.displayName = 'EventCard';
