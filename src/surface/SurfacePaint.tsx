import { surfaceStyle } from '../shapes/surface-style';
import type { SurfaceShape } from '../shapes/corner-types';
import React, { memo, useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { surfaceMaterialCss } from './web-material';
import { useTheme } from '../theme/use-theme';
import { resolveSurfaceTint, resolveSurfaceOptics } from './shared';

const WEB_PAINT_CSS = `
.bloom-surface-paint { isolation: isolate; overflow: hidden; }
${surfaceMaterialCss('.bloom-surface-paint', 'var(--bloom-surface-paint-fill)')}
.bloom-surface-paint--no-sheen::after { background-image: none; }
`;

/**
 * The material under a surface's content: tint, sheen and rim.
 *
 * Web adds a backdrop blur beneath them. Native paints one `View` (tint as
 * `backgroundColor`, sheen as a CSS gradient, rim as an inset `boxShadow`):
 * no SVG, no layout state, no per-surface blur. A `BlurView` inside a surface
 * can SIGSEGV on Android, so native blur lives only in `overlay/` `Backdrop`.
 */
export const SurfacePaint = memo(function SurfacePaint({
  fill,
  radius,
  shape,
  direction = 'ltr',
  sheen = true,
  testID,
}: {
  sheen?: boolean;
  testID?: string;
  /** Omit for sheen/rim only on a host that already owns its fill. */
  fill?: string;
  radius?: NonNullable<ViewStyle['borderRadius']>;
  /** Same policy as the host; radius can remain owned by an animated host. */
  shape?: SurfaceShape;
  direction?: 'ltr' | 'rtl';
}) {
  const geometry = {
    ...(radius === undefined ? {} : { borderRadius: radius }),
    ...surfaceStyle(shape ?? { curve: 'round' }, direction),
  };
  const theme = useTheme();
  const optics = resolveSurfaceOptics(theme.isDark);
  const resolvedFill = resolveSurfaceTint(fill ?? 'transparent');
  const isWeb = Platform.OS === 'web';
  useEffect(() => {
    if (isWeb) adoptStyleSheet('bloom-surface-paint-web-css', WEB_PAINT_CSS);
  }, [isWeb]);
  if (isWeb) {
    const paintStyle: WebCssStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...geometry,
      backgroundColor: 'transparent',
      '--bloom-surface-paint-fill': resolvedFill,
      '--bloom-surface-rim': optics.rim,
      '--bloom-surface-sheen': optics.sheenCss,
    };
    return (
      <StyledView
        testID={testID}
        pointerEvents="none"
        className={`bloom-surface-paint${sheen ? '' : ' bloom-surface-paint--no-sheen'}`}
        style={paintStyle}
      />
    );
  }
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        geometry,
        {
          overflow: 'hidden',
          backgroundColor: fill === undefined ? 'transparent' : resolvedFill,
          boxShadow: optics.rim,
          ...(sheen ? { experimental_backgroundImage: optics.sheenCss } : null),
        },
      ]}
    />
  );
});
