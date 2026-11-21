import type React from 'react';
import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useSvgIdPrefix } from '../styles/svg-id';
import { withAlpha } from '../theme/color-utils';

/**
 * The floating header's EDGE EFFECT: the page colour at the top, fading to
 * nothing below the islands. `edge="bottom"` is the same ramp mirrored — the
 * colour at the bottom, fading to nothing above — for chrome that floats at the
 * bottom of a scroller (a pinned composer, a sidebar's lower edge).
 *
 * ── WHY IT IS A GRADIENT AND NOT A BLUR ─────────────────────────────────────
 *
 * It is the thing that lets a title sit on a photograph and still be read, and
 * it has exactly one job: no horizontal line anywhere. A translucent rectangle
 * — even a blurred one — ends at its own bottom edge, and that edge is a line
 * across the screen whether or not it is drawn. Apple's scroll edge effect is
 * described the same way: it protects legibility at the edge and must not read
 * as a slab over the content.
 *
 * It is NOT a blur of varying intensity, and saying so matters because the two
 * are easy to conflate and only one of them is here. `backdrop-filter` and
 * `expo-blur` both take a single radius for the whole surface; a falloff would
 * need the ten stacked layers `progressive-blur` uses, which is a real cost for
 * a strip this size. This is an opacity ramp of one flat colour, and that is
 * all it claims to be.
 *
 * ── THE STOPS ───────────────────────────────────────────────────────────────
 *
 * Four of them describe the fading portion, after any opaque chrome region.
 * They are shaped as an ease-out rather than a straight line. A LINEAR
 * ramp of opacity is perceptually not linear: it holds too much colour through
 * the middle and then falls off visibly in the last fifth, which puts a soft
 * but findable band across the content. Weighting the fall earlier spends the
 * fading portion's height and arrives at zero gently. Header/footer chrome
 * stays opaque before that portion so scrolling text cannot cross its labels.
 *
 * `TAIL_RATIO` extends the ramp BELOW the header's own box. The header is as
 * tall as its islands plus its padding; the fade needs room after that, or it
 * finishes at the same place the layout does, which is the line again.
 *
 * ── `stopOpacity`, NOT AN `rgba()` STOP ─────────────────────────────────────
 *
 * `react-native-svg` parses `stopColor` for its RGB and DISCARDS the alpha
 * channel, so an `rgba(…, 0.4)` stop renders at FULL strength on native and
 * correctly on web. That defect once painted an Android pane as an achromatic
 * white-to-black wipe while every gate stayed green. The colour and the opacity
 * travel here in separate props for the same reason.
 *
 * ── `width="100%"` IS NOT REDUNDANT ─────────────────────────────────────────
 *
 * An `<svg>` is a REPLACED element. With `width: auto` its used width is its
 * INTRINSIC width, and an SVG with no intrinsic size falls back to CSS's
 * default 300 x 150 — so `position: absolute; left: 0; right: 0` does NOT
 * stretch it: `right` is over-constrained and dropped. Measured in Chrome
 * before this prop existed: a 760px-wide header painted a 300 x 150 block of
 * scrim with a hard vertical edge down the middle of the screen, over content
 * that was otherwise untouched.
 *
 * Native is unaffected — react-native-svg lays its host view out with flexbox
 * there — which is exactly why the omission survives review: it is correct on
 * the platform most of this library is tested on. Gate:
 * `src/__tests__/svg-absolute-fill-size.test.ts`.
 *
 * ── THE GRADIENT ID ─────────────────────────────────────────────────────────
 *
 * From `useSvgIdPrefix`, which is `useId` with React's punctuation stripped.
 * Two headers on one page (a split view) must not resolve each other's
 * `url(#…)`, and a module-scope counter increments in a different
 * order on the server than during hydration, so an SSR'd page would reference a
 * gradient that is not there.
 */

/** How far past the header's own height the fade continues, as a ratio of it. */
export const SCRIM_TAIL_RATIO = 0.55;
/** Measured chrome occupies this fraction of its chrome + external tail box. */
export const SCRIM_CHROME_FRACTION = 1 / (1 + SCRIM_TAIL_RATIO);

/**
 * Offset down the ramp -> how much of the page colour survives there.
 *
 * Applied to the fading portion only; any opaque chrome region precedes it.
 */
export const SCRIM_STOPS = [
  { offset: 0, opacity: 1 },
  { offset: 0.42, opacity: 0.86 },
  { offset: 0.72, opacity: 0.38 },
  { offset: 1, opacity: 0 },
] as const;
const LINEAR_STOPS = [
  { offset: 0, opacity: 1 },
  { offset: 1, opacity: 0 },
] as const;

