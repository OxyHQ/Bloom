import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { webDataSet } from '../styles/web-data';
import { RiMapPin2Fill } from '../icons/remix/RiMapPin2Fill';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaPressable, useHovered, useMessageMediaCss } from './parts';
import {
  fileMetaLine,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveMessageMediaPaint,
  type MessageMediaPaint,
} from './shared';
import type { LocationMessageProps } from './types';

/** The placeholder grid's cell size, when the app renders no map. */
const GRID_CELL = 28;

/**
 * A neutral grid standing in for a map the app has not supplied.
 *
 * Bloom ships NO map engine — a tile provider is a dependency, a key and a
 * licence, none of which belong in a component library — so `renderMap` is the
 * slot the app fills. This is what the frame looks like until it does, and it is
 * deliberately abstract: a fake coastline would be a map of somewhere.
 */
function MapPlaceholder({ width, height, paint }: { width: number; height: number; paint: MessageMediaPaint }) {
  const columns = Math.ceil(width / GRID_CELL);
  const rows = Math.ceil(height / GRID_CELL);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width, height, backgroundColor: paint.wash }}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', height: GRID_CELL }}>
          {Array.from({ length: columns }, (_, column) => (
            <View
              key={column}
              style={{
                width: GRID_CELL,
                height: GRID_CELL,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderRightColor: paint.border,
                borderBottomColor: paint.border,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * The live dot: a solid core with a halo that expands and fades, once a second.
 *
 * It STOPS under reduced motion and keeps the solid core — unlike a spinner,
 * which reports "working" and has to keep moving, this reports "sharing", and
 * the word beside it already says so.
 *
 * The core is the RAW negative colour with a white ring around it, not a colour
 * mixed until it clears a contrast bar against the bubble. On the accent bubble
 * nothing red clears 3:1 without becoming either near-black or pink, and a live
 * dot that is not red has stopped saying the one thing it exists to say. A ring
 * separates it from whatever is behind it instead — the same move `PresenceDot`
 * makes for exactly the same reason.
 */
function LivePulse({ color, ringColor }: { color: string; ringColor: string }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return undefined;
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [reduced, pulse]);
  const halo = useAnimatedStyle(
    () => ({ opacity: 0.45 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 1.8 }] }),
    [pulse],
  );
  return (
    <View
      pointerEvents="none"
      style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: borderRadius.full,
            backgroundColor: color,
          },
          halo,
        ]}
      />
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: borderRadius.full,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: ringColor,
        }}
      />
    </View>
  );
}

/**
 * A place, or a live share of one.
 *
 * The frame is one press target — the whole map opens it — and the "Stop
 * sharing" action is a SEPARATE control below the frame rather than an overlay
 * on it, because it is destructive and must not be one mis-tap away from
 * "open the map".
 *
 * "Live until 18:30" arrives PRE-FORMATTED. A component that formats a time has
 * to read the clock, and a component that reads the clock renders differently in
 * every test and every timezone.
 */
function LocationMessageComponent({
  title,
  address,
  renderMap,
  live = false,
  liveUntilLabel,
  stopSharingLabel = 'Stop sharing',
  onStopSharing,
  onPress,
  width = MESSAGE_MEDIA_WIDTH,
  mapHeight = 140,
  radius = MESSAGE_MEDIA_RADIUS,
  accessibilityLabel,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: LocationMessageProps) {
  const theme = useTheme();
  useMessageMediaCss();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const [stopHovered, stopHandlers] = useHovered();

  const name =
    accessibilityLabel ?? fileMetaLine([live ? 'Live location' : 'Location', title, address]);

  const frame: WebCssStyle = {
    width,
    height: mapHeight,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: paint.wash,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const stopStyle: WebCssStyle = {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: borderRadius.full,
    backgroundColor: stopHovered ? paint.washStrong : paint.wash,
    '--bloom-message-media-ring': paint.ring,
  };

  return (
    <View style={[{ width }, style ?? null]} testID={testID}>
      <MediaPressable
        accessibilityLabel={name}
        onPress={onPress}
        ring={paint.ring}
        style={frame}
        testID={testID ? `${testID}-map` : undefined}
      >
        {renderMap ? (
          renderMap({ width, height: mapHeight })
        ) : (
          <MapPlaceholder width={width} height={mapHeight} paint={paint} />
        )}
        <View
          pointerEvents="none"
          style={{ alignItems: 'center', justifyContent: 'center' }}
          testID={testID ? `${testID}-pin` : undefined}
        >
          {live ? (
            <LivePulse color={theme.colors.error} ringColor={paint.onScrim} />
          ) : (
            <RiMapPin2Fill width={28} height={28} fill={paint.accent} />
          )}
        </View>
      </MediaPressable>

      {title || address || liveUntilLabel ? (
        <View style={{ paddingTop: space.sm, gap: 2 }}>
          {title ? (
            <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
              {title}
            </Text>
          ) : null}
          {address ? (
            <Text variant="caption-1-regular" numberOfLines={2} style={{ color: paint.textMuted }}>
              {address}
            </Text>
          ) : null}
          {live && liveUntilLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: borderRadius.full,
                  backgroundColor: paint.live,
                }}
              />
              <Text
                variant="caption-1-medium"
                style={{ color: paint.textMuted }}
                testID={testID ? `${testID}-live` : undefined}
              >
                {liveUntilLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {live && onStopSharing ? (
        <Pressable
          {...webDataSet({ bloomMessageMediaPressable: '' })}
          {...stopHandlers}
          role="button"
          accessibilityLabel={stopSharingLabel}
          onPress={onStopSharing}
          style={stopStyle}
          testID={testID ? `${testID}-stop` : undefined}
        >
          <Text variant="caption-1-medium" style={{ color: paint.danger }}>
            {stopSharingLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const LocationMessage = memo(LocationMessageComponent);
LocationMessage.displayName = 'LocationMessage';
