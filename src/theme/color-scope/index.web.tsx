import React, { useContext, useMemo } from 'react';

import { BloomThemeContext } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { BloomThemeContextValue } from '../BloomThemeProvider';
import { buildScopeVars } from './style-builder';

export interface BloomColorScopeProps {
  /** Preset to apply within this subtree. */
  colorPreset: AppColorName;
  /**
   * When `true`, do not render a wrapping element. The caller is responsible
   * for placing the returned context provider over a DOM node that owns the
   * CSS vars (via `useColorScopeStyle`).
   */
  asChild?: boolean;
  children: React.ReactNode;
}

export function BloomColorScope({ colorPreset, asChild = false, children }: BloomColorScopeProps) {
  const parent = useContext(BloomThemeContext);
  if (!parent) {
    throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  }

  const resolvedMode = parent.theme.mode;

  const contextValue = useMemo<BloomThemeContextValue>(() => {
    const theme = buildTheme(colorPreset, resolvedMode);
    return { ...parent, theme, colorPreset };
  }, [colorPreset, resolvedMode, parent]);

  const style = useMemo(
    () => buildScopeVars(colorPreset, resolvedMode) as React.CSSProperties,
    [colorPreset, resolvedMode],
  );

  return (
    <BloomThemeContext.Provider value={contextValue}>
      {asChild ? children : <div style={style}>{children}</div>}
    </BloomThemeContext.Provider>
  );
}

/**
 * Escape hatch for advanced cases where the wrapping element is owned by the
 * caller (e.g. a Pressable, a NativeWind-styled View that already has a style
 * prop). Returns a stable React `style` object carrying every CSS custom
 * property of the preset.
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
