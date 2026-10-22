import { createContext } from 'react';
import type { Theme } from '../types';

export interface ScopePalette {
  theme: Theme;
  vars: Record<string, string>;
}

/** Private resolved source, retained through scopes and portal outlets. */
export interface ScopeState extends ScopePalette {
  resolveMode: (mode: 'light' | 'dark') => ScopePalette;
  /** Explicit local mode, retained through portals; undefined inherits document selection. */
  fixedMode?: 'light' | 'dark';
  /** Root selection is independent of a local forced palette and its backing. */
  rootMode?: 'light' | 'dark';
}

declare global {
  var __oxy_so_bloom_scope_context__: React.Context<ScopeState | null> | undefined;
}

export const ThemeScopeContext = (globalThis.__oxy_so_bloom_scope_context__ ??=
  createContext<ScopeState | null>(null));