export interface EdgeScrimProps {
  /** The page colour the ramp starts from — opaque, alpha travels separately. */
  color: string;
  /**
   * The edge the colour is solid at. `top` (default) fades downward; `bottom`
   * fades upward. Mirrored in the gradient's own axis rather than with a
   * `rotate` transform on the host, so the scrim's box stays where its layout
   * put it on every platform.
   */
  edge?: 'top' | 'bottom';
  /** Smooth legibility curve by default; linear has only the opaque and transparent endpoints. */
  falloff?: 'smooth' | 'linear';
  /**
   * Fraction of the gradient box kept opaque from its anchored edge, in [0, 1].
   * Defaults to 0 for a full-box fade. Header/footer supply their measured
   * chrome's share of the box; the curve then occupies only the external tail.
   */
  opaqueFraction?: number;
  testID?: string;
}

/** Both renderers use the same normalized positions, including the solid region. */
function scrimStops(falloff: 'smooth' | 'linear', opaqueFraction: number) {
  const fraction = Number.isFinite(opaqueFraction) ? Math.max(0, Math.min(1, opaqueFraction)) : 0;
  const stops = falloff === 'linear' ? LINEAR_STOPS : SCRIM_STOPS;
  if (fraction === 0) return stops;
  if (fraction === 1)
    return [
      { offset: 0, opacity: 1 },
      { offset: 1, opacity: 1 },
    ];
  return [
    { offset: 0, opacity: 1 },
    ...stops.map((stop) => ({
      offset: fraction + (1 - fraction) * stop.offset,
      opacity: stop.opacity,
    })),
  ];
}

/**
 * The ramp as a CSS gradient, for Android's own `experimental_backgroundImage`.
 *
 * A view's own background gradient spans exactly that view. Alpha travels in
 * the colour here, which a CSS gradient honours (the `stopOpacity` reason above
 * is react-native-svg's).
 *
 * The hard line once seen at the header's foot on Android (Commons, Allo,
 * Mention Videos; Pixel 8a), the ramp stopping at alpha ~0.35, was not this
 * gradient: the scrim box is 1 + `SCRIM_TAIL_RATIO` times the header and was
 * clipped to the header's own box by the native parent Fabric hoisted the
 * header slot into. `Screen` keeps its root a native parent for that reason.
 */
export function edgeScrimGradient(
  color: string,
  edge: 'top' | 'bottom',
  falloff: 'smooth' | 'linear' = 'smooth',
  opaqueFraction = 0,
): string {
  const stops = scrimStops(falloff, opaqueFraction)
    // Keep fractional positions: rounding down can expose the last chrome pixels.
    .map((stop) => `${withAlpha(color, stop.opacity)} ${stop.offset * 100}%`)
    .join(', ');
  return `linear-gradient(to ${edge === 'bottom' ? 'top' : 'bottom'}, ${stops})`;
}

const EdgeScrimComponent: React.FC<EdgeScrimProps> = ({
  color,
  edge = 'top',
  falloff = 'smooth',
  opaqueFraction = 0,
  testID,
}) => {
  if (Platform.OS === 'android') {
    return (
      <View
        testID={testID}
        style={[
          StyleSheet.absoluteFill,
          { experimental_backgroundImage: edgeScrimGradient(color, edge, falloff, opaqueFraction) },
        ]}
      />
    );
  }
  return (
    <SvgEdgeScrim
      color={color}
      edge={edge}
      falloff={falloff}
      opaqueFraction={opaqueFraction}
      testID={testID}
    />
  );
};

const SvgEdgeScrim: React.FC<EdgeScrimProps> = ({
  color,
  edge = 'top',
  falloff = 'smooth',
  opaqueFraction = 0,
  testID,
}) => {
  const id = `${useSvgIdPrefix('bloom-page-header-scrim')}gradient`;
  const fromBottom = edge === 'bottom';
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} testID={testID}>
      <Defs>
        <LinearGradient
          id={id}
          x1="0"
          y1={fromBottom ? '1' : '0'}
          x2="0"
          y2={fromBottom ? '0' : '1'}
        >
          {scrimStops(falloff, opaqueFraction).map((stop) => (
            <Stop
              key={stop.offset}
              offset={String(stop.offset)}
              stopColor={color}
              stopOpacity={stop.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
};

export const EdgeScrim = memo(EdgeScrimComponent);
EdgeScrim.displayName = 'PageHeaderEdgeScrim';
