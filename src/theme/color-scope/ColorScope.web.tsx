import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';

import { BloomThemeContext } from '../BloomThemeProvider';
import { ThemeScopeContext } from './context';
import { useScope } from './use-scope';
import type { BloomColorScopeTokens } from './types';
import type { AppColorName } from '../color-presets';
import { buildScopeVars } from './style-builder';

/**
 * `buildScopeVars` returns every canonical token already resolved to an sRGB
 * `rgb(...)` string, plus the `--color-*` aliases consumed by Tailwind v4
 * utilities. Scoped onto an element's inline `style`, profile-level NativeWind
 * classes resolve against the subtree preset instead of the document root.
 */
function buildWebScopeVars(colorPreset: AppColorName, mode: 'light' | 'dark'): React.CSSProperties {
  return buildScopeVars(colorPreset, mode) as React.CSSProperties;
}

export interface BloomColorScopeProps {
  /**
   * Preset to apply within this subtree. When `undefined`, the scope publishes
   * nothing of its own and children inherit the parent scope's preset unchanged.
   *
   * It is a no-op in what it PUBLISHES, never in what it RENDERS — the element
   * tree is identical either way, so a preset that arrives late cannot remount
   * the subtree. `ColorScope.tsx` carries the full account.
   */
  colorPreset?: AppColorName;
  /** Local resolved mode; does not change the app mode, storage or document. */
  mode?: 'light' | 'dark';
  /** Exact canonical colors. Unspecified roles inherit the selected preset or parent scope. */
  tokens?: BloomColorScopeTokens;
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
type WebStyle = React.CSSProperties | number | null | undefined | false | ReadonlyArray<WebStyle>;

interface StyleableProps {
  style?: WebStyle;
}

export function BloomColorScope({
  colorPreset,
  mode,
  tokens,
  asChild = false,
  style,
  children,
}: BloomColorScopeProps) {
  const { context, state, vars } = useScope(colorPreset, mode, tokens);
  const varsStyle = vars as React.CSSProperties | undefined;

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
      ? [varsStyle ?? undefined, style, childStyle]
      : { ...varsStyle, ...style, ...(childStyle || undefined) };
    content = cloneElement(child, { style: mergedStyle });
  } else {
    // A plain DOM `<div>` does NOT accept style arrays — only the cloned child
    // path can, so the wrapper keeps using an object spread.
    const mergedStyle: React.CSSProperties = { ...varsStyle, ...style };
    content = <div style={mergedStyle}>{children}</div>;
  }

  return (
    <BloomThemeContext.Provider value={context}>
      <ThemeScopeContext.Provider value={state}>{content}</ThemeScopeContext.Provider>
    </BloomThemeContext.Provider>
  );
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
