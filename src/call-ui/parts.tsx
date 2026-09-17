import React, { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { RiDragMove2Line } from '../icons/remix/RiDragMove2Line';
import type { CallPaint } from './shared';
import type { CallPipCorner } from './types';

/**
 * The shared stage pieces: the wash behind a voice call, and the two scrims
 * that keep chrome legible over a video frame.
 *
 * Both are `react-native-svg` gradients, and both carry their alpha in
 * `stopOpacity` rather than in `stopColor`. react-native-svg DISCARDS the alpha
 * inside `stopColor` while CSS keeps it, so an `rgba()` stop renders correctly
 * on web and fully opaque on native — a scrim that hides the video it is meant
 * to sit over, on the one platform the video matters most.
 */

let gradientId = 0;

/**
 * The wash behind a voice call: the accent-mixed colour at the top fading into
 * the stage at the bottom, so the avatar sits in light and the controls sit in
 * the dark.
 */
export function CallStageBackdrop({ paint }: { paint: CallPaint }) {
  const id = useMemo(() => `bloom-call-stage-${gradientId++}`, []);
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID="call-stage-backdrop"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={paint.stageWash} stopOpacity={1} />
          <Stop offset="0.55" stopColor={paint.stage} stopOpacity={1} />
          <Stop offset="1" stopColor={paint.stage} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * A scrim pinned to one edge, transparent at the far end.
 *
 * `edge="top"` darkens under the top bar, `edge="bottom"` under the controls.
 * It is TRANSLUCENT on purpose: an opaque band would be a letterbox, and the
 * video is the content.
 */
export function CallScrim({
  paint,
  edge,
  height,
  opacity = 0.72,
}: {
  paint: CallPaint;
  edge: 'top' | 'bottom';
  height: number;
  opacity?: number;
}) {
  const id = useMemo(() => `bloom-call-scrim-${gradientId++}`, []);
  const from = edge === 'top' ? opacity : 0;
  const to = edge === 'top' ? 0 : opacity;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height,
        ...(edge === 'top' ? { top: 0 } : { bottom: 0 }),
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={paint.stage} stopOpacity={from} />
            <Stop offset="1" stopColor={paint.stage} stopOpacity={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * The local camera, pinned to one corner of the stage.
 *
 * With `onMove` the whole frame becomes ONE button that cycles the corners —
 * a drag has no keyboard and no screen-reader equivalent, and a 24px grab
 * handle inside a 96px frame is a smaller target than the frame itself. The
 * move glyph stays as a decorative hint (`aria-hidden` by having no role and
 * no text) so the affordance is visible without being a second control.
 */
export function PictureInPicture({
  corner,
  width,
  borderColor,
  backgroundColor,
  hintColor,
  hintBackground,
  moveLabel,
  onMove,
  children,
  testID,
}: {
  corner: CallPipCorner;
  width: number;
  borderColor: string;
  backgroundColor: string;
  hintColor: string;
  hintBackground: string;
  moveLabel?: string;
  onMove?: () => void;
  children?: ReactNode;
  testID?: string;
}) {
  const frame: ViewStyle = {
    position: 'absolute',
    width,
    height: Math.round(width * PIP_ASPECT),
    borderRadius: PIP_RADIUS,
    borderWidth: 1,
    borderColor,
    backgroundColor,
    overflow: 'hidden',
    ...cornerInsets(corner),
  };

  const body = (
    <>
      {children}
      {onMove === undefined ? null : (
        // The hint needs its own backing: the frame behind it is the user's own
        // camera, which is as likely to be a bright window as a dark room, and a
        // bare glyph disappears into one of them.
        <View
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hintBackground,
          }}
          pointerEvents="none"
        >
          <RiDragMove2Line width={14} height={14} fill={hintColor} />
        </View>
      )}
    </>
  );

  if (onMove === undefined) {
    return (
      <View style={frame} testID={testID}>
        {body}
      </View>
    );
  }

  return (
    <Pressable role="button" accessibilityLabel={moveLabel} onPress={onMove} style={frame} testID={testID}>
      {body}
    </Pressable>
  );
}

/** PiP geometry: 96 × 140 at the default width, rounded like a tile. */
const PIP_ASPECT = 1.46;
const PIP_RADIUS = 14;
const PIP_INSET = 12;
/** Clears the top bar, so the PiP never lands on the minimise button. */
const PIP_TOP_INSET = 96;

function cornerInsets(corner: CallPipCorner): ViewStyle {
  const vertical: ViewStyle =
    corner === 'top-left' || corner === 'top-right'
      ? { top: PIP_TOP_INSET }
      : { bottom: PIP_INSET };
  const horizontal: ViewStyle =
    corner === 'top-left' || corner === 'bottom-left' ? { left: PIP_INSET } : { right: PIP_INSET };
  return { ...vertical, ...horizontal };
}
