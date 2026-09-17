import React, { memo, useEffect, useMemo, useState } from 'react';
import { Platform, Text as RNText } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { resolveButtonRamps } from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { parseRgba } from '../theme/color-utils';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { AgentProgressLoadingTextProps } from './types';

/**
 * A label in `text-secondary` with a soft `text-primary`
 * highlight travelling across it, one sweep every 3.4s, static under reduced
 * motion.
 *
 * Web draws the shimmer with CSS — a 300%-wide `linear-gradient(100deg, …)`
 * clipped to the glyphs (`background-clip: text`) whose `background-position`
 * runs 200% → -100%. The sheet is self-injected through `adoptStyleSheet`, one
 * rule per resolved colour pair, and hung off a `dataSet` attribute because a
 * class never reaches the DOM from a react-native-web `Text`.
 *
 * Native has no `background-clip: text` (and Bloom takes no masked-view
 * dependency), so the same gradient is SAMPLED per character: each glyph is a
 * nested span whose colour is the gradient at that glyph's centre, re-sampled
 * on a 50ms tick. Glyph centres assume even advance widths — the highlight is
 * ±36% of the label wide, so the approximation is not visible.
 */

const IS_WEB = Platform.OS === 'web';

/** The shimmer duration. */
export const SHIMMER_PERIOD_MS = 3400;
const NATIVE_TICK_MS = 50;

const KEYFRAMES = 'bloom-agent-progress-shimmer';

function shimmerKey(base: string, highlight: string): string {
  return `${base}_${highlight}`.replace(/[^a-zA-Z0-9]/g, '');
}

/** The sheet for one colour pair. Exported for the web test. */
export function agentProgressShimmerCss(key: string, base: string, highlight: string): string {
  const sel = `[data-bloom-agent-progress-shimmer="${key}"]`;
  return `
@keyframes ${KEYFRAMES} {
  from { background-position: 200% center; }
  to { background-position: -100% center; }
}
${sel} {
  color: transparent !important;
  background-image: linear-gradient(100deg, ${base} 16%, ${base} 38%, ${highlight} 50%, ${base} 62%, ${base} 84%);
  background-position: 200% center;
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${KEYFRAMES} ${SHIMMER_PERIOD_MS / 1000}s linear infinite;
  will-change: background-position;
}
@media (prefers-reduced-motion: reduce) {
  ${sel} {
    color: ${base} !important;
    background-image: none;
    animation: none;
  }
}
`;
}

/**
 * Highlight strength (0–1) at `x` (0–1 across the label) at `phase` (0–1 of a
 * sweep): the CSS gradient's geometry, background tiles included. The tile is
 * 3 label-widths; its centre (the `text-primary` stop) travels from -2.5 to
 * 3.5 widths; the ramp to `text-secondary` is 12% of the tile (0.36 widths).
 */
export function shimmerStrength(x: number, phase: number): number {
  const center = -2.5 + 6 * phase;
  let distance = Infinity;
  for (let k = -2; k <= 2; k++) distance = Math.min(distance, Math.abs(x - (center + 3 * k)));
  return Math.max(0, 1 - distance / 0.36);
}

function mix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  const ch = (p: number, q: number) => Math.round(p + (q - p) * t);
  return `rgb(${ch(a.r, b.r)}, ${ch(a.g, b.g)}, ${ch(a.b, b.b)})`;
}

function AgentProgressLoadingTextComponent({
  children,
  variant = 'body-medium',
  style,
  numberOfLines = 1,
  testID,
}: AgentProgressLoadingTextProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const base = resolveButtonRamps(theme).neutral[500];
  const highlight = theme.colors.text;
  const key = shimmerKey(base, highlight);

  useEffect(() => {
    if (!IS_WEB) return;
    adoptStyleSheet(`bloom-agent-progress-shimmer-${key}`, agentProgressShimmerCss(key, base, highlight));
  }, [key, base, highlight]);

  // Native: a phase clock, only while the shimmer runs.
  const [phase, setPhase] = useState(0);
  const animateNative = !IS_WEB && !reducedMotion;
  useEffect(() => {
    if (!animateNative) return;
    const started = Date.now();
    const id = setInterval(() => {
      setPhase(((Date.now() - started) % SHIMMER_PERIOD_MS) / SHIMMER_PERIOD_MS);
    }, NATIVE_TICK_MS);
    return () => clearInterval(id);
  }, [animateNative]);

  const glyphs = useMemo(() => Array.from(children), [children]);
  const baseRgb = useMemo(() => parseRgba(base), [base]);
  const highlightRgb = useMemo(() => parseRgba(highlight), [highlight]);

  if (IS_WEB) {
    return (
      <Text
        variant={variant}
        numberOfLines={numberOfLines}
        accessibilityLabel={children}
        testID={testID}
        style={[{ color: base }, style]}
        {...({ dataSet: { bloomAgentProgressShimmer: key } } as Record<string, unknown>)}
      >
        {children}
      </Text>
    );
  }

  const content =
    animateNative && baseRgb && highlightRgb
      ? glyphs.map((glyph, index) => {
          const strength = shimmerStrength((index + 0.5) / glyphs.length, phase);
          return (
            <RNText key={index} style={{ color: strength > 0 ? mix(baseRgb, highlightRgb, strength) : base }}>
              {glyph}
            </RNText>
          );
        })
      : children;

  return (
    <Text
      variant={variant}
      numberOfLines={numberOfLines}
      accessibilityLabel={children}
      testID={testID}
      style={[style, { color: base }]}
    >
      {content}
    </Text>
  );
}

export const AgentProgressLoadingText = memo(AgentProgressLoadingTextComponent);
AgentProgressLoadingText.displayName = 'AgentProgressLoadingText';
