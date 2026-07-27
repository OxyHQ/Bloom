import React, { memo, useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { ConnectionDotsBase } from './ConnectionDotsBase';
import type { ConnectionDotsProps } from './types';

const DEFAULT_DOT_COUNT = 6;
const DEFAULT_DOT_SIZE = 6;
const WAVE_DURATION_MS = 1400;

const KEYFRAMES_ID = 'bloom-connection-dots-keyframes';
const WAVE_ANIMATION_NAME = 'bloomConnectionDotsWave';

/**
 * CSS keyframes powering the ellipsis shimmer. Mirrors the native Reanimated
 * triangle wave: each dot's opacity rises to 1 and falls back to a dim floor,
 * with a per-dot `animation-delay` sweeping the bright crest left→right.
 *
 * A `prefers-reduced-motion: reduce` media query pins every dot to full opacity,
 * matching the native `useReducedMotion` branch — defence-in-depth alongside the
 * JS `matchMedia` gate below (which also stops emitting the `animation` prop).
 */
export const BLOOM_CONNECTION_DOTS_CSS = `
@keyframes ${WAVE_ANIMATION_NAME} { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  [data-bloom-connection-dot] { animation: none !important; opacity: 1 !important; }
}
`;

function useKeyframes(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAMES_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_ID;
    style.textContent = BLOOM_CONNECTION_DOTS_CSS;
    document.head.appendChild(style);
  }, []);
}

/** Read the OS `prefers-reduced-motion` preference reactively. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Web fork of `./ConnectionDots`. The native variant runs the opacity wave with
 * `react-native-reanimated`, which cannot ship to a web bundle. This fork drives
 * the same motion with a CSS `@keyframes` animation (injected once into
 * `<head>`) and a per-dot `animation-delay`. Brand color comes from the
 * `fill-brand` role (`theme.colors.primary`). Reduced-motion (the `reducedMotion`
 * prop, the JS `matchMedia` gate, or the CSS media query) renders static dots.
 */
const ConnectionDotsComponent: React.FC<ConnectionDotsProps> = ({
  left,
  right,
  dotCount = DEFAULT_DOT_COUNT,
  dotSize = DEFAULT_DOT_SIZE,
  accessibilityLabel,
  className,
  style,
  reducedMotion,
}) => {
  const theme = useTheme();
  useKeyframes();
  const systemReduceMotion = usePrefersReducedMotion();
  const reduce = reducedMotion ?? systemReduceMotion;
  const color = theme.colors.primary;

  const count = Math.max(1, Math.floor(dotCount));

  const dots = Array.from({ length: count }, (_, i) => {
    const base: ViewStyle = {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: color,
    };
    const animated: WebCssStyle = reduce
      ? { opacity: 1 }
      : {
          // `animation` / `animationDelay` are real CSS props on web;
          // react-native-web passes them through to the DOM node.
          animation: `${WAVE_ANIMATION_NAME} ${WAVE_DURATION_MS}ms linear infinite`,
          animationDelay: `${(i / count) * WAVE_DURATION_MS}ms`,
        };
    return (
      <View
        key={i}
        // marker attribute lets the reduced-motion media query target dots
        {...({ 'data-bloom-connection-dot': '' } as Record<string, string>)}
        style={[base, animated]}
      />
    );
  });

  return (
    <ConnectionDotsBase
      left={left}
      right={right}
      dots={dots}
      accessibilityLabel={accessibilityLabel}
      className={className}
      style={style}
    />
  );
};

export const ConnectionDots = memo(ConnectionDotsComponent);
ConnectionDots.displayName = 'ConnectionDots';
