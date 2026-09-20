import { hairlineOn } from '../styles/surface-levels';
import React, { memo, useMemo, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { RiFullscreenLine } from '../icons/remix/RiFullscreenLine';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiPlayListLine } from '../icons/remix/RiPlayListLine';
import { ExplicitBadge } from '../media-controls/ExplicitBadge';
import { LikeButton } from '../media-controls/LikeButton';
import { PlaybackProgress } from '../media-controls/PlaybackProgress';
import { VolumeControl } from '../media-controls/VolumeControl';
import { resolveMediaControlsPaint } from '../media-controls/shared';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { useTheme } from '../theme/use-theme';
import { DEVICE_GLYPHS } from './device-icons';
import { PlayerIconButton } from './PlayerIconButton';
import { Artwork, TrackText } from './TrackText';
import { TransportControls } from './TransportControls';
import type { NowPlayingBarLabels, NowPlayingBarProps } from './types';
import { webDataSet } from '../styles/web-data';

export const NOW_PLAYING_BAR_HEIGHT = 80;
/** At and above: every control. Below: no fullscreen button, a shorter volume slider. */
export const NOW_PLAYING_BAR_WIDE = 1024;
/** Below: no lyrics, device (unless casting) or volume; no times beside the scrubber. */
export const NOW_PLAYING_BAR_MEDIUM = 768;

export type NowPlayingBarLayout = 'wide' | 'medium' | 'narrow';

export function nowPlayingBarLayout(width: number): NowPlayingBarLayout {
  if (width >= NOW_PLAYING_BAR_WIDE) return 'wide';
  if (width >= NOW_PLAYING_BAR_MEDIUM) return 'medium';
  return 'narrow';
}

const DEFAULT_LABELS: NowPlayingBarLabels = {
  lyrics: 'Lyrics',
  queue: 'Queue',
  devices: 'Connect to a device',
  fullscreen: 'Full screen',
};

/**
 * The desktop player bar, full width at the bottom of the window.
 *
 *   80 tall, 16 side inset, page background, 1px neutral-200 (dark 800) top rule
 *   left    56 cover (8 corner) · title / artists · like       flex 1, ≤ 30%
 *   centre  compact transport over the scrubber with times     flex 2, ≤ 722
 *   right   lyrics · queue · devices · volume · fullscreen     flex 1, end
 *
 * The width is MEASURED (seeded from the window) and collapses in two steps:
 * under 1024 the fullscreen button goes and the volume slider shortens to 64;
 * under 768 lyrics, volume and the scrubber's times go, and the device button
 * stays only while casting, and the actions column shrinks to what it draws.
 * The centre column never shrinks below 240.
 *
 * The toggles (lyrics, queue) are `aria-pressed` buttons painted accent + dot
 * when on; the device button lights the same way while `deviceName` is set.
 */
