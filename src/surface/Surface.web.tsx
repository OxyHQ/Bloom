import React, { memo } from 'react';
import { useTheme } from '../theme/use-theme';
import { withAlpha } from '../theme/color-utils';
import { borderRadius } from '../styles/tokens';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { surfaceMaterialCss } from './web-material';
import { useSurfaceRefraction } from './web-refraction';
import type { SurfaceProps } from './types';

const CSS = `
.bloom-surface {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
}
.bloom-surface--glass { overflow: hidden; }
${surfaceMaterialCss('.bloom-surface--glass', 'var(--bloom-surface-fill)')}
`;

export const Surface = memo(function Surface({
  children, material = 'glass', fill, radius = borderRadius.xl,
  style, className, accessibilityLabel, testID,
}: SurfaceProps) {
  const theme = useTheme();
  const glass = material === 'glass';
  useInteractiveWebCss('bloom-surface-web-css', CSS);
  useSurfaceRefraction(glass);
  const color = fill ?? (glass
    ? withAlpha(theme.isDark ? theme.colors.background : theme.colors.card, 0.25)
    : theme.colors.card);
  const baseStyle: WebCssStyle = {
    borderRadius: radius,
    backgroundColor: glass ? 'transparent' : color,
    '--bloom-surface-fill': color,
  };
  return (
    <StyledView
      className={['bloom-surface', glass && 'bloom-surface--glass', className].filter(Boolean).join(' ')}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[baseStyle, style]}
    >
      {children}
    </StyledView>
  );
});
