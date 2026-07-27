/**
 * Ported from expo-glass-tabs v0.1.1 — src/progressive-blur.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 */
import { View } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  buildMaskGradient,
  buildTailGradient,
  WEB_BLUR_PER_INTENSITY,
} from './shared';
import type { ProgressiveBlurProps } from './types';

export type { ProgressiveBlurProps } from './types';

/**
 * WEB fork of {@link ProgressiveBlur} — ONE element instead of the native
 * ten-layer stack.
 *
 * Two upstream techniques do not survive a browser, which is the whole reason
 * this fork exists:
 *
 *   - `experimental_backgroundImage` is dropped silently by react-native-web
 *     (no warning, no gradient), so the tail is painted with real CSS
 *     `background-image` instead;
 *   - stacking ten `BlurView`s would mean ten composited backdrop passes over
 *     the same pixels every frame. A browser can fade a single
 *     `backdrop-filter` with `mask-image`, which is both correct and an order
 *     of magnitude cheaper.
 *
 * The declarations ride in the STYLE object rather than an injected CSS class:
 * react-native-web does not forward `className` to the DOM (it is absent from
 * its `forwardedProps` list, and `createDOMProps` overwrites the attribute with
 * the atomic class it generates), while unknown style properties ARE passed
 * through its style compiler — the same route `Dialog.web.tsx` uses for its
 * `animation` shorthand. Nothing here needs `@keyframes` or a pseudo-class, so
 * there is no stylesheet to inject and nothing a consumer could forget to wire.
 */
export function ProgressiveBlur({
  style,
  intensity = 5,
  direction = 'top',
  ...rest
}: ProgressiveBlurProps) {
  const { colors } = useTheme();

  const filter = `blur(${intensity * WEB_BLUR_PER_INTENSITY}px)`;
  const mask = buildMaskGradient(direction);
  // Web-only CSS, unknown to React Native's `ViewStyle`. Both spellings are set
  // for `backdrop-filter` and `mask-image`: Safari still needs the prefixed
  // form of each.
  const webStyle: WebCssStyle = {
    pointerEvents: 'none',
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    maskImage: mask,
    WebkitMaskImage: mask,
    backgroundImage: buildTailGradient(colors.background, direction),
  };

  return <View {...rest} style={[webStyle, style]} />;
}

ProgressiveBlur.displayName = 'ProgressiveBlur';
