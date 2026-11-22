import { type ComponentType, createContext, type ReactNode } from 'react';

/**
 * A component each native colour scope draws its subtree through, handed the
 * scope's token record (`--primary` …, with the `--color-*` aliases an app's
 * Tailwind theme reads). Bloom draws nothing with it; it lets an app that still
 * styles its own views another way (app-preset's `BloomNativeWindTheme` for an
 * app's leftover `className`) carry each scope's palette into that system, so
 * those views follow the scope as Bloom's do. `null` (the default) adds nothing.
 *
 * `vars` is empty for a scope that publishes no palette of its own: a layer that
 * merges over its parent's then leaves it as it was.
 */
export type ColorScopeLayer = ComponentType<{
  vars: Readonly<Record<string, string>>;
  children: ReactNode;
}>;

const NO_VARS: Readonly<Record<string, string>> = Object.freeze({});

declare global {
  var __oxy_so_bloom_scope_layer_context__: React.Context<ColorScopeLayer | null> | undefined;
}

export const ColorScopeLayerContext = (globalThis.__oxy_so_bloom_scope_layer_context__ ??=
  createContext<ColorScopeLayer | null>(null));

/** A scope's subtree through the layer, when one is provided. */
export function throughLayer(
  Layer: ColorScopeLayer | null,
  vars: Readonly<Record<string, string>> | undefined,
  content: ReactNode,
): ReactNode {
  if (!Layer) return content;
  return <Layer vars={vars ?? NO_VARS}>{content}</Layer>;
}
