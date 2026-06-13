import React, { useContext, useMemo } from 'react';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { buildScopeVars } from './style-builder';

export interface BloomColorScopeProps {
  /** Preset to apply within this subtree. */
  colorPreset: AppColorName;
  /**
   * When `true`, do not render a wrapping element. The caller owns the
   * DOM node that receives the CSS vars (via `useColorScopeStyle`).
   */
  asChild?: boolean;
  /** Additional style applied to the wrapping `<div>`. Ignored with `asChild`. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function BloomColorScope({
  colorPreset,
  asChild = false,
  style,
  children,
}: BloomColorScopeProps) {
  const parent = useContext(BloomThemeContext);
  if (!parent) {
    throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  }

  const resolvedMode = parent.theme.mode;

  const contextValue = useMemo<BloomThemeContextValue>(() => {
    const theme = buildTheme(colorPreset, resolvedMode);
    return { ...parent, theme, colorPreset };
  }, [colorPreset, resolvedMode, parent]);

  const varsStyle = useMemo(
    () => ({ ...(buildScopeVars(colorPreset, resolvedMode) as React.CSSProperties), ...style }),
    [colorPreset, resolvedMode, style],
  );

  return (
    <BloomThemeContext.Provider value={contextValue}>
      {asChild ? children : <div style={varsStyle}>{children}</div>}
    </BloomThemeContext.Provider>
  );
}

/**
 * Escape hatch for advanced cases where the wrapping element is owned by the
 * caller. Returns a stable React style object carrying the preset's CSS vars.
 */
export function useColorScopeStyle(colorPreset: AppColorName): React.CSSProperties {
  const parent = useContext(BloomThemeContext);
  if (!parent) {
    throw new Error('useColorScopeStyle must be used within a <BloomThemeProvider>');
  }
  const resolvedMode = parent.theme.mode;
  return useMemo(
    () => buildScopeVars(colorPreset, resolvedMode) as React.CSSProperties,
    [colorPreset, resolvedMode],
  );
}
