import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import {
  GLASS_BLUR_INTENSITY,
  GLASS_RIM_HIGHLIGHT,
  GLASS_SHEEN,
  resolveGlassColors,
} from '../theme/glass-colors';
import type { GlassSurfaceProps } from './types';

/**
 * The layered pane every glass surface in Bloom is built from.
 *
 * ── ONE COMPONENT, NOT A FORK ───────────────────────────────────────────────
 *
 * There is no `.web.tsx` beside this file, and there should not be one. Each of
 * the three layers has a mechanism that is genuinely universal, which was
 * checked rather than assumed:
 *
 *  - **The blur** is `expo-blur`'s `BlurView`. Its `BlurView.web.js` is a real
 *    web implementation, not a stub — it computes `backdrop-filter:
 *    saturate(180%) blur(intensity * 0.2px)` and renders a react-native-web
 *    `View`. Same component, same props, both platforms. It is already a
 *    REQUIRED peer and `frosted-icon-button` already depends on it, so this
 *    costs nothing new.
 *  - **The tint** is a plain `View` with a `backgroundColor`.
 *  - **The sheen** is `react-native-svg`, which is ALSO already a required peer
 *    and already renders gradients in this library (`avatar/AvatarRing.tsx`
 *    uses the same four primitives). A `linear-gradient` needs a gradient
 *    primitive and a bare `View` cannot express one, but the primitive Bloom
 *    needs is already installed — `expo-linear-gradient` would have been a new
 *    peer for a capability the tree already has.
 *
 * The two things that are NOT layers here — the hairline border and the
 * `glass` box-shadow — belong on the CALLER's own box, and that is not a
 * stylistic preference. This view clips (`overflow: 'hidden'`), and a shadow
 * drawn on a clipping node is clipped away on iOS; the border has to be on the
 * node that owns the geometry so it traces the real edge. `frosted-icon-button`
 * learned the same thing and splits the same way.
 *
 * ── WHAT THE CALLER OWES IT ─────────────────────────────────────────────────
 *
 * A positioned box with `overflow` of its own is NOT required — this fills the
 * caller absolutely and clips itself — but `radius` must match the caller's, and
 * the caller must render this FIRST so it paints under its own content.
 */

let glassSheenIdCounter = 0;

const GlassSurfaceComponent: React.FC<GlassSurfaceProps> = ({
  fill,
  radius,
  sheen = true,
  style,
  testID,
}) => {
  const theme = useTheme();
  const glass = useMemo(() => resolveGlassColors(fill), [fill]);
  // Per instance, because two panes in one document would otherwise share an id
  // and the survivor of an unmount would reference a gradient that is gone. Same
  // counter shape as `AvatarRing`.
  const sheenId = useMemo(() => `bloom-glass-sheen${glassSheenIdCounter++}`, []);

  return (
    <View
      // A PROP, never a style entry: react-native-web resolves the RN-only
      // values from the prop path only. `'none'` does survive as a style, which
      // is what makes the mistake easy — but this file follows the rule rather
      // than the exception, and the surface must never eat a press meant for the
      // control it fills.
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius }, styles.clip, style]}
      testID={testID}
    >
      <BlurView
        intensity={GLASS_BLUR_INTENSITY}
        // The material follows the SCHEME, not the tone: a light pane in dark
        // mode would be a bright card, which is the failure `frosted-icon-button`
        // documents at length.
        tint={theme.isDark ? 'dark' : 'light'}
        // Android's default blur is a no-op without this — the same value
        // `frosted-icon-button` passes, for the same reason.
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/*
        The accent fill, straight onto the blur. There is no neutral scrim
        between them: the pane's transparency IS the material, and the surfaces
        this sits on are Bloom's own — see the backdrop-range note in
        `theme/glass-colors.ts` for the 1080-combination measurement that says
        the reference's 25% needs no help there, and for what it costs over
        content Bloom does not own.
      */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.fill }]} />
      {sheen ? (
        <Svg style={StyleSheet.absoluteFill} testID={testID ? `${testID}-sheen` : undefined}>
          <Defs>
            {/* Top to bottom: simulated light from above. */}
            <LinearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={GLASS_SHEEN.top} />
              <Stop offset={String(GLASS_SHEEN.middleStop)} stopColor={GLASS_SHEEN.middle} />
              <Stop offset="1" stopColor={GLASS_SHEEN.bottom} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${sheenId})`} />
        </Svg>
      ) : null}
      {/*
        The lit rim, LAST so nothing paints over it. An inset shadow sits above
        its own element's background but below that element's children, so this
        cannot be an inset on the clipping view above — the blur would cover it —
        and it cannot be a shadow role on the caller's box either, for the same
        reason one layer further out. Its own empty layer is the only position in
        the stack where it is visible.
      */}
      <View style={[StyleSheet.absoluteFill, styles.rim]} />
    </View>
  );
};

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  rim: {
    boxShadow: GLASS_RIM_HIGHLIGHT,
  },
});

export const GlassSurface = memo(GlassSurfaceComponent);
GlassSurface.displayName = 'GlassSurface';
