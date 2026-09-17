import React, { memo, useContext, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, type LayoutChangeEvent } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { webDataSet } from '../checkbox/shared';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiPlayListLine } from '../icons/remix/RiPlayListLine';
import { RiShareLine } from '../icons/remix/RiShareLine';
import { ExplicitBadge } from '../media-controls/ExplicitBadge';
import { LikeButton } from '../media-controls/LikeButton';
import { PlaybackProgress } from '../media-controls/PlaybackProgress';
import { resolveMediaControlsPaint } from '../media-controls/shared';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEVICE_GLYPHS } from './device-icons';
import { ImmersiveTheme, immersiveDarkTheme } from './ImmersiveTheme';
import { PlayerIconButton } from './PlayerIconButton';
import { Artwork, TrackText } from './TrackText';
import { TransportControls } from './TransportControls';
import { immersiveBase, resolveArtworkTint, verticalGradient } from './shared';
import type { FullScreenPlayerLabels, FullScreenPlayerProps, LyricsPreview } from './types';

/** At and above this measured width the artwork sits beside the controls. */
export const FULL_SCREEN_PLAYER_WIDE = 900;
export const FULL_SCREEN_PLAYER_ARTWORK_MAX = 480;

const DEFAULT_LABELS: FullScreenPlayerLabels = {
  collapse: 'Close player',
  more: 'More options',
  devices: 'Connect to a device',
  share: 'Share',
  queue: 'Queue',
};

export interface FullScreenPlayerPaint {
  /** The artwork colour darkened for contrast, or `null` without one. */
  tint: string | null;
  /** The near-black the gradient ends on. */
  base: string;
  /** The below-the-fold card fill. */
  card: string;
}

function LyricsCard({ lyrics, card, testID }: { lyrics: LyricsPreview; card: string; testID?: string }) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const active = lyrics.activeIndex ?? -1;
  const body = (
    <>
      <Text variant="headline-semibold" style={{ color: paint.text }}>
        {lyrics.title ?? 'Lyrics'}
      </Text>
      <View style={{ gap: 4 }}>
        {lyrics.lines.map((line, i) => (
          <Text
            key={`${i}-${line}`}
            variant="title-3-bold"
            style={{ color: i < active ? paint.textMuted : paint.text }}
          >
            {line}
          </Text>
        ))}
      </View>
    </>
  );
  const style = { gap: 12, padding: 20, borderRadius: 16, backgroundColor: card };
  if (!lyrics.onPress) {
    return (
      <View style={style} testID={testID}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      accessibilityLabel={lyrics.actionLabel ?? 'Show lyrics'}
      onPress={lyrics.onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[style, hovered ? { backgroundColor: paint.wash } : null]}
      testID={testID}
    >
      {body}
    </Pressable>
  );
}

