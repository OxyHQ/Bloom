import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../theme/use-theme';
import { withAlpha } from '../theme/color-utils';
import { StyledView } from '../styles/styled-primitives';
import { borderRadius } from '../styles/tokens';
import { SurfacePaint } from './SurfacePaint';
import type { SurfaceProps } from './types';

/** Layout-neutral container: callers supply their own padding and content. */
export const Surface = memo(function Surface({
  children, material = 'glass', fill, radius = borderRadius.xl,
  style, className, accessibilityLabel, testID,
}: SurfaceProps) {
  const theme = useTheme();
  const glass = material === 'glass';
  const effectiveRadius = StyleSheet.flatten(style)?.borderRadius ?? radius;
  const color = fill ?? (glass
    ? withAlpha(theme.isDark ? theme.colors.background : theme.colors.card, 0.25)
    : theme.colors.card);
  return (
    <StyledView
      className={className}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ position: 'relative', borderRadius: effectiveRadius, backgroundColor: glass ? 'transparent' : color }, style]}
    >
      {glass ? <SurfacePaint fill={color} radius={effectiveRadius} glass /> : null}
      {children}
    </StyledView>
  );
});
