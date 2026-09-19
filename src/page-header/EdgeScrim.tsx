import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useSvgIdPrefix } from '../styles/svg-id';

/**
 * The floating header's EDGE EFFECT: the page colour at the top, fading to
 * nothing below the islands.
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
 * Four of them, shaped as an ease-out rather than a straight line. A LINEAR
 * ramp of opacity is perceptually not linear: it holds too much colour through
 * the middle and then falls off visibly in the last fifth, which puts a soft
 * but findable band across the content. Weighting the fall earlier spends the
 * gradient's height where the eye is looking — the region behind the title —
 * and arrives at zero gently.
 *
 * `TAIL_RATIO` extends the ramp BELOW the header's own box. The header is as
 * tall as its islands plus its padding; the fade needs room after that, or it
 * finishes at the same place the layout does, which is the line again.
 *
 * ── `stopOpacity`, NOT AN `rgba()` STOP ─────────────────────────────────────
 *
 * `react-native-svg` parses `stopColor` for its RGB and DISCARDS the alpha
 * channel, so an `rgba(…, 0.4)` stop renders at FULL strength on native and
 * correctly on web. That is the exact defect documented on `GLASS_SHEEN` in
 * `theme/glass-colors.ts`, where it painted an Android pane as an achromatic
 * white-to-black wipe while every gate stayed green. The colour and the opacity
 * travel here in separate props for the same reason.
 *
 * ── THE GRADIENT ID ─────────────────────────────────────────────────────────
 *
 * From `useSvgIdPrefix`, which is `useId` with React's punctuation stripped.
 * Two headers on one page (a split view) must not resolve each other's
 * `url(#…)`, and a module-scope counter — which is what `GlassSurface` uses,
 * and which is right for a native-only surface — increments in a different
 * order on the server than during hydration, so an SSR'd page would reference a
 * gradient that is not there.
 */

/** How far past the header's own height the fade continues, as a ratio of it. */
export const SCRIM_TAIL_RATIO = 0.55;

/**
 * Offset down the ramp -> how much of the page colour survives there.
 *
 * Read as: solid behind the title, nine tenths gone by three quarters of the
 * way down, nothing at the bottom.
 */
export const SCRIM_STOPS = [
  { offset: 0, opacity: 1 },
  { offset: 0.42, opacity: 0.86 },
  { offset: 0.72, opacity: 0.38 },
  { offset: 1, opacity: 0 },
] as const;

export interface EdgeScrimProps {
  /** The page colour the ramp starts from — opaque, alpha travels separately. */
  color: string;
  testID?: string;
}

const EdgeScrimComponent: React.FC<EdgeScrimProps> = ({ color, testID }) => {
  const id = `${useSvgIdPrefix('bloom-page-header-scrim')}gradient`;
  return (
    <Svg style={StyleSheet.absoluteFill} testID={testID}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {SCRIM_STOPS.map((stop) => (
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
