import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { formatDuration, PlayButton } from '../media-controls';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { formatFileSize } from '../file-upload/shared';
import { MediaFailure, MediaImage, MediaOverlay, MediaPill, MediaPressable, MediaProgressRing } from './parts';
import {
  fileMetaLine,
  fitMedia,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveMessageMediaPaint,
  VIDEO_NOTE_SIZE,
} from './shared';
import type { VideoMessageProps } from './types';

/** Stroke of the round note's progress ring. */
const NOTE_RING = 3;

/**
 * A video in a bubble, in two shapes.
 *
 * `thumbnail` — a poster frame with the shared `PlayButton` (`inverse`, so it is
 * a light disc with a dark glyph and reads on any frame) and a duration pill.
 * `watched` dims the pill and adds a tick rather than hiding anything: a watched
 * video is still a video, and removing its duration would make the two states
 * different SHAPES.
 *
 * `videoNote` — the round short note. The circle is a mask, the ring around it is
 * the playback position, and the duration sits under the button rather than in a
 * corner, because a rectangle's corner is outside a circle.
 *
 * The ring is drawn with `react-native-svg` and NOT with a border trick: a border
 * can only be a full circle or four independent quarters, and a fraction of a
 * turn needs `strokeDasharray`.
 */
function VideoNoteRing({
  size,
  value,
  color,
  track,
}: {
  size: number;
  value: number;
  color: string;
  track: string;
}) {
  const radius = (size - NOTE_RING) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: '-90deg' }] }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={NOTE_RING} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={NOTE_RING}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - value)}
        />
      </Svg>
    </View>
  );
}

/**
 * The centred play disc.
 *
 * It IS `media-controls`' `PlayButton` — one play affordance in the library —
 * but rendered with no handler and hidden from both the pointer and assistive
 * tech, because the press target here is the whole poster frame. A `PlayButton`
 * with its own `onPress` inside a pressable frame would be a second `role`
 * `button` nested in the first: the inner one swallows the press on web, and a
 * screen reader reads the same action twice.
 */
function PlayGlyph({ playing }: { playing: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <PlayButton playing={playing} size="medium" variant="inverse" />
    </View>
  );
}

function VideoMessageComponent({
  source,
  sourceVariant,
  duration,
  durationLabel,
  position = 0,
  playing = false,
  watched = false,
  sizeLabel,
  sizeBytes,
  variant = 'thumbnail',
  width,
  aspectRatio = 16 / 9,
  radius = MESSAGE_MEDIA_RADIUS,
  placeholderColor,
  state = 'idle',
  progress,
  onPress,
  onCancel,
  onRetry,
  accessibilityLabel,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: VideoMessageProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );

  const clock = durationLabel ?? (typeof duration === 'number' ? formatDuration(duration) : undefined);
  const size = sizeLabel ?? (typeof sizeBytes === 'number' ? formatFileSize(sizeBytes) : undefined);
  const name = accessibilityLabel ?? fileMetaLine(['Video', clock]);
  const sending = state === 'sending';

  if (variant === 'videoNote') {
    const diameter = width ?? VIDEO_NOTE_SIZE;
    const fraction =
      typeof duration === 'number' && duration > 0
        ? Math.min(1, Math.max(0, position / duration))
        : 0;
    return (
      <View style={[{ width: diameter, alignItems: 'center' }, style ?? null]} testID={testID}>
        <MediaPressable
          accessibilityLabel={name}
          onPress={onPress}
          ring={paint.ring}
          style={{
            width: diameter,
            height: diameter,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          ariaBusy={sending}
          testID={testID ? `${testID}-frame` : undefined}
        >
          <MediaImage
            source={source}
            sourceVariant={sourceVariant}
            radius={diameter / 2}
            placeholder={placeholderColor ?? paint.placeholder}
          />
          <MediaOverlay>
            <PlayGlyph playing={playing} />
          </MediaOverlay>
        </MediaPressable>
        {/* The ring sits OUTSIDE the clipped frame, so it is not cut by the mask. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', width: diameter, height: diameter }}
        >
          <VideoNoteRing
            size={diameter}
            value={fraction}
            color={paint.accent}
            track={paint.rail}
          />
        </View>
        {clock ? (
          <View style={{ paddingTop: space.sm, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="caption-1-regular" style={{ color: paint.textMuted }}>
              {clock}
            </Text>
            {watched ? <RiCheckLine width={12} height={12} fill={paint.textMuted} /> : null}
          </View>
        ) : null}
        {state === 'failed' ? <MediaFailure paint={paint} onRetry={onRetry} /> : null}
      </View>
    );
  }

  const frameWidth = width ?? MESSAGE_MEDIA_WIDTH;
  const fitted = fitMedia(aspectRatio, frameWidth, Math.round(frameWidth / 0.6));
  const frame: WebCssStyle = {
    width: fitted.width,
    height: fitted.height,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <View style={[{ width: fitted.width }, style ?? null]} testID={testID}>
      <MediaPressable
        accessibilityLabel={name}
        onPress={onPress}
        ring={paint.ring}
        style={frame}
        ariaBusy={sending}
        testID={testID ? `${testID}-frame` : undefined}
      >
        <MediaImage
          source={source}
          sourceVariant={sourceVariant}
          radius={radius}
          placeholder={placeholderColor ?? paint.placeholder}
        />
        {sending ? (
          <MediaOverlay scrim={paint.scrim}>
            <MediaProgressRing
              progress={progress}
              color={paint.onScrim}
              track="rgba(255, 255, 255, 0.3)"
              fill="rgba(0, 0, 0, 0.35)"
              glyph={onCancel ? 'cancel' : 'none'}
              onPress={onCancel}
              accessibilityLabel={onCancel ? 'Cancel' : 'Sending video'}
              ring={paint.ring}
              testID={testID ? `${testID}-progress` : undefined}
            />
          </MediaOverlay>
        ) : (
          <MediaOverlay>
            <PlayGlyph playing={playing} />
          </MediaOverlay>
        )}
        {clock || size ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 8, top: 8, flexDirection: 'row', gap: 4 }}
          >
            {clock ? (
              <MediaPill
                label={clock}
                paint={paint}
                dim={watched}
                testID={testID ? `${testID}-duration` : undefined}
              />
            ) : null}
            {size ? <MediaPill label={size} paint={paint} dim /> : null}
          </View>
        ) : null}
        {watched ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: borderRadius.full,
              backgroundColor: paint.scrim,
            }}
            testID={testID ? `${testID}-watched` : undefined}
          >
            <RiCheckLine width={12} height={12} fill={paint.onScrim} />
          </View>
        ) : null}
      </MediaPressable>
      {state === 'failed' ? (
        <MediaFailure paint={paint} onRetry={onRetry} testID={testID ? `${testID}-failed` : undefined} />
      ) : null}
    </View>
  );
}

export const VideoMessage = memo(VideoMessageComponent);
VideoMessage.displayName = 'VideoMessage';
