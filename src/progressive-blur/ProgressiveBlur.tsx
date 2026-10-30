import { useSurfaceFill } from '../styles/surface-levels';
/**
 * Ported from expo-glass-tabs v0.1.1 — src/progressive-blur.tsx
 * (MIT © 2026 David Mokos).
 */
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { blurTintColor } from '../overlay/backdrop-paint';
import { buildTailGradient, LAYER_HEIGHTS } from './shared';
import type { ProgressiveBlurProps } from './types';

/**
 * Progressive (gradient) blur: strongest at the anchored edge, fading to none.
 * Drop it behind a floating tab bar or a transparent header so content
 * dissolves rather than meeting a hard blur line.
 *
 * NATIVE implementation. iOS has no public variable-blur API, so this stacks
 * ten thin `BlurView`s with a tiny per-layer intensity — each layer's edge adds
 * only an imperceptible step, so the falloff reads as continuous (see
 * `LAYER_HEIGHTS`). A soft gradient in the theme's page color smooths the tail
 * and keeps overlaid content legible.
 *
 * With transparency reduced (`useReducedTransparency()`) each layer is its
 * tint alone, a plain view at the colour the blur view lays over what it
 * blurs, so the band and its tail look the same with nothing blurred.
 *
 * The web fork replaces the whole stack with one masked `backdrop-filter`:
 * `experimental_backgroundImage` is dropped silently by react-native-web, and
 * ten stacked backdrop passes would be far more expensive than the one the
 * browser can do natively.
 */
export function ProgressiveBlur({
  style,
  intensity = 5,
  direction = 'top',
  ...rest
}: ProgressiveBlurProps) {
  const { isDark } = useTheme();
  const surfaceFill = useSurfaceFill();
  const reduced = useReducedTransparency();
  const anchor = direction === 'top' ? styles.anchorTop : styles.anchorBottom;
  const tint = isDark ? 'dark' : 'light';

  return (
    <View {...rest} style={[styles.root, style]}>
      {LAYER_HEIGHTS.map((height) =>
        reduced ? (
          <View
            key={height}
            style={[
              styles.layer,
              anchor,
              { height, backgroundColor: blurTintColor(tint, intensity) },
            ]}
          />
        ) : (
          <BlurView
            key={height}
            tint={tint}
            intensity={intensity}
            style={[styles.layer, anchor, { height }]}
          />
        ),
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { experimental_backgroundImage: buildTailGradient(surfaceFill, direction) },
        ]}
      />
    </View>
  );
}

ProgressiveBlur.displayName = 'ProgressiveBlur';

const styles = StyleSheet.create({
  root: {
    // In the style object, not as a prop: RN-Web deprecated the `pointerEvents`
    // prop and warns on every render when it is used.
    pointerEvents: 'none',
  },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  anchorTop: {
    top: 0,
  },
  anchorBottom: {
    bottom: 0,
  },
});
