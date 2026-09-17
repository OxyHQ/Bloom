import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiMic2Fill } from '../icons/remix/RiMic2Fill';
import { ExplicitBadge, PlayButton } from '../media-controls';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaCard } from './MediaCard';
import { ListenProgress } from './parts';
import { clampFraction, joinMeta, resolveMediaCardPaint } from './shared';
import type { EpisodeCardProps, MediaCardSize } from './types';

/** An episode row's cover side. */
export const EPISODE_ROW_ARTWORK: Record<MediaCardSize, number> = { large: 112, medium: 96, small: 72 };

/** What the progress line draws: the check, the bar, or nothing. */
export function episodeProgressState(played: boolean, progress: number | undefined): 'played' | 'progress' | 'none' {
  if (played) return 'played';
  return clampFraction(progress) > 0 ? 'progress' : 'none';
}

/**
 * An episode.
 *
 *   tile   cover on top (radius 12); "12 Sep · 48 min", the title (2 lines),
 *          the show, the description (2 lines); the progress line
 *   row    cover left (112 / 96 / 72), the same text; under it the play button
 *          — ALWAYS drawn in a row — then the progress line and `actions`
 *
 *   progress line   `played`: an accent check + "Played"; `progress` > 0: a
 *                   48px bar + "12 min left"; else nothing
 *
 * Name: "Tide Tables, Explicit, Episode, Slow Signals, 12 Sep · 48 min, 12 min left".
 */
function EpisodeCardComponent({
  title,
  show,
  date,
  duration,
  description,
  explicit = false,
  progress,
  remaining,
  played = false,
  playedLabel = 'Played',
  actions,
  typeLabel = 'Episode',
  layout = 'tile',
  size = 'medium',
  onPlay,
  playing = false,
  loading = false,
  testID,
  ...rest
}: EpisodeCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const row = layout === 'row';
  const state = episodeProgressState(played, progress);
  const when = joinMeta([date, duration]);

  const progressLine =
    state === 'played' ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} testID={testID ? `${testID}-played` : undefined}>
        <View aria-hidden>
          <RiCheckboxCircleFill width={16} height={16} fill={paint.accent} />
        </View>
        <Text variant="caption-1-medium" style={{ color: paint.textSecondary }}>
          {playedLabel}
        </Text>
      </View>
    ) : state === 'progress' ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <ListenProgress value={progress ?? 0} paint={paint} width={48} label={`${title} progress`} testID={testID ? `${testID}-progress` : undefined} />
        {remaining ? (
          <Text variant="caption-1-medium" numberOfLines={1} style={{ color: paint.textSecondary }}>
            {remaining}
          </Text>
        ) : null}
      </View>
    ) : null;

  const footer =
    row || progressLine || actions ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} pointerEvents="box-none">
        {row && onPlay ? (
          <PlayButton playing={playing} loading={loading} onPress={onPlay} subject={title} size="small" testID={testID ? `${testID}-play` : undefined} />
        ) : null}
        {progressLine}
        <View style={{ flex: 1 }} pointerEvents="none" />
        {actions ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} pointerEvents="box-none">
            {actions}
          </View>
        ) : null}
      </View>
    ) : undefined;

  return (
    <MediaCard
      {...rest}
      title={title}
      layout={layout}
      size={size}
      testID={testID}
      onPlay={row ? undefined : onPlay}
      playing={playing}
      loading={loading}
      typeLabel={typeLabel}
      eyebrow={when || undefined}
      titleLines={2}
      subtitle={show}
      description={description}
      artworkRadius={row ? 8 : 12}
      artworkSize={row ? EPISODE_ROW_ARTWORK[size] : undefined}
      rowAlign="top"
      placeholderIcon={RiMic2Fill}
      titleAccessory={explicit ? <ExplicitBadge size="small" /> : undefined}
      accessibilityLabel={
        rest.accessibilityLabel ??
        [
          title,
          explicit ? 'Explicit' : null,
          typeLabel,
          show,
          when || null,
          state === 'played' ? playedLabel : state === 'progress' ? remaining : null,
        ]
          .filter(Boolean)
          .join(', ')
      }
      footer={footer}
    />
  );
}

export const EpisodeCard = memo(EpisodeCardComponent);
EpisodeCard.displayName = 'EpisodeCard';
