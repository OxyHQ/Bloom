import React, { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useMessages } from '../locale/messages';
import { MESSAGE_MEDIA_MESSAGES } from '../message-media/messages';
import { MediaImage } from '../message-media/parts';
import type { ComponentType } from 'react';
import type { LottiePlayerProps, StickerProps } from './types';

export interface StickerPlatform {
  /** The platform's Lottie player, or `null` when its optional peer is missing. */
  loadLottiePlayer(): ComponentType<LottiePlayerProps> | null;
  warnLottieUnavailable(): void;
}

/** A sticker's transparent parts must stay transparent: no placeholder colour. */
const TRANSPARENT = 'transparent';

/**
 * A sticker, animated when it can be and still when it cannot.
 *
 * The still `fallback` is ALWAYS drawn first and stays until the animation
 * reports it has loaded, so a sticker never flashes blank while its Lottie file
 * arrives — and when the animation cannot play at all (no player installed on
 * this platform, a failed load, a person who asked for reduced motion) the still
 * is simply what remains. Every one of those outcomes looks like a sticker.
 *
 * Draws no surface: no background, no radius, no padding. A sticker with a
 * bubble behind it is a picture of a sticker. `StickerMessage` is this plus the
 * chat affordances (press, sending, failed).
 */
export function createSticker({
  loadLottiePlayer,
  warnLottieUnavailable,
}: StickerPlatform) {
  function StickerComponent({
    animation,
    fallback,
    size = 128,
    loop = true,
    paused = false,
    accessibilityLabel: accessibilityLabelProp,
    decorative = false,
    style,
    testID,
  }: StickerProps) {
    const { messages } = useMessages(MESSAGE_MEDIA_MESSAGES);
    const reducedMotion = useReducedMotion();
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    // A new animation starts from its still again.
    useEffect(() => {
      setLoaded(false);
      setFailed(false);
    }, [animation]);

    const Player =
      animation && !reducedMotion && !failed ? loadLottiePlayer() : null;
    useEffect(() => {
      if (animation && !reducedMotion && !Player) warnLottieUnavailable();
    }, [animation, reducedMotion, Player]);

    const onLoad = useCallback(() => setLoaded(true), []);
    const onError = useCallback(() => setFailed(true), []);

    const showStill = !Player || !loaded;

    return (
      <View
        accessible={!decorative}
        accessibilityRole={decorative ? undefined : 'image'}
        accessibilityLabel={decorative ? undefined : accessibilityLabelProp ?? messages.sticker}
        aria-hidden={decorative}
        style={[
          { width: size, height: size, position: 'relative' },
          style ?? null,
        ]}
        testID={testID}
      >
        {showStill ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
            }}
          >
            <MediaImage
              source={fallback}
              placeholder={TRANSPARENT}
              resizeMode='contain'
              testID={testID ? `${testID}-still` : undefined}
            />
          </View>
        ) : null}
        {Player && animation ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              opacity: loaded ? 1 : 0,
            }}
            testID={testID ? `${testID}-animation` : undefined}
          >
            <Player
              uri={animation}
              loop={loop}
              paused={paused}
              onLoad={onLoad}
              onError={onError}
              style={{ width: size, height: size }}
            />
          </View>
        ) : null}
      </View>
    );
  }

  const Sticker = memo(StickerComponent);
  Sticker.displayName = 'Sticker';
  return Sticker;
}
