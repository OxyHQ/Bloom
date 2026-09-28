import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useMessages } from '../locale/messages';
import { useTheme } from '../theme/use-theme';
import { MESSAGE_MEDIA_MESSAGES } from './messages';
import { MediaFailure, MediaImage, MediaOverlay, MediaPressable, MediaProgressRing } from './parts';
import { resolveMessageMediaPaint } from './shared';
import type { StickerMessageProps } from './types';

/** No placeholder colour: a sticker's transparent parts must stay transparent. */
const TRANSPARENT = 'transparent';

/**
 * A sticker: a transparent image and nothing else.
 *
 * IT DRAWS NO SURFACE AT ALL — no background, no radius, no padding — because a
 * sticker with a bubble behind it is a picture of a sticker. The shell renders it
 * with `variant="bare"`, which is `message-bubble`'s no-chrome mode; a bubble
 * around one would also put a scrim behind the transparent parts and turn a
 * cut-out into a square.
 *
 * `resizeMode` is `contain`, not `cover`: a sticker is authored at its own aspect
 * and cropping one cuts the drawing.
 *
 * The NAME matters more here than anywhere else in the family. A sticker IS its
 * meaning — there is no caption beside it and no text in the bubble — so a
 * sticker with no `accessibilityLabel` announces "Sticker" and conveys nothing.
 * Pass the emotion the pack author gave it.
 */
function StickerMessageComponent({
  source,
  sourceVariant,
  size = 128,
  accessibilityLabel: accessibilityLabelProp,
  onPress,
  state = 'idle',
  onRetry,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: StickerMessageProps) {
  const theme = useTheme();
  const { messages } = useMessages(MESSAGE_MEDIA_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.sticker;
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const sending = state === 'sending';

  return (
    <View style={[{ width: size }, style ?? null]} testID={testID}>
      <MediaPressable
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        ring={paint.ring}
        style={{ width: size, height: size, position: 'relative' }}
        ariaBusy={sending}
        testID={testID ? `${testID}-frame` : undefined}
      >
        <MediaImage
          source={source}
          sourceVariant={sourceVariant}
          placeholder={TRANSPARENT}
          resizeMode="contain"
          testID={testID ? `${testID}-image` : undefined}
        />
        {sending ? (
          <MediaOverlay>
            <MediaProgressRing
              size={32}
              color={paint.accent}
              track={paint.rail}
              fill="transparent"
              glyph="none"
              accessibilityLabel={messages.sendingSticker}
              ring={paint.ring}
            />
          </MediaOverlay>
        ) : null}
      </MediaPressable>
      {state === 'failed' ? <MediaFailure paint={paint} onRetry={onRetry} /> : null}
    </View>
  );
}

export const StickerMessage = memo(StickerMessageComponent);
StickerMessage.displayName = 'StickerMessage';
