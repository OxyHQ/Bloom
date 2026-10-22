import { createContext, useContext } from 'react';
import type { BloomThemeBootstrapConfig } from './prepaint';

declare global {
  var __oxy_so_bloom_prepaint_context__:
    | React.Context<BloomThemeBootstrapConfig | undefined>
    | undefined;
}

/** Final web paint may select its mode before React hydrates the semantic theme. */
if (!globalThis.__oxy_so_bloom_prepaint_context__) {
  globalThis.__oxy_so_bloom_prepaint_context__ = createContext<
    BloomThemeBootstrapConfig | undefined
  >(undefined);
}
export const PrepaintThemeContext = globalThis.__oxy_so_bloom_prepaint_context__;

export function usePrepaintTheme(): boolean {
  return useContext(PrepaintThemeContext) !== undefined;
}

export function usePrepaintThemeConfig(): BloomThemeBootstrapConfig | undefined {
  return useContext(PrepaintThemeContext);
}
