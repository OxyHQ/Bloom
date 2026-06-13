import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { buildScopeVars } from './style-builder';

export interface BloomColorScopeProps {
  /**
   * Preset to apply within this subtree. When `undefined`, the scope is a
   * no-op and children inherit the parent scope's preset unchanged.
   */
  colorPreset: AppColorName | undefined;
  /**
   * When `true`, do not render a wrapping `<div>`. The single child is cloned
   * with the scope's CSS vars merged into its `style` prop (Radix-style).
   */
  asChild?: boolean;
  /** Additional style applied to the wrapping `<div>` (or merged into the cloned child with `asChild`). */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

interface StyleableProps {
  style?: React.CSSProperties;
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

  if (!colorPreset) return <>{children}</>;

  const resolvedMode = parent.theme.mode;

  const contextValue = useMemo<BloomThemeContextValue>(() => {
    const theme = buildTheme(colorPreset, resolvedMode);
    return { ...parent, theme, colorPreset };
  }, [colorPreset, resolvedMode, parent]);

  const varsStyle = useMemo(
    () => buildScopeVars(colorPreset, resolvedMode) as React.CSSProperties,
    [colorPreset, resolvedMode],
  );

  let content: React.ReactNode;
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<StyleableProps>(child)) {
      throw new Error(
        'BloomColorScope with `asChild` requires a single React element child that accepts a `style` prop.',
      );
    }
    const childStyle = child.props.style;
    const mergedStyle: React.CSSProperties = { ...varsStyle, ...style, ...childStyle };
    content = cloneElement(child, { style: mergedStyle });
  } else {
    const mergedStyle: React.CSSProperties = { ...varsStyle, ...style };
    content = <div style={mergedStyle}>{children}</div>;
  }

  return <BloomThemeContext.Provider value={contextValue}>{content}</BloomThemeContext.Provider>;
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
