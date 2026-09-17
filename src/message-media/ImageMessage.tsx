import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MediaFailure,
  MediaImage,
  MediaOverlay,
  MediaPressable,
  MediaProgressRing,
  SpoilerCover,
} from './parts';
import {
  fitMedia,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveMessageMediaPaint,
} from './shared';
import type { ImageMessageProps } from './types';

/**
 * One photo in a bubble.
 *
 * THE CORNERS ARE A PROP, NOT A CONSTANT. A photo is usually flush with the
 * bubble's edge, so the corner it shares with the bubble has to be the BUBBLE's
 * radius or the two draw two different arcs a pixel apart — which is why
 * `radius` is here and why `message-bubble`'s `media` slot passes its own.
 *
 * `spoiler` is a real cover, not an opacity: see `SpoilerCover` for why the
 * native one is opaque. Revealing is LOCAL state that latches — once shown, the
 * photo stays shown, because a spoiler that re-hides on every re-render is a
 * photo nobody can look at.
 *
 * Accessibility: the frame is a `button` NAMED by `accessibilityLabel` (default
 * "Photo"). Nothing inside it announces — the `Image` is `accessible={false}` —
 * so the name is the only thing a screen reader has, and a hidden spoiler says
 * so in its hint rather than by changing the name.
 */
function ImageMessageComponent({
  source,
  sourceVariant,
  aspectRatio = 1.4,
  maxWidth = MESSAGE_MEDIA_WIDTH,
  maxHeight = 320,
  radius = MESSAGE_MEDIA_RADIUS,
  placeholderColor,
  caption,
  spoiler = false,
  spoilerLabel = 'Tap to view',
  onReveal,
  state = 'idle',
  progress,
  onPress,
  onCancel,
  onRetry,
  accessibilityLabel = 'Photo',
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: ImageMessageProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const [revealed, setRevealed] = useState(false);
  const hidden = spoiler && !revealed;
  const { width, height } = fitMedia(aspectRatio, maxWidth, maxHeight);

  const handlePress = useCallback(() => {
    if (hidden) {
      setRevealed(true);
      onReveal?.();
      return;
    }
    onPress?.(0);
  }, [hidden, onPress, onReveal]);

  const frame: WebCssStyle = {
    width,
    height,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
  };

  const sending = state === 'sending';

  return (
    <View style={[{ width }, style ?? null]} testID={testID}>
      <MediaPressable
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={hidden ? spoilerLabel : undefined}
        onPress={onPress || hidden ? handlePress : undefined}
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
          testID={testID ? `${testID}-image` : undefined}
        />
        {hidden ? (
          <SpoilerCover
            label={spoilerLabel}
            paint={paint}
            radius={radius}
            testID={testID ? `${testID}-spoiler` : undefined}
          />
        ) : null}
        {sending ? (
          <MediaOverlay scrim={paint.scrim}>
            <MediaProgressRing
              progress={progress}
              color={paint.onScrim}
              track="rgba(255, 255, 255, 0.3)"
              fill="rgba(0, 0, 0, 0.35)"
              glyph={onCancel ? 'cancel' : 'none'}
              onPress={onCancel}
              accessibilityLabel={onCancel ? 'Cancel' : 'Sending photo'}
              ring={paint.ring}
              testID={testID ? `${testID}-progress` : undefined}
            />
          </MediaOverlay>
        ) : null}
      </MediaPressable>

      {caption ? (
        <View style={{ paddingTop: space.sm }}>
          {typeof caption === 'string' ? (
            <Text variant="body-regular" style={{ color: paint.text }}>
              {caption}
            </Text>
          ) : (
            caption
          )}
        </View>
      ) : null}

      {state === 'failed' ? (
        <MediaFailure
          paint={paint}
          onRetry={onRetry}
          testID={testID ? `${testID}-failed` : undefined}
        />
      ) : null}
    </View>
  );
}

export const ImageMessage = memo(ImageMessageComponent);
ImageMessage.displayName = 'ImageMessage';
