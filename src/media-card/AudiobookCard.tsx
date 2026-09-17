import React, { memo, useMemo } from 'react';

import { RiBookOpenFill } from '../icons/remix/RiBookOpenFill';
import { useTheme } from '../theme/use-theme';
import { MediaCard } from './MediaCard';
import { ListenProgress } from './parts';
import { clampFraction, joinMeta, resolveMediaCardPaint } from './shared';
import type { AudiobookCardProps } from './types';

/** A book cover is 2:3. */
export const AUDIOBOOK_ASPECT_RATIO = 2 / 3;

/**
 * An audiobook: a TALLER 2:3 cover (160 × 240 at medium; 56 × 84 in a row,
 * radius 6), the title, the author, "Narrated by …", the duration, and a
 * full-width listened bar when `progress` > 0.
 *
 * Name: "The Quiet Coast, Audiobook, Ines Calder, Narrated by Teo Marsh, 11 h 20 min".
 */
function AudiobookCardComponent({
  title,
  author,
  narrator,
  narratorPrefix = 'Narrated by',
  duration,
  progress,
  typeLabel = 'Audiobook',
  layout = 'tile',
  testID,
  ...rest
}: AudiobookCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const row = layout === 'row';
  const narratedBy = narrator ? `${narratorPrefix} ${narrator}` : undefined;
  const heard = clampFraction(progress);
  return (
    <MediaCard
      {...rest}
      title={title}
      layout={layout}
      testID={testID}
      typeLabel={typeLabel}
      subtitle={author}
      meta={row ? [joinMeta([narratedBy, duration])].filter(Boolean) : [narratedBy ?? '', duration ?? ''].filter(Boolean)}
      artworkAspectRatio={AUDIOBOOK_ASPECT_RATIO}
      artworkRadius={6}
      placeholderIcon={RiBookOpenFill}
      footer={
        heard > 0 ? (
          <ListenProgress value={heard} paint={paint} label={`${title} progress`} testID={testID ? `${testID}-progress` : undefined} />
        ) : undefined
      }
    />
  );
}

export const AudiobookCard = memo(AudiobookCardComponent);
AudiobookCard.displayName = 'AudiobookCard';
