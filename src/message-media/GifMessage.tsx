import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  MediaFailure,
  MediaImage,
  MediaOverlay,
  MediaPill,
  MediaPressable,
  MediaProgressRing,
} from './parts';
import {
  fitMedia,
  MESSAGE_MEDIA_RADIUS,
  resolveMessageMediaPaint,
} from './shared';
import type { GifMessageProps } from './types';

/**
 * A looping GIF.
 *
 * The PILL is not decoration — it is the only thing that tells a reader this
 * frame moves, which matters when it has not started (or never will: Android's
 * `Image` decodes an animated GIF as a still unless the app enables the animated
 * decoders in its Fresco config, so `playing={false}` plus the play glyph is the
 * honest state there rather than a bug to hide).
 *
 * A GIF is capped NARROWER than a photo (220 rather than 260): they are usually
 * low-resolution and scaling one to the full bubble width makes the artefacts
 * the subject.
 */
function GifMessageComponent({
  source,
  sourceVariant,
  aspectRatio = 1.4,
  maxWidth = 220,
  maxHeight = 260,
  radius = MESSAGE_MEDIA_RADIUS,
  placeholderColor,
  badgeLabel = 'GIF',
  playing = true,
  onPress,
  state = 'idle',
  progress,
  onRetry,
  accessibilityLabel = 'GIF',
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: GifMessageProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const { width, height } = fitMedia(aspectRatio, maxWidth, maxHeight);
  const sending = state === 'sending';

  const frame: WebCssStyle = {
    width,
    height,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <View style={[{ width }, style ?? null]} testID={testID}>
      <MediaPressable
        accessibilityLabel={accessibilityLabel}
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
        {!playing && !sending ? (
          <MediaOverlay scrim="rgba(0, 0, 0, 0.25)">
            <View
              pointerEvents="none"
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: borderRadius.full,
                backgroundColor: paint.scrim,
              }}
            >
              <RiPlayFill width={20} height={20} fill={paint.onScrim} />
            </View>
          </MediaOverlay>
        ) : null}
        {sending ? (
          <MediaOverlay scrim={paint.scrim}>
            <MediaProgressRing
              progress={progress}
              color={paint.onScrim}
              track="rgba(255, 255, 255, 0.3)"
              fill="rgba(0, 0, 0, 0.35)"
              glyph="none"
              accessibilityLabel="Sending GIF"
              ring={paint.ring}
            />
          </MediaOverlay>
        ) : null}
        <MediaPill
          label={badgeLabel}
          paint={paint}
          position={{ left: 8, bottom: 8 }}
          testID={testID ? `${testID}-badge` : undefined}
        />
      </MediaPressable>
      {state === 'failed' ? <MediaFailure paint={paint} onRetry={onRetry} /> : null}
    </View>
  );
}

export const GifMessage = memo(GifMessageComponent);
GifMessage.displayName = 'GifMessage';
