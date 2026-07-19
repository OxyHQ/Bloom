import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildSeedScopeVars } from '../color-scope/seed-scope';
import { buildThemeFromSeed } from '../build-theme-from-seed';
import type { SchemeVariant } from '../color-engine';

export interface BloomSeedScopeProps {
  /**
   * The seed colour (`#rrggbb`) to derive this subtree's palette from. When
   * `undefined`, the scope is a no-op and children inherit the parent scope
   * unchanged — pass `undefined` to fall back to the app preset (e.g. on
   * mouse-leave/blur when restoring the default theme).
   */
  seed: string | undefined;
  /**
   * Optional explicit secondary-accent seed (`#rrggbb`). Pins the secondary
   * palette to a distinct brand/artwork colour instead of the derived rotation —
   * e.g. pass `seedsFromImagePixels(pixels)[1]` for a richer artwork theme.
   */
  secondarySeed?: string;
  /** Optional explicit tertiary-accent seed (`#rrggbb`). Same semantics. */
  tertiarySeed?: string;
  /** Tonal scheme variant. Defaults to `'vibrant'` (matches Bloom presets). */
  variant?: SchemeVariant;
  /** −1 (low) … 0 (normal) … 1 (high). Defaults to 0. */
  contrastLevel?: number;
  /**
   * When `true`, do not render a wrapping `<div>`. The single child is cloned
   * with the scope's CSS vars merged into its `style` prop (Radix-style).
   */
  asChild?: boolean;
  /** Additional style applied to the wrapping `<div>` (or merged into the cloned child with `asChild`). */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * On web the single `asChild` child is frequently a react-native-web component
 * whose `style` prop is a style ARRAY (or a numeric registered-style id), not a
 * plain object. Spreading such an array into an object literal would copy its
 * numeric indices as keys and crash RNW; merge as an array instead.
 */
type WebStyle =
  | React.CSSProperties
  | number
  | null
  | undefined
  | false
  | ReadonlyArray<WebStyle>;

interface StyleableProps {
  style?: WebStyle;
}

/**
 * Web `<BloomSeedScope>`: scopes a subtree to an ARBITRARY seed colour's palette
 * (the dynamic counterpart of `<BloomColorScope>`). It (1) writes every canonical
 * `--x` token plus the Tailwind v4 `--color-x` aliases (already resolved to
 * `rgb(...)`) onto the wrapping element's inline `style`, so NativeWind classes
 * inside resolve against the seed palette instead of the document root, and
 * (2) publishes a matching JS `theme` on `BloomThemeContext` so
 * `useTheme()`/`useBloomTheme()` consumers inside the subtree re-theme too. The
 * `colorPreset` field is left as the parent's (a seed is not a named preset).
 */
export function BloomSeedScope({
  seed,
  secondarySeed,
  tertiarySeed,
  variant,
  contrastLevel,
  asChild = false,
  style,
  children,
}: BloomSeedScopeProps) {
  const parent = useContext(BloomThemeContext);
  const resolvedMode = parent?.theme.mode ?? 'light';

  const varsStyle = useMemo<React.CSSProperties | null>(
    () =>
      seed
        ? (buildSeedScopeVars({
            seed,
            mode: resolvedMode,
            variant,
            contrastLevel,
            secondarySeed,
            tertiarySeed,
          }) as React.CSSProperties)
        : null,
    [seed, resolvedMode, variant, contrastLevel, secondarySeed, tertiarySeed],
  );

  const contextValue = useMemo<BloomThemeContextValue | null>(() => {
    if (!parent || !seed) return null;
    const theme = buildThemeFromSeed(seed, resolvedMode, variant, contrastLevel, { secondarySeed, tertiarySeed });
    return { ...parent, theme };
  }, [parent, seed, resolvedMode, variant, contrastLevel, secondarySeed, tertiarySeed]);

  if (!parent) {
    throw new Error('BloomSeedScope must be used within a <BloomThemeProvider>');
  }
  if (!varsStyle || !contextValue) return <>{children}</>;

  let content: React.ReactNode;
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<StyleableProps>(child)) {
      throw new Error(
        'BloomSeedScope with `asChild` requires a single React element child that accepts a `style` prop.',
      );
    }
    const childStyle = child.props.style;
    const mergedStyle: WebStyle = [varsStyle, style, childStyle];
    content = cloneElement(child, { style: mergedStyle });
  } else {
    const mergedStyle: React.CSSProperties = { ...varsStyle, ...style };
    content = <div style={mergedStyle}>{children}</div>;
  }

  return <BloomThemeContext.Provider value={contextValue}>{content}</BloomThemeContext.Provider>;
}
