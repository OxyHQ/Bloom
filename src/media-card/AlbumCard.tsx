import React, { memo } from 'react';

import { ExplicitBadge } from '../media-controls';
import { RiDiscFill } from '../icons/remix/RiDiscFill';
import { MediaCard } from './MediaCard';
import { joinMeta } from './shared';
import type { AlbumCardProps, AlbumCardType } from './types';

export const ALBUM_TYPE_LABELS: Record<AlbumCardType, string> = {
  album: 'Album',
  single: 'Single',
  ep: 'EP',
  compilation: 'Compilation',
};

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
  const type = typeLabels?.[albumType] ?? ALBUM_TYPE_LABELS[albumType];
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
        [title, explicit ? 'Explicit' : null, type, year, artist].filter(Boolean).join(', ')
      }
      placeholderIcon={RiDiscFill}
      titleAccessory={explicit ? <ExplicitBadge size="small" /> : undefined}
    />
  );
}

export const AlbumCard = memo(AlbumCardComponent);
AlbumCard.displayName = 'AlbumCard';
