import React, { memo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { ExplicitBadge } from '../media-controls/ExplicitBadge';
import { NowPlayingIndicator } from '../media-controls/NowPlayingIndicator';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { useImageUri, useMediaHeaderPaint } from './parts';
import { type MediaHeaderPaint } from './shared';
import type { PopularTrack, PopularTracksProps } from './types';

/**
 * An artist's most played tracks: five rows, "See more" shows ten.
 *
 *   row        56 high, radius 6, hover wash
 *   index      body-medium muted, 24 wide; the current track shows the
 *              now-playing bars instead
 *   image      40, radius 4
 *   title      body-medium (accent when current) + explicit badge
 *   plays      body-regular muted — hidden under 480 wide
 *   duration   body-regular muted, tabular
 *
 * Each row is a button named by its title. The rows are internal to this part;
 * a full track list belongs to its own family.
 */

function TrackRow({
  track,
  index,
  active,
  playing,
  compact,
  paint,
  onPress,
}: {
  track: PopularTrack;
  index: number;
  active: boolean;
  playing: boolean;
  compact: boolean;
  paint: MediaHeaderPaint;
  onPress?: () => void;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const uri = useImageUri(track.image, 'thumb');
  const row: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 6,
    backgroundColor: hovered ? paint.wash : 'transparent',
    '--bloom-media-header-ring': paint.ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomMediaHeaderPress: 'inset' })}
      role="button"
      accessibilityLabel={track.title}
      aria-current={active || undefined}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={row}
    >
      <View style={{ width: 24, alignItems: 'center' }}>
        {active ? (
          <NowPlayingIndicator playing={playing} size={14} />
        ) : (
          <Text variant="body-medium" style={{ color: paint.textMuted, fontVariant: ['tabular-nums'] }}>
            {String(index + 1)}
          </Text>
        )}
      </View>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: paint.placeholder,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: 40, height: 40 }} />
        ) : (
          <RiMusic2Line width={18} height={18} fill={paint.placeholderGlyph} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ flexShrink: 1, color: active ? paint.accent : paint.text }}
        >
          {track.title}
        </Text>
        {track.explicit ? <ExplicitBadge size="small" /> : null}
      </View>
      {track.plays && !compact ? (
        <Text variant="body-regular" numberOfLines={1} style={{ width: 120, textAlign: 'right', color: paint.textMuted }}>
          {track.plays}
        </Text>
      ) : null}
      {track.duration ? (
        <Text
          variant="body-regular"
          style={{ minWidth: 44, textAlign: 'right', color: paint.textMuted, fontVariant: ['tabular-nums'] }}
        >
          {track.duration}
        </Text>
      ) : null}
    </Pressable>
  );
}

function PopularTracksComponent({
  tracks,
  title = 'Popular',
  collapsedCount = 5,
  expandedCount = 10,
  expanded: expandedProp,
  onExpandedChange,
  showMoreLabel = 'See more',
  showLessLabel = 'Show less',
  activeTrackId,
  playing = false,
  onTrackPress,
  style,
  testID,
}: PopularTracksProps) {
  const paint = useMediaHeaderPaint();
  const [expandedState, setExpandedState] = useState(false);
  const expanded = expandedProp ?? expandedState;
  const [width, setWidth] = useState(720);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const shown = tracks.slice(0, expanded ? expandedCount : collapsedCount);
  const canExpand = tracks.length > collapsedCount;

  const toggle = () => {
    const next = !expanded;
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };

  const toggleStyle: WebCssStyle = {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginTop: 8,
    borderRadius: 4,
    '--bloom-media-header-ring': paint.ring,
  };

  return (
    <View
      style={[{ gap: 8 }, style]}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      testID={testID}
    >
      <Text variant="title-1-bold" role="heading" aria-level={2} style={{ color: paint.text }}>
        {title}
      </Text>
      <View role="list">
        {shown.map((track, i) => (
          <View role="listitem" key={track.id} testID={testID ? `${testID}-row-${i}` : undefined}>
            <TrackRow
              track={track}
              index={i}
              active={track.id === activeTrackId}
              playing={playing}
              compact={width < 480}
              paint={paint}
              onPress={onTrackPress ? () => onTrackPress(track, i) : undefined}
            />
          </View>
        ))}
      </View>
      {canExpand ? (
        <Pressable
          {...webDataSet({ bloomMediaHeaderPress: '' })}
          role="button"
          accessibilityLabel={expanded ? showLessLabel : showMoreLabel}
          aria-expanded={expanded}
          accessibilityState={{ expanded }}
          onPress={toggle}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={toggleStyle}
          testID={testID ? `${testID}-toggle` : undefined}
        >
          <Text variant="body-semibold" style={{ color: hovered ? paint.text : paint.textMuted }}>
            {expanded ? showLessLabel : showMoreLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const PopularTracks = memo(PopularTracksComponent);
PopularTracks.displayName = 'PopularTracks';
