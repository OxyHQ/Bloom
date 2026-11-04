import type React from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { BloomImage } from '../image';

import { webDataSet } from '../styles/web-data';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiEyeOffLine } from '../icons/remix/RiEyeOffLine';
import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import {
  MESSAGE_MEDIA_CSS,
  MESSAGE_MEDIA_STYLE_ID,
  PROGRESS_RING_SIZE,
  type MessageMediaPaint,
} from './shared';
import { useMediaSource } from './use-media-source';
import { useMessageMediaHold } from './context';
import type { MessageMediaSource } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { MESSAGE_MEDIA_MESSAGES } from './messages';
import { IS_WEB } from '../styles/platform';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { MeterRing } from '../stat-bar';

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
//  HoldPressable
// ---------------------------------------------------------------------------

/**
 * `Pressable`, plus the enclosing bubble's long press when it has none of its
 * own (`context.ts`). Every pressable in this family is one, so holding any
 * part of a media block opens the message menu, as holding its text does.
 */
export function HoldPressable({ onLongPress, ...props }: PressableProps) {
  const hold = useMessageMediaHold();
  return <Pressable {...props} onLongPress={onLongPress ?? hold} />;
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
    <HoldPressable
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
    </HoldPressable>
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
        <BloomImage
          source={resolved}
          contentFit={resizeMode}
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
  /** `cancel` draws an X inside, `none` nothing. */
  glyph?: 'cancel' | 'none';
  accessibilityLabel: string;
  onPress?: () => void;
  ring: string;
  testID?: string;
}

/**
 * The upload / download ring: a `MeterRing` on a disc.
 *
 * Without `onPress` it IS the `MeterRing` — a determinate `progressbar` with
 * its value, or an indeterminate one (`aria-busy`, no value) whose quarter arc
 * keeps turning under reduced motion: it reports a state, and a frozen spinner
 * reads as a stall rather than as calm.
 *
 * With `onPress` the whole ring is the family's named button (the cancel), so
 * the ring inside is decorative: a `progressbar` nested in a button is flattened
 * into the button's name, which is why it carries no role of its own there.
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
  const percent = determinate ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : 0;
  const geometry = {
    value: percent,
    max: 100,
    size,
    thickness: RING_STROKE,
    fill: color,
    track,
    backdrop: fill,
    indeterminate: !determinate,
  };
  const glyphSize = Math.round(size * 0.4);
  const centre =
    glyph === 'cancel' ? <RiCloseLine width={glyphSize} height={glyphSize} fill={color} /> : null;

  if (onPress) {
    const rootStyle: WebCssStyle = { '--bloom-message-media-ring': ring };
    return (
      <HoldPressable
        {...webDataSet({ bloomMessageMediaPressable: '' })}
        role="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={rootStyle}
        testID={testID}
      >
        <MeterRing {...geometry} decorative>
          {centre}
        </MeterRing>
      </HoldPressable>
    );
  }
  return (
    <MeterRing
      {...geometry}
      role="progressbar"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {centre}
    </MeterRing>
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
 * to hide. A spoiler that half-works is not a spoiler. With transparency reduced
 * (`useReducedTransparency()`) the web cover is the native one, opaque.
 */
export const SpoilerCover = memo(function SpoilerCover({
  label,
  paint,
  radius = 0,
  radii,
  testID,
}: SpoilerCoverProps) {
  const reduced = useReducedTransparency();
  const frosted = IS_WEB && !reduced;
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
    backgroundColor: frosted ? 'rgba(0, 0, 0, 0.35)' : paint.spoilerScrim,
    ...(frosted ? { backdropFilter: 'blur(18px)' } : null),
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
  label: labelProp,
  retryLabel: retryLabelProp,
  onRetry,
  testID,
}: MediaFailureProps) {
  const common = useCommonMessages();
  const { messages } = useMessages(MESSAGE_MEDIA_MESSAGES);
  const label = labelProp ?? messages.notSent;
  const retryLabel = retryLabelProp ?? common.retry;
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
        <HoldPressable
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
        </HoldPressable>
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
