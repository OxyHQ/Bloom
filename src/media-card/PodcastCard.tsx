import React, { memo } from 'react';

import { RiMic2Fill } from '../icons/remix/RiMic2Fill';
import { MediaCard } from './MediaCard';
import { joinMeta, PODCAST_RADIUS } from './shared';
import type { PodcastCardProps } from './types';

/**
 * A show: a rounded-square cover — radius 12 (8 in a row), rounder than an
 * album's so a shelf of shows reads apart from a shelf of albums — the title
 * and the publisher.
 *
 * Name: "Slow Signals, Podcast, Harbor Audio".
 */
function PodcastCardComponent({ title, publisher, typeLabel = 'Podcast', layout = 'tile', ...rest }: PodcastCardProps) {
  const row = layout === 'row';
  return (
    <MediaCard
      {...rest}
      layout={layout}
      title={title}
      typeLabel={typeLabel}
      subtitle={row ? joinMeta([typeLabel, publisher]) : publisher}
      accessibilityLabel={rest.accessibilityLabel ?? [title, typeLabel, publisher].filter(Boolean).join(', ')}
      artworkRadius={row ? 8 : PODCAST_RADIUS}
      placeholderIcon={RiMic2Fill}
    />
  );
}

export const PodcastCard = memo(PodcastCardComponent);
PodcastCard.displayName = 'PodcastCard';
