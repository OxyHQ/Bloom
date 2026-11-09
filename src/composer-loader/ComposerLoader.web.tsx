import { ComposerLoaderPaintContext } from './context';
/**
 * `ComposerLoader` — WEB: the light band laps on CSS keyframes over a DOM
 * `<svg>`, where the native fork drives a react-native-svg frame clock.
 *
 * The lap geometry both forks draw is shared (`./shared`); what differs is only
 * what advances it. Keeping the geometry in one module is what stops the two
 * bands from drifting apart while still looking like one component.
 */
import { Surface } from '../surface/index.web';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { BUTTON_SHADOW } from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSvgIdPrefix } from '../styles/svg-id';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  COMPOSER_LOADER_FADE_MS,
  resolveComposerLoaderColors,
  PILL_RADIUS,
  blurFilterId,
  composerLoaderGeometry,
  gradientMidColor,
} from './shared';
import type { ComposerLoaderProps } from './types';
import { useLoaderMotion } from './use-loader-motion';
import { useInView } from '../viewport/use-in-view.web';

/**
 * Web fork of `./ComposerLoader`. Draws the markup directly: a DOM `<svg>`
 * whose `<rect>` strokes are `pathLength`-normalised dash segments lapping on a
 * CSS `@keyframes` (self-injected through `adoptStyleSheet`), each layer's
 * phase an `animation-delay`. Blur is an SVG-native `feGaussianBlur`, not CSS
 * `filter` — WebKit ignores CSS filters on individual SVG elements, which
 * rendered the whole light razor-sharp on iPhones.
 *
 * The layer table is shared with the native fork (`shared.ts`).
 */

const STYLE_ID = 'bloom-composer-loader-web-css';
const RECT_CLASS = 'bloom-composer-loader-rect';
const KEYFRAMES = 'bloom-composer-loader-dash';

export const COMPOSER_LOADER_WEB_CSS = `
@keyframes ${KEYFRAMES} {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -100; }
}
@media (prefers-reduced-motion: reduce) {
  .${RECT_CLASS} { animation-play-state: paused !important; }
}
`;

function ComposerLoaderComponent({
  children,
  active = true,
  paused = false,
  colors,
  speed = 4.5,
  intensity = 0.7,
  bloom = 16,
  bloomStrength = 0.3,
  arc = 120,
  reverse = false,
  radius,
  line = 2.5,
  bloomOnly = false,
  surface = true,
  taper = 0,
  blend,
  offset = 0,
  style,
  testID,
}: ComposerLoaderProps) {
  const theme = useTheme();
  const gradientId = `${useSvgIdPrefix('bloom-cl')}gradient`;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const measured = box.w > 0 && box.h > 0;
  const { inView, targetProps } = useInView();
  const { moving, animate } = useLoaderMotion(active, measured && inView && !paused);

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, COMPOSER_LOADER_WEB_CSS);
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const w = Number.isFinite(width) ? Math.max(0, width) : 0;
    const h = Number.isFinite(height) ? Math.max(0, height) : 0;
    setBox((previous) => (previous.w === w && previous.h === h ? previous : { w, h }));
  }, []);

  const geometry = useMemo(
    () =>
      composerLoaderGeometry({
        width: Math.max(1, box.w),
        height: Math.max(1, box.h),
        arc,
        line,
        bloom,
        bloomStrength,
        bloomOnly,
        taper,
        reverse,
        offset,
        radius,
      }),
    [box.w, box.h, arc, line, bloom, bloomStrength, bloomOnly, taper, reverse, offset, radius],
  );

  const [c0, c1, c2, c3] = colors ?? resolveComposerLoaderColors(theme);
  const cornerRadius = radius ?? PILL_RADIUS;
  const direction = reverse ? 'reverse' : 'normal';

  const surfaceStyle: WebCssStyle = {
    borderRadius: cornerRadius,
    boxShadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
  };
  const clipStyle: WebCssStyle = {
    overflow: 'hidden',
    borderRadius: cornerRadius,
    opacity: active ? 1 : 0,
    transitionProperty: animate ? 'opacity' : 'none',
    transitionDuration: `${animate ? COMPOSER_LOADER_FADE_MS : 0}ms`,
    transitionTimingFunction: 'ease',
    mixBlendMode: blend,
  };

  return (
    <View ref={targetProps.ref} style={[styles.root, style]} testID={testID}>
      {surface ? (
        <View
          aria-hidden
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, surfaceStyle]}
          testID={testID ? `${testID}-surface` : undefined}
        >
          {/* The plate is the shared Surface, filling its frame (its own class sets `position`,
              so it cannot be the absolutely-positioned node itself). */}
          <Surface radius={cornerRadius} style={{ flex: 1 }} />
        </View>
      ) : null}

      <View
        aria-hidden
        pointerEvents="none"
        onLayout={onLayout}
        style={[StyleSheet.absoluteFill, clipStyle]}
        testID={testID ? `${testID}-light` : undefined}
      >
        {measured ? (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${box.w} ${box.h}`}
            preserveAspectRatio="none"
            style={{ display: 'block', opacity: intensity }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c0} />
                <stop offset="30%" stopColor={c1} />
                <stop offset="50%" stopColor={gradientMidColor(c1, c2)} />
                <stop offset="70%" stopColor={c2} />
                <stop offset="100%" stopColor={c3} />
              </linearGradient>
              {geometry.blurs.map((blur) => (
                <filter
                  key={blur}
                  id={blurFilterId(gradientId, blur)}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation={blur} />
                </filter>
              ))}
            </defs>
            {geometry.strokes.map((stroke) => (
              <rect
                key={stroke.key}
                x={0}
                y={0}
                width={box.w}
                height={box.h}
                rx={geometry.rx}
                pathLength={100}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={stroke.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${stroke.dash} ${100 - stroke.dash}`}
                className={RECT_CLASS}
                filter={
                  stroke.blur > 0 ? `url(#${blurFilterId(gradientId, stroke.blur)})` : undefined
                }
                style={{
                  opacity: stroke.opacity,
                  animationName: KEYFRAMES,
                  animationDuration: `${speed}s`,
                  animationTimingFunction: 'linear',
                  animationDelay: `${(stroke.phase * speed) / 100}s`,
                  animationIterationCount: 'infinite',
                  animationDirection: direction,
                  animationPlayState: moving ? 'running' : 'paused',
                }}
              />
            ))}
          </svg>
        ) : null}
      </View>

      <ComposerLoaderPaintContext.Provider value={active}>
        <View style={styles.content}>{children}</View>
      </ComposerLoaderPaintContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  content: { position: 'relative' },
});

export const ComposerLoader = memo(ComposerLoaderComponent);
ComposerLoader.displayName = 'ComposerLoader';
