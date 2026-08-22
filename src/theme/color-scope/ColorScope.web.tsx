import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { buildScopeVars } from './style-builder';

/**
 * `buildScopeVars` returns every canonical token already resolved to an sRGB
 * `rgb(...)` string, plus the `--color-*` aliases consumed by Tailwind v4
 * utilities. Scoped onto an element's inline `style`, profile-level NativeWind
 * classes resolve against the subtree preset instead of the document root.
 */
function buildWebScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): React.CSSProperties {
  return buildScopeVars(colorPreset, mode) as React.CSSProperties;
}

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

/**
 * On web, the single `asChild` child can be either kind of element, and the two
 * kinds want different `style` shapes:
 *
 *  - A react-native-web component (RN `<View>`, `<Pressable>`) may already
 *    carry a style ARRAY or a numeric registered-style id. Spreading that into
 *    an object literal copies its numeric indices as keys, and RNW then commits
 *    `0`, `1`, … to the DOM. RNW flattens arrays, so it gets an array.
 *  - Anything that ends on a DOM element — an `<a>`, a router `<Link>`, any
 *    component that forwards `style` to its host node — hands the prop straight
 *    to React DOM, which walks the own keys of whatever it is given. An array
 *    there throws `Failed to set an indexed property [0] on
 *    'CSSStyleDeclaration'` during commit, blanking the tree.
 *
 * So the array form is used only when the child's own style is already
 * RN-shaped; every other child gets a plain object, which both runtimes accept.
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

export function BloomColorScope({
  colorPreset,
  asChild = false,
  style,
  children,
}: BloomColorScopeProps) {
  // All hooks are called UNCONDITIONALLY, in the same order on every render —
  // never gate a hook behind an early return (rules of hooks). The conditional
  // no-op/throw behavior is applied AFTER every hook has run, using the values
  // the hooks produced. `resolvedMode` falls back harmlessly when the provider
  // is absent (that render path throws below anyway).
  const parent = useContext(BloomThemeContext);
  const resolvedMode = parent?.theme.mode ?? 'light';

  const contextValue = useMemo<BloomThemeContextValue | null>(() => {
    if (!parent || !colorPreset) return null;
    const theme = buildTheme(colorPreset, resolvedMode);
    return { ...parent, theme, colorPreset };
  }, [colorPreset, resolvedMode, parent]);

  const varsStyle = useMemo<React.CSSProperties | null>(
    () => (colorPreset ? buildWebScopeVars(colorPreset, resolvedMode) : null),
    [colorPreset, resolvedMode],
  );

  if (!parent) {
    throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  }
  // `colorPreset` undefined => the scope is a no-op; children inherit the
  // parent scope. With `parent` present, `contextValue`/`varsStyle` are null
  // iff `colorPreset` is absent, so this guard also narrows them to non-null.
  if (!contextValue || !varsStyle) return <>{children}</>;

  let content: React.ReactNode;
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<StyleableProps>(child)) {
      throw new Error(
        'BloomColorScope with `asChild` requires a single React element child that accepts a `style` prop.',
      );
    }
    // Scope vars first, then the caller's `style`, then the child's own so its
    // explicit styles win. The shape follows the child: an array only when the
    // child's style is already RN-shaped (see the note above), an object
    // otherwise — an array reaching a DOM node throws on commit.
    const childStyle = child.props.style;
    const childIsRnStyled = Array.isArray(childStyle) || typeof childStyle === 'number';
    const mergedStyle: WebStyle = childIsRnStyled
      ? [varsStyle, style, childStyle]
      : { ...varsStyle, ...style, ...(childStyle || undefined) };
    content = cloneElement(child, { style: mergedStyle });
  } else {
    // A plain DOM `<div>` does NOT accept style arrays — only the cloned child
    // path can, so the wrapper keeps using an object spread.
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
  // Hooks first, unconditionally; throw only after they have all run.
  const parent = useContext(BloomThemeContext);
  const resolvedMode = parent?.theme.mode ?? 'light';
  const scopeStyle = useMemo(
    () => buildWebScopeVars(colorPreset, resolvedMode),
    [colorPreset, resolvedMode],
  );
  if (!parent) {
    throw new Error('useColorScopeStyle must be used within a <BloomThemeProvider>');
  }
  return scopeStyle;
}
