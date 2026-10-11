import React, { memo, useMemo } from 'react';

import { RiBookOpenFill } from '../icons/remix/RiBookOpenFill';
import { useTheme } from '../theme/use-theme';
import { MediaCard } from './MediaCard';
import { ListenProgress } from './parts';
import { joinMeta, resolveMediaCardPaint } from './shared';
import type { AudiobookCardProps } from './types';
import { clamp01 } from '../styles/clamp';
import { useMessages } from '../locale/messages';
import { MEDIA_CARD_MESSAGES } from './messages';

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
  narratorPrefix,
  duration,
  progress,
  typeLabel: typeLabelProp,
  layout = 'tile',
  testID,
  ...rest
}: AudiobookCardProps) {
  const { messages } = useMessages(MEDIA_CARD_MESSAGES);
  const typeLabel = typeLabelProp ?? messages.audiobook;
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const row = layout === 'row';
  // A caller's prefix keeps the "<prefix> <narrator>" shape; the catalog's is
  // a whole phrase, so the name sits where the language puts it.
  const narratedBy = narrator
    ? narratorPrefix !== undefined
      ? `${narratorPrefix} ${narrator}`
      : messages.narratedBy(narrator)
    : undefined;
  const heard = clamp01(progress);
  return (
    <MediaCard
      {...rest}
      title={title}
      layout={layout}
      testID={testID}
      typeLabel={typeLabel}
      subtitle={author}
      meta={
        row
          ? [joinMeta([narratedBy, duration])].filter(Boolean)
          : [narratedBy ?? '', duration ?? ''].filter(Boolean)
      }
      artworkAspectRatio={AUDIOBOOK_ASPECT_RATIO}
      artworkRadius={6}
      placeholderIcon={RiBookOpenFill}
      footer={
        heard > 0 ? (
          <ListenProgress
            value={heard}
            paint={paint}
            label={messages.progressOf(title)}
            testID={testID ? `${testID}-progress` : undefined}
          />
        ) : undefined
      }
    />
  );
}

export const AudiobookCard = memo(AudiobookCardComponent);
AudiobookCard.displayName = 'AudiobookCard';
