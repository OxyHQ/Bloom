import React, { memo } from 'react';

import { ExplicitBadge } from '../media-controls';
import { RiDiscFill } from '../icons/remix/RiDiscFill';
import { MediaCard } from './MediaCard';
import { joinMeta } from './shared';
import type { AlbumCardProps, AlbumCardType } from './types';
import { useMessages } from '../locale/messages';
import { MEDIA_CARD_MESSAGES } from './messages';
import { MEDIA_CONTROLS_MESSAGES } from '../media-controls/messages';

/** The English type words; the card speaks the locale's (`BloomProvider locale`). */
export const ALBUM_TYPE_LABELS: Record<AlbumCardType, string> = MEDIA_CARD_MESSAGES.en.albumTypes;

/**
 * An album, single or EP: square cover (radius 8), the title, "2026 · Album"
 * and the artist. A row puts it on one line: "Album · 2026 · Mara Vell".
 *
 * Name: "Low Tide, Album, 2026, Mara Vell".
 */
function AlbumCardComponent({
  title,
  artist,
  year,
  albumType = 'album',
  typeLabels,
  explicit = false,
  layout = 'tile',
  ...rest
}: AlbumCardProps) {
  const { messages } = useMessages(MEDIA_CARD_MESSAGES);
  const { messages: controls } = useMessages(MEDIA_CONTROLS_MESSAGES);
  const type = typeLabels?.[albumType] ?? messages.albumTypes[albumType];
  const row = layout === 'row';
  return (
    <MediaCard
      {...rest}
      layout={layout}
      title={title}
      typeLabel={type}
      subtitle={row ? joinMeta([type, year, artist]) : joinMeta([year, type])}
      meta={!row && artist ? [artist] : undefined}
      accessibilityLabel={
        rest.accessibilityLabel ??
        [title, explicit ? controls.explicit : null, type, year, artist].filter(Boolean).join(', ')
      }
      placeholderIcon={RiDiscFill}
      titleAccessory={explicit ? <ExplicitBadge size="small" /> : undefined}
    />
  );
}

export const AlbumCard = memo(AlbumCardComponent);
AlbumCard.displayName = 'AlbumCard';
