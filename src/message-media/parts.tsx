import React, { memo, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { webDataSet } from '../checkbox/shared';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiEyeOffLine } from '../icons/remix/RiEyeOffLine';
import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { RiRefreshLine } from '../icons/remix/RiRefreshLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import {
  IS_WEB,
  MESSAGE_MEDIA_CSS,
  MESSAGE_MEDIA_STYLE_ID,
  PROGRESS_RING_SIZE,
  type MessageMediaPaint,
} from './shared';
import { useMediaSource } from './use-media-source';
import type { MessageMediaSource } from './types';

/**
 * The pieces every block in `message-media` is built from.
 *
 * They are INTERNAL — the family's barrel publishes the message blocks, not the
 * frame, the pill or the ring. A pill that anybody can mount is a pill that
 * grows props for every caller; here it has exactly the four the blocks need.
 */

/** Adopts the family's one constructed sheet. Safe to call from every block. */
export function useMessageMediaCss(): void {
  useEffect(() => {
    adoptStyleSheet(MESSAGE_MEDIA_STYLE_ID, MESSAGE_MEDIA_CSS);
  }, []);
}

// ---------------------------------------------------------------------------
//  MediaPressable
// ---------------------------------------------------------------------------

export interface MediaPressableProps {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  role?: 'button' | 'link';
  ring: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
  ariaBusy?: boolean;
}

/**
 * The one pressable in the family.
 *
 * Every press target here is a `button` with an author-supplied NAME, because
 * none of them can be named by their contents: a photo, a waveform and a map
 * tile all render zero readable characters. The focus ring is CSS
 * (`:focus-visible` has no inline-style spelling), reached through the family's
 * adopted sheet by a `data-*` hook.
 */