function FullScreenPlayerBody({
  track,
  contextLabel,
  contextName,
  onCollapse,
  onMore,
  onArtistPress,
  liked = false,
  onLikedChange,
  transport,
  position,
  duration,
  buffered,
  onSeek,
  onSeekPreview,
  deviceName,
  onDevicePress,
  onShare,
  queueActive = false,
  onQueuePress,
  lyrics,
  aboutArtist,
  labels: labelOverrides,
  style,
  testID,
  paint: surface,
}: FullScreenPlayerProps & { paint: FullScreenPlayerPaint }) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [size, setSize] = useState({ width: 0, height: 0 });
  const wide = size.width >= FULL_SCREEN_PLAYER_WIDE;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const DeviceGlyph = DEVICE_GLYPHS.speaker;
  const casting = !!deviceName;

  const gradient = verticalGradient(
    [surface.tint ?? surface.base, surface.base],
    [0, wide ? 100 : 72],
  );

  const topBar = (
    <View
      style={{ height: 56, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      testID={id('top-bar')}
    >
      <PlayerIconButton
        icon={RiArrowDownSLine}
        glyph={28}
        box={40}
        restColor={paint.text}
        accessibilityLabel={labels.collapse}
        onPress={onCollapse}
        testID={id('collapse')}
      />
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
        {contextLabel ? (
          <Text variant="caption-2-semibold" numberOfLines={1} style={{ color: paint.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {contextLabel}
          </Text>
        ) : null}
        {contextName ? (
          <Text variant="body-2-semibold" numberOfLines={1} style={{ color: paint.text }}>
            {contextName}
          </Text>
        ) : null}
      </View>
      <PlayerIconButton
        icon={RiMore2Fill}
        glyph={24}
        box={40}
        restColor={paint.text}
        accessibilityLabel={labels.more}
        onPress={onMore}
        disabled={!onMore}
        testID={id('more')}
      />
    </View>
  );

  const details = (
    <View style={{ gap: wide ? 24 : 16, width: '100%', maxWidth: FULL_SCREEN_PLAYER_ARTWORK_MAX }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <TrackText
            track={track}
            titleVariant={wide ? 'display-4-bold' : 'title-1-bold'}
            artistVariant={wide ? 'title-3-regular' : 'headline-regular'}
            titleColor={paint.text}
            artistColor={paint.textMuted}
            onArtistPress={onArtistPress}
            trailingTitle={track.explicit ? <ExplicitBadge /> : null}
            testID={id('track')}
          />
        </View>
        {onLikedChange ? (
          <LikeButton liked={liked} onLikedChange={onLikedChange} size="large" testID={id('like')} />
        ) : null}
      </View>
      <PlaybackProgress
        value={position}
        duration={duration}
        buffered={buffered}
        onSeek={onSeek}
        onSeekPreview={onSeekPreview}
        showTimes
        timesPosition="below"
        disabled={transport.disabled}
        testID={id('progress')}
      />
      <TransportControls
        {...transport}
        subject={transport.subject ?? track.title}
        size="large"
        style={{ justifyContent: 'space-between' }}
        testID={id('transport')}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID={id('bottom-row')}>
        {onDevicePress || casting ? (
          <Pressable
            role="button"
            accessibilityLabel={casting ? `${labels.devices}, ${deviceName}` : labels.devices}
            onPress={onDevicePress}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, flexShrink: 1, minWidth: 0 }}
            testID={id('devices')}
          >
            <View pointerEvents="none">
              <DeviceGlyph width={20} height={20} fill={casting ? paint.accent : paint.textMuted} />
            </View>
            {casting ? (
              <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: paint.accent, flexShrink: 1 }}>
                {deviceName}
              </Text>
            ) : null}
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }} />
        {onShare ? (
          <PlayerIconButton
            icon={RiShareLine}
            glyph={20}
            box={40}
            accessibilityLabel={labels.share}
            onPress={onShare}
            testID={id('share')}
          />
        ) : null}
        {onQueuePress ? (
          <PlayerIconButton
            icon={RiPlayListLine}
            glyph={20}
            box={40}
            pressed={queueActive}
            accessibilityLabel={labels.queue}
            onPress={onQueuePress}
            testID={id('queue')}
          />
        ) : null}
      </View>
    </View>
  );

  const artwork = (
    <View
      style={{
        width: '100%',
        maxWidth: FULL_SCREEN_PLAYER_ARTWORK_MAX,
        flexShrink: 1,
      }}
    >
      <Artwork source={track.artwork} size="100%" radius={16} testID={id('artwork')} />
    </View>
  );

  const belowFold = lyrics || aboutArtist ? (
    <View
      style={{
        flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'flex-start' : 'stretch',
        gap: 16,
        paddingLeft: wide ? 48 : 16,
        paddingRight: wide ? 48 : 16,
        paddingBottom: 32,
        width: '100%',
        maxWidth: wide ? 1080 : undefined,
        alignSelf: 'center',
      }}
      testID={id('below-fold')}
    >
      {lyrics ? (
        <View style={{ flex: wide ? 1 : undefined }}>
          <LyricsCard lyrics={lyrics} card={surface.card} testID={id('lyrics')} />
        </View>
      ) : null}
      {aboutArtist ? <View style={{ flex: wide ? 1 : undefined }}>{aboutArtist}</View> : null}
    </View>
  ) : null;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) =>
        setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
      {...webDataSet({ bloomFullScreenPlayer: wide ? 'wide' : 'narrow' })}
      style={[{ flex: 1, backgroundColor: surface.base }, style]}
      testID={testID}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 24 }}>
        <View
          style={[
            {
              minHeight: size.height || undefined,
              paddingLeft: wide ? 48 : 16,
              paddingRight: wide ? 48 : 16,
              paddingBottom: 24,
            },
            gradient,
          ]}
          testID={id('fold')}
        >
          {topBar}
          {wide ? (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 64,
                paddingTop: 16,
              }}
            >
              {artwork}
              {details}
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', gap: 24, paddingTop: 16 }}>
              <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {artwork}
              </View>
              {details}
            </View>
          )}
        </View>
        {belowFold}
      </ScrollView>
    </View>
  );
}

/**
 * The full-screen player: the phone's expanded player and the desktop's
 * immersive view. It fills its parent — present it as a route, or inside a
 * full-height sheet / dialog.
 *
 *   top bar      40 collapse chevron · "PLAYING FROM PLAYLIST" / "Night Drive" · 40 more
 *   narrow       square artwork (16 corner, ≤ 480) over the details
 *   wide ≥ 900   artwork and details side by side, 64 apart
 *   details      title + artists + like · scrubber with times below ·
 *                large transport · device / share / queue
 *   below fold   a lyrics preview card and the "about the artist" slot
 *
 * The first screen is exactly the parent's height (measured), painted with a
 * vertical gradient from the artwork colour — darkened until the dark theme's
 * text holds 4.5:1 — to neutral-950. It is ALWAYS dark: the content renders
 * under the dark theme (the app's accent kept), in a light app too.
 */
function FullScreenPlayerComponent(props: FullScreenPlayerProps) {
  const theme = useTheme();
  const ctx = useContext(BloomThemeContext);
  const paint = useMemo<FullScreenPlayerPaint>(() => {
    const dark = immersiveDarkTheme(theme, ctx?.colorPreset ?? 'oxy');
    const darkPaint = resolveMediaControlsPaint(dark);
    const tint = resolveArtworkTint(props.artworkColor, darkPaint.text, darkPaint.textMuted).background;
    const { neutral } = resolveButtonRamps(dark);
    return { tint, base: immersiveBase(dark.colors.text), card: tint ?? neutral[800] };
  }, [theme, ctx?.colorPreset, props.artworkColor]);

  return (
    <ImmersiveTheme>
      <FullScreenPlayerBody {...props} paint={paint} />
    </ImmersiveTheme>
  );
}

export const FullScreenPlayer = memo(FullScreenPlayerComponent);
FullScreenPlayer.displayName = 'FullScreenPlayer';
