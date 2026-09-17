import React, { memo, useId } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';

import {
  CHAT_PATTERN_GLYPHS,
  CHAT_PATTERN_TILE,
  DEFAULT_PATTERN_OPACITY,
  useChatScreenPaint,
  useResolvedImageSource,
  type ChatScreenPaint,
} from './shared';
import type { ChatBackgroundProps } from './types';

/**
 * The repeated-glyph wallpaper, as ONE `<Pattern>` tile the renderer repeats.
 *
 * The glyphs are stroked, not filled, and written directly in tile coordinates —
 * `react-native-svg`'s per-element transform props are deprecated and the string
 * form has to agree across two renderers, so nothing here is placed by a
 * transform.
 *
 * The ink is a neutral ramp step, never the accent: an accent-tinted wallpaper
 * competes with the outgoing bubble, which IS the accent.
 */
function PatternLayer({
  paint,
  tint,
  opacity,
}: {
  paint: ChatScreenPaint;
  tint?: string;
  opacity: number;
}) {
  // One id per instance. Two wallpapers on one page (a split layout showing two
  // conversations) would otherwise both resolve `url(#chat-pattern)` to whichever
  // `<Defs>` the document happened to parse last.
  const id = `chat-pattern-${useId().replace(/[^A-Za-z0-9-]/g, '')}`;
  const ink = tint ?? paint.patternTint;
  return (
    // The `testID` sits on a View, not on the `<Svg>`: an SVG host element is not
    // a react-native-web View, so `testID` reaches it as a lowercase DOM
    // attribute and never becomes `data-testid`.
    <View
      pointerEvents="none"
      testID="chat-background-pattern"
      style={StyleSheet.absoluteFillObject}
    >
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <Pattern
            id={id}
            x={0}
            y={0}
            width={CHAT_PATTERN_TILE}
            height={CHAT_PATTERN_TILE}
            patternUnits="userSpaceOnUse"
          >
            {CHAT_PATTERN_GLYPHS.map((d, i) => (
              <Path
                key={i}
                d={d}
                fill="none"
                stroke={ink}
                strokeOpacity={opacity}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function GradientLayer({ colors }: { colors: string[] }) {
  const id = `chat-gradient-${useId().replace(/[^A-Za-z0-9-]/g, '')}`;
  const last = colors.length - 1;
  return (
    <View
      pointerEvents="none"
      testID="chat-background-gradient"
      style={StyleSheet.absoluteFillObject}
    >
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
            {colors.map((color, i) => (
              // Opaque stops only: react-native-svg DISCARDS the alpha inside
              // `stopColor`, so an `rgba()` token here renders correctly on web
              // and opaque on native — the wallpaper would differ per platform
              // with nothing to say so.
              <Stop key={i} offset={last === 0 ? 0 : i / last} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * The wallpaper behind the transcript, and the container the transcript sits in.
 *
 * Four variants, all of them OPAQUE from the page colour up, so a bubble drawn
 * over any of them is composited over a known colour rather than over whatever
 * the app's own background happens to be.
 *
 * WHY THE IMAGE DIM IS NOT OPTIONAL: a consumer photo has no knowable extremes,
 * so nothing can be proven about a bubble's separation from it. Dimming toward a
 * fixed neutral (a mid-light step in light, near-black in dark) at a fixed
 * opacity gives the wallpaper a measurable lightest and darkest pixel — see
 * `chatBackgroundExtremes` and the measured table in `docs/chat-screen.mdx`.
 * Dimming toward pure WHITE was the first attempt and it is the bug: the
 * wallpaper's brightest reachable pixel then lands exactly on the card colour, so
 * a white incoming bubble over a bright photo separates by 1.00. Lowering
 * `overlayOpacity` is a legibility decision, not a taste one.
 *
 * Bubble text is unaffected by any of this: a bubble is an opaque fill, so its
 * own label contrast is a property of the bubble, not of what is behind it. What
 * the wallpaper CAN do is stop the bubble being told apart from the page.
 */
function ChatBackgroundComponent({
  variant = 'plain',
  source,
  overlayOpacity,
  tint,
  patternOpacity = DEFAULT_PATTERN_OPACITY,
  colors,
  children,
  style,
  testID,
}: ChatBackgroundProps) {
  const paint = useChatScreenPaint();
  const image = useResolvedImageSource(source, 'large');
  const dim = overlayOpacity ?? paint.imageDimOpacity;
  const gradientColors = colors ?? [...paint.gradient];

  return (
    <View
      testID={testID}
      style={[{ flex: 1, overflow: 'hidden', backgroundColor: paint.page }, style]}
    >
      {variant === 'pattern' ? (
        <PatternLayer paint={paint} tint={tint} opacity={patternOpacity} />
      ) : null}
      {variant === 'gradient' ? <GradientLayer colors={gradientColors} /> : null}
      {variant === 'image' && image ? (
        <>
          <Image
            source={image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="chat-background-image"
            style={StyleSheet.absoluteFillObject}
          />
          <View
            pointerEvents="none"
            testID="chat-background-dim"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: paint.imageDim, opacity: dim },
            ]}
          />
        </>
      ) : null}
      {children}
    </View>
  );
}

export const ChatBackground = memo(ChatBackgroundComponent);
ChatBackground.displayName = 'ChatBackground';