function NowPlayingBarComponent({
  track,
  onTitlePress,
  onArtistPress,
  liked = false,
  onLikedChange,
  transport,
  position,
  duration,
  buffered,
  onSeek,
  onSeekPreview,
  lyricsActive = false,
  onLyricsChange,
  queueActive = false,
  onQueueChange,
  deviceName,
  onDevicePress,
  devicePicker,
  devicePickerOpen,
  onDevicePickerOpenChange,
  volume = 1,
  onVolumeChange,
  muted,
  onMutedChange,
  onFullscreenPress,
  labels: labelOverrides,
  style,
  testID,
}: NowPlayingBarProps) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const [width, setWidth] = useState<number>(window.width);
  const layout = nowPlayingBarLayout(width);
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const casting = !!deviceName;
  const narrow = layout === 'narrow';

  const deviceButton = (
    <PlayerIconButton
      icon={DEVICE_GLYPHS.speaker}
      glyph={20}
      box={32}
      active={casting}
      accessibilityLabel={casting ? `${labels.devices}, ${deviceName}` : labels.devices}
      onPress={devicePicker ? undefined : onDevicePress}
      testID={id('devices')}
    />
  );
  const showDevice = (!!devicePicker || !!onDevicePress) && (!narrow || casting);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[
        {
          width: '100%',
          height: NOW_PLAYING_BAR_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: hairlineOn(theme, theme.colors.background),
        },
        style,
      ]}
      testID={testID}
      {...webDataSet({ bloomPlayerLayout: layout })}
    >
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          maxWidth: narrow ? undefined : '30%',
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
        testID={id('track')}
      >
        <Artwork source={track.artwork} size={56} radius={8} />
        <TrackText
          track={track}
          titleVariant="body-medium"
          artistVariant="caption-1-regular"
          titleColor={paint.text}
          artistColor={paint.textMuted}
          onTitlePress={onTitlePress}
          onArtistPress={onArtistPress}
          titleLabel={labels.openTrack}
          trailingTitle={track.explicit ? <ExplicitBadge size="small" /> : null}
          testID={id('track')}
        />
        {onLikedChange ? (
          <LikeButton liked={liked} onLikedChange={onLikedChange} size="small" testID={id('like')} />
        ) : null}
      </View>

      <View
        style={{ flexGrow: narrow ? 1.4 : 2, flexShrink: 1, flexBasis: 0, maxWidth: 722, minWidth: 240, alignItems: 'center', gap: 4 }}
        testID={id('center')}
      >
        <TransportControls
          {...transport}
          subject={transport.subject ?? track.title}
          size="compact"
          testID={id('transport')}
        />
        <PlaybackProgress
          value={position}
          duration={duration}
          buffered={buffered}
          onSeek={onSeek}
          onSeekPreview={onSeekPreview}
          showTimes={!narrow}
          disabled={transport.disabled}
          style={{ alignSelf: 'stretch' }}
          testID={id('progress')}
        />
      </View>

      <View
        style={{
          // Narrow: the actions take only what they draw, so the track keeps the room.
          flexGrow: narrow ? 0 : 1,
          flexShrink: narrow ? 0 : 1,
          flexBasis: narrow ? 'auto' : 0,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
        }}
        testID={id('actions')}
      >
        {onLyricsChange && !narrow ? (
          <PlayerIconButton
            icon={RiMicLine}
            glyph={20}
            box={32}
            pressed={lyricsActive}
            accessibilityLabel={labels.lyrics}
            onPress={() => onLyricsChange(!lyricsActive)}
            testID={id('lyrics')}
          />
        ) : null}
        {onQueueChange ? (
          <PlayerIconButton
            icon={RiPlayListLine}
            glyph={20}
            box={32}
            pressed={queueActive}
            accessibilityLabel={labels.queue}
            onPress={() => onQueueChange(!queueActive)}
            testID={id('queue')}
          />
        ) : null}
        {showDevice ? (
          devicePicker ? (
            <Popover open={devicePickerOpen} onOpenChange={onDevicePickerOpenChange}>
              <PopoverTrigger asChild label={labels.devices}>
                {deviceButton}
              </PopoverTrigger>
              <PopoverContent label={labels.devices} side="top" align="end" style={{ width: 320 }}>
                {devicePicker}
              </PopoverContent>
            </Popover>
          ) : (
            deviceButton
          )
        ) : null}
        {onVolumeChange && !narrow ? (
          <VolumeControl
            volume={volume}
            onVolumeChange={onVolumeChange}
            muted={muted}
            onMutedChange={onMutedChange}
            sliderWidth={layout === 'wide' ? 96 : 64}
            testID={id('volume')}
          />
        ) : null}
        {onFullscreenPress && layout === 'wide' ? (
          <PlayerIconButton
            icon={RiFullscreenLine}
            glyph={20}
            box={32}
            accessibilityLabel={labels.fullscreen}
            onPress={onFullscreenPress}
            testID={id('fullscreen')}
          />
        ) : null}
      </View>
    </View>
  );
}

export const NowPlayingBar = memo(NowPlayingBarComponent);
NowPlayingBar.displayName = 'NowPlayingBar';
