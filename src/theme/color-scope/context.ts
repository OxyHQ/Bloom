import { createContext } from 'react';
import type { Theme } from '../types';

export interface ScopePalette {
  theme: Theme;
  vars: Record<string, string>;
}

/** Private resolved source, retained through scopes and portal outlets. */
export interface ScopeState extends ScopePalette {
  resolveMode: (mode: 'light' | 'dark') => ScopePalette;
}

declare global {
  // eslint-disable-next-line no-var
  var __oxy_so_bloom_scope_context__: React.Context<ScopeState | null> | undefined;
}

export const ThemeScopeContext = (globalThis.__oxy_so_bloom_scope_context__ ??=
  createContext<ScopeState | null>(null));