export const MediaPressable = memo(function MediaPressable({
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  role = 'button',
  ring,
  style,
  children,
  testID,
  ariaBusy,
}: MediaPressableProps) {
  useMessageMediaCss();
  const base: WebCssStyle = { '--bloom-message-media-ring': ring };
  if (!onPress) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        role="img"
        aria-busy={ariaBusy || undefined}
        accessibilityState={ariaBusy ? { busy: true } : undefined}
        style={[base, style ?? null]}
        testID={testID}
      >
        {children}
      </View>
    );
  }
  return (
    <Pressable
      {...webDataSet({ bloomMessageMediaPressable: '' })}
      role={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      aria-busy={ariaBusy || undefined}
      aria-disabled={disabled || undefined}
      accessibilityState={{ busy: ariaBusy, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[base, style ?? null]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
//  MediaImage
// ---------------------------------------------------------------------------

export interface MediaImageProps {
  source: MessageMediaSource | undefined;
  sourceVariant?: string;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  radius?: number;
  /** Corner-by-corner, for an album cell. Overrides `radius`. */
  radii?: { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  /** The flat colour drawn under the photo, and shown while it loads. */
  placeholder: string;
  /** `contain` for a sticker, which must not be cropped. */
  resizeMode?: 'cover' | 'contain';
  testID?: string;
}

/**
 * A photo over its placeholder colour.
 *
 * The placeholder is the FRAME's background rather than the image's, so it is
 * visible for exactly as long as the image has not painted and needs no load
 * state, no listener and no re-render — which is what makes it work identically
 * on both platforms. A blurhash would need a decoder dependency; the flat
 * average colour a blurhash carries is the part that matters at bubble size.
 */
export const MediaImage = memo(function MediaImage({
  source,
  sourceVariant,
  width = '100%',
  height = '100%',
  radius = 0,
  radii,
  placeholder,
  resizeMode = 'cover',
  testID,
}: MediaImageProps) {
  const resolved = useMediaSource(source, sourceVariant);
  const corners = radii ?? {
    topLeft: radius,
    topRight: radius,
    bottomLeft: radius,
    bottomRight: radius,
  };
  const frame: WebCssStyle = {
    width,
    height,
    backgroundColor: placeholder,
    borderTopLeftRadius: corners.topLeft,
    borderTopRightRadius: corners.topRight,
    borderBottomLeftRadius: corners.bottomLeft,
    borderBottomRightRadius: corners.bottomRight,
    overflow: 'hidden',
  };
  return (
    <View style={frame} testID={testID}>
      {resolved ? (
        <Image
          source={resolved}
          resizeMode={resizeMode}
          style={{ width: '100%', height: '100%' }}
          accessible={false}
        />
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
//  MediaPill
// ---------------------------------------------------------------------------

export interface MediaPillProps {
  label: string;
  paint: MessageMediaPaint;
  /** A play glyph before the label, for a video cell's duration. */
  leadingPlay?: boolean;
  /** Absolute placement inside a media frame. */
  position?: { top?: number; right?: number; bottom?: number; left?: number };
  dim?: boolean;
  testID?: string;
}

/**
 * The dark capsule over a photo — a duration, a "GIF", a file size.
 *
 * It paints its own scrim rather than taking the bubble's colours: it sits on
 * the PHOTO, whose colours nothing here knows, so the only foreground that is
 * legible on every photo is white on a dark translucent capsule.
 */
export const MediaPill = memo(function MediaPill({
  label,
  paint,
  leadingPlay = false,
  position,
  dim = false,
  testID,
}: MediaPillProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: position ? 'absolute' : 'relative',
        ...(position ?? {}),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: leadingPlay ? 4 : 6,
        paddingRight: 6,
        borderRadius: borderRadius.full,
        backgroundColor: paint.scrim,
        opacity: dim ? 0.75 : 1,
      }}
      testID={testID}
    >
      {leadingPlay ? <RiPlayFill width={11} height={11} fill={paint.onScrim} /> : null}
      <Text variant="caption-2-medium" style={{ color: paint.onScrim }}>
        {label}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
//  MediaProgressRing
// ---------------------------------------------------------------------------

const RING_STROKE = 2.5;

export interface MediaProgressRingProps {
  /** 0..1. Omit for the indeterminate ring. */
  progress?: number;
  size?: number;
  /** The arc colour. */
  color: string;
  /** The unfilled arc. */
  track: string;
  /** The disc under the ring. */
  fill: string;
  /** `cancel` draws an X inside, `retry` a refresh glyph, `none` nothing. */
  glyph?: 'cancel' | 'retry' | 'error' | 'none';
  accessibilityLabel: string;
  onPress?: () => void;
  ring: string;
  testID?: string;
}

/**
 * The upload / download ring.
 *
 * A determinate ring is a `progressbar` and carries the three `aria-value*`
 * attributes AND a name — react-native-web drops `accessibilityValue` entirely,
 * so a ring that only sets the native spelling announces a progress bar with no
 * progress in it. The INDETERMINATE one is `aria-busy` instead, which is the
 * honest reading of "something is happening and nobody knows how much".
 *
 * It keeps turning under reduced motion: it reports a state, and a frozen
 * spinner reads as a stall rather than as calm.
 */
export const MediaProgressRing = memo(function MediaProgressRing({
  progress,
  size = PROGRESS_RING_SIZE,
  color,
  track,
  fill,
  glyph = 'cancel',
  accessibilityLabel,
  onPress,
  ring,
  testID,
}: MediaProgressRingProps) {
  useMessageMediaCss();
  const determinate = typeof progress === 'number' && Number.isFinite(progress);
  const value = determinate ? Math.min(1, Math.max(0, progress)) : 0;
  const radius = (size - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const rotation = useSharedValue(0);
  useEffect(() => {
    if (determinate) return undefined;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [determinate, rotation]);
  const spin = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );

  const Glyph =
    glyph === 'cancel'
      ? RiCloseLine
      : glyph === 'retry'
        ? RiRefreshLine
        : glyph === 'error'
          ? RiErrorWarningFill
          : null;

  const percent = Math.round(value * 100);
  const body = (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: fill,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            // The arc starts at the top rather than at three o'clock.
            transform: [{ rotate: '-90deg' }],
          },
          determinate ? null : spin,
        ]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={track}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference * (1 - (determinate ? value : 0.25))}
          />
        </Svg>
      </Animated.View>
      {Glyph ? <Glyph width={Math.round(size * 0.4)} height={Math.round(size * 0.4)} fill={color} /> : null}
    </View>
  );

  const rootStyle: WebCssStyle = { '--bloom-message-media-ring': ring };

  if (onPress) {
    return (
      <Pressable
        {...webDataSet({ bloomMessageMediaPressable: '' })}
        role="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={rootStyle}
        testID={testID}
      >
        {body}
      </Pressable>
    );
  }
  if (determinate) {
    return (
      <View
        role="progressbar"
        accessibilityLabel={accessibilityLabel}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${percent}%`}
        accessibilityValue={{ now: percent, min: 0, max: 100, text: `${percent}%` }}
        style={rootStyle}
        testID={testID}
      >
        {body}
      </View>
    );
  }
  return (
    <View
      role="img"
      accessibilityLabel={accessibilityLabel}
      aria-busy
      accessibilityState={{ busy: true }}
      style={rootStyle}
      testID={testID}
    >
      {body}
    </View>
  );
});

// ---------------------------------------------------------------------------
//  MediaOverlay — the centred affordance over a photo
// ---------------------------------------------------------------------------

export interface MediaOverlayProps {
  children: React.ReactNode;
  /** Darkens the whole frame under the affordance. */
  scrim?: string;
  testID?: string;
}

export const MediaOverlay = memo(function MediaOverlay({
  children,
  scrim,
  testID,
}: MediaOverlayProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: scrim,
      }}
      testID={testID}
    >
      {children}
    </View>
  );
});

// ---------------------------------------------------------------------------
//  SpoilerCover
// ---------------------------------------------------------------------------

export interface SpoilerCoverProps {
  label: string;
  paint: MessageMediaPaint;
  radius?: number;
  radii?: { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  testID?: string;
}

/**
 * What hides a photo until it is asked for.
 *
 * On WEB the cover is a translucent wash with a `backdrop-filter` blur, which is
 * the look the affordance wants. On NATIVE it is OPAQUE, and deliberately so: a
 * real blur there needs `expo-blur`, an optional peer this family does not take,
 * and a translucent cover with no blur behind it would show the photo it exists
 * to hide. A spoiler that half-works is not a spoiler.
 */
export const SpoilerCover = memo(function SpoilerCover({
  label,
  paint,
  radius = 0,
  radii,
  testID,
}: SpoilerCoverProps) {
  const corners = radii ?? {
    topLeft: radius,
    topRight: radius,
    bottomLeft: radius,
    bottomRight: radius,
  };
  const cover: WebCssStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: corners.topLeft,
    borderTopRightRadius: corners.topRight,
    borderBottomLeftRadius: corners.bottomLeft,
    borderBottomRightRadius: corners.bottomRight,
    backgroundColor: IS_WEB ? 'rgba(0, 0, 0, 0.35)' : paint.spoilerScrim,
    ...(IS_WEB ? { backdropFilter: 'blur(18px)' } : null),
  };
  return (
    <View pointerEvents="none" style={cover} testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingTop: 5,
          paddingBottom: 5,
          paddingLeft: 10,
          paddingRight: 12,
          borderRadius: borderRadius.full,
          backgroundColor: paint.scrim,
        }}
      >
        <RiEyeOffLine width={14} height={14} fill={paint.onScrim} />
        <Text variant="caption-1-medium" style={{ color: paint.onScrim }}>
          {label}
        </Text>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
//  MediaFailure — the "not sent" row under a failed attachment
// ---------------------------------------------------------------------------

export interface MediaFailureProps {
  paint: MessageMediaPaint;
  label?: string;
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
}

function retryStyle(hovered: boolean, paint: MessageMediaPaint): WebCssStyle {
  return {
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? paint.washStrong : paint.wash,
    '--bloom-message-media-ring': paint.ring,
  };
}

export const MediaFailure = memo(function MediaFailure({
  paint,
  label = 'Not sent',
  retryLabel = 'Retry',
  onRetry,
  testID,
}: MediaFailureProps) {
  useMessageMediaCss();
  const [hovered, setHovered] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingTop: space.sm,
      }}
      testID={testID}
    >
      <RiErrorWarningFill width={14} height={14} fill={paint.danger} />
      <Text variant="caption-1-regular" style={{ color: paint.danger, flexShrink: 1 }}>
        {label}
      </Text>
      {onRetry ? (
        <Pressable
          {...webDataSet({ bloomMessageMediaPressable: '' })}
          role="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={retryStyle(hovered, paint)}
        >
          <Text variant="caption-1-medium" style={{ color: paint.text }}>
            {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
//  Small helpers
// ---------------------------------------------------------------------------

/** A hover flag that costs one state hook and never fires on native. */
export function useHovered(): [boolean, { onHoverIn: () => void; onHoverOut: () => void }] {
  const [hovered, setHovered] = useState(false);
  const handlers = useMemo(
    () => ({ onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }),
    [],
  );
  return [hovered, handlers];
}
