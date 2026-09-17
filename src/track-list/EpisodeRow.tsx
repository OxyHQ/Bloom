import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { RiAddCircleLine } from '../icons/remix/RiAddCircleLine';
import { RiArrowDownCircleFill } from '../icons/remix/RiArrowDownCircleFill';
import { RiArrowDownCircleLine } from '../icons/remix/RiArrowDownCircleLine';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { ExplicitBadge, PlayButton } from '../media-controls';
import { Meter } from '../stat-bar';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TrackCover, TrackIconButton, TrackMenu } from './parts';
import {
  formatEpisodeLength,
  formatEpisodeRemaining,
  IS_WEB,
  resolveTrackListPaint,
} from './shared';
import type { EpisodeRowProps } from './types';
import { webDataSet } from '../styles/web-data';

/** Below this the cover shrinks to 64 and the description is dropped. */
const EPISODE_NARROW_WIDTH = 560;

/**
 * A podcast episode: cover, title, show, a two-line description, the date and
 * length (or "Played"), a progress bar with the time left, and the play, save,
 * download and more actions.
 *
 *                wide     narrow (< 560)
 *   cover        112      64 (beside the title)
 *   radius       12       8
 *   description  2 lines  dropped
 *
 *   rest     transparent; hover neutral-100 (dark 800), radius 12
 *   current  title in the accent
 *   played   accent check + "Played" in place of the length
 *
 * Accessibility: the title is a `link` that opens the episode (a press
 * anywhere on the row does too); play is a button named "Play <title>"; save
 * and download are toggle buttons (`aria-pressed` + `accessibilityState`); the
 * progress bar is a `Meter` named "Listened" whose value text is the time
 * left.
 */
function EpisodeRowComponent({
  episode,
  onPress,
  current = false,
  playing = false,
  onPlay,
  onPause,
  onSavedChange,
  onDownloadedChange,
  menuItems,
  width,
  divider = false,
  labels,
  style,
  testID,
}: EpisodeRowProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const window = useWindowDimensions();
  const narrow = (width ?? window.width) < EPISODE_NARROW_WIDTH;
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formatLength = labels?.formatLength ?? formatEpisodeLength;
  const formatRemaining = labels?.formatRemaining ?? formatEpisodeRemaining;
  const playedLabel = labels?.played ?? 'Played';
  const progress = episode.progress ?? 0;
  const inProgress = !episode.played && progress > 0 && progress < episode.duration;
  const remaining = formatRemaining(episode.duration - progress);
  const items = menuItems?.(episode) ?? [];
  const cover = narrow ? 64 : 112;
  const titleColor = current ? paint.accent : paint.text;

  const meta = (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
      {episode.explicit ? <ExplicitBadge size="small" style={{ marginRight: 6 }} /> : null}
      {episode.played ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
          <RiCheckboxCircleFill width={14} height={14} fill={paint.accent} />
          <Text variant="caption-1-medium" style={{ color: paint.accent, marginLeft: 4 }}>
            {playedLabel}
          </Text>
        </View>
      ) : null}
      <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textMuted }}>
        {[episode.played ? null : episode.date, episode.played ? episode.date : formatLength(episode.duration)]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
  );

  const titleBlock = (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        {...webDataSet({ bloomTrackLink: '' })}
        variant={narrow ? 'body-semibold' : 'headline-semibold'}
        numberOfLines={2}
        role="link"
        accessibilityLabel={episode.title}
        onPress={onPress ? () => onPress(episode) : undefined}
        style={{ color: titleColor }}
      >
        {episode.title}
      </Text>
      {episode.show ? (
        <Text
          variant="body-2-medium"
          numberOfLines={1}
          style={{ color: paint.textMuted, marginTop: 2 }}
        >
          {episode.show}
        </Text>
      ) : null}
    </View>
  );

  const actions = (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
      {onPlay ? (
        <PlayButton
          size="small"
          variant="inverse"
          playing={current && playing}
          subject={episode.title}
          onPress={() => (current && playing ? (onPause ?? onPlay)(episode) : onPlay(episode))}
          testID={testID ? `${testID}-play` : undefined}
        />
      ) : null}
      {inProgress ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, flexShrink: 1 }}>
          <Meter
            value={Math.round(progress)}
            max={Math.round(episode.duration)}
            height={4}
            width={narrow ? 56 : 80}
            fill={paint.accent}
            track={paint.rail}
            accessibilityLabel={labels?.progress ?? 'Listened'}
            valueText={remaining}
          />
          <Text
            variant="caption-1-medium"
            numberOfLines={1}
            aria-hidden
            style={{ color: paint.textMuted, marginLeft: 8 }}
          >
            {remaining}
          </Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }} />
      {onSavedChange ? (
        <TrackIconButton
          icon={episode.saved ? RiCheckboxCircleFill : RiAddCircleLine}
          accessibilityLabel={labels?.save ?? 'Save episode'}
          pressed={episode.saved === true}
          activeColor={paint.accent}
          onPress={() => onSavedChange(episode, !episode.saved)}
          testID={testID ? `${testID}-save` : undefined}
        />
      ) : null}
      {onDownloadedChange ? (
        <TrackIconButton
          icon={episode.downloaded ? RiArrowDownCircleFill : RiArrowDownCircleLine}
          accessibilityLabel={labels?.download ?? 'Download episode'}
          pressed={episode.downloaded === true}
          activeColor={paint.accent}
          onPress={() => onDownloadedChange(episode, !episode.downloaded)}
          testID={testID ? `${testID}-download` : undefined}
        />
      ) : null}
      {items.length > 0 ? (
        <TrackMenu
          items={items}
          label={`${labels?.moreOptions ?? 'More options'} for ${episode.title}`}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          testID={testID ? `${testID}-more` : undefined}
        />
      ) : null}
    </View>
  );

  return (
    <Pressable
      onPress={onPress ? () => onPress(episode) : undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      focusable={false}
      tabIndex={-1}
      style={[
        {
          flexDirection: 'row',
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: 12,
          backgroundColor: IS_WEB && (hovered || menuOpen) && onPress ? paint.rowHover : 'transparent',
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: paint.hairline,
        },
        divider ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : null,
        style,
      ]}
      testID={testID}
    >
      {narrow ? (
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TrackCover cover={episode.cover} size={cover} radius={8} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>{titleBlock}</View>
          </View>
          <View style={{ marginTop: 10 }}>{meta}</View>
          {actions}
        </View>
      ) : (
        <>
          <TrackCover cover={episode.cover} size={cover} radius={12} />
          <View style={{ flex: 1, minWidth: 0, marginLeft: 16 }}>
            {titleBlock}
            {episode.description ? (
              <Text
                variant="body-regular"
                numberOfLines={2}
                style={{ color: paint.textMuted, marginTop: 8 }}
              >
                {episode.description}
              </Text>
            ) : null}
            <View style={{ marginTop: 8 }}>{meta}</View>
            {actions}
          </View>
        </>
      )}
    </Pressable>
  );
}

export const EpisodeRow = memo(EpisodeRowComponent);
EpisodeRow.displayName = 'EpisodeRow';
