import { buildScopeVars } from './color-scope/style-builder';
import type { AppColorName } from './color-presets';
import type { ThemeMode } from './types';
import type { ThemeColors } from './types';
import { buildTheme } from './build-theme';

/** Share the same configuration between the document head and root provider. */
export interface BloomThemeBootstrapConfig {
  defaultMode?: ThemeMode;
  defaultColorPreset?: AppColorName;
  /** localStorage key containing a plain light/dark/system/adaptive preference. */
  modeStorageKey?: string;
}

/** Raw semantic colors stay numeric; only final web paint reads these CSS variables. */
export function themePaintVars(colors: ThemeColors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(colors).map(([name, value]) => [`--bloom-paint-${name}`, value]),
  );
}

export function applyPrepaintMode(mode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-bloom-theme-mode', mode);
}

function declarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value};`)
    .join('');
}

/**
 * Build deterministic head resources from Bloom's own palette engine. Hosts can
 * hash these exact script bytes for CSP, or give BloomThemeHead a nonce.
 */
export function getThemeBootstrap(config: BloomThemeBootstrapConfig = {}): {
  css: string;
  script: string;
} {
  const preset = config.defaultColorPreset ?? 'oxy';
  const mode = config.defaultMode ?? 'system';
  const light = `${declarations(buildScopeVars(preset, 'light'))}${declarations(themePaintVars(buildTheme(preset, 'light').colors))}color-scheme:light;`;
  const dark = `${declarations(buildScopeVars(preset, 'dark'))}${declarations(themePaintVars(buildTheme(preset, 'dark').colors))}color-scheme:dark;`;
  const system = mode === 'system' || mode === 'adaptive';
  const css = `:root{${mode === 'dark' ? dark : light}}${system ? `@media(prefers-color-scheme:dark){:root:not([data-bloom-theme-mode]){${dark}}}` : ''}:root[data-bloom-theme-mode="light"]{${light}}:root[data-bloom-theme-mode="dark"]{${dark}}html,body{background-color:var(--background);color:var(--foreground);}`;
  // JSON is code data, never HTML. Escape '<' so a storage key cannot close the
  // script element; separators also remain safe in older script parsers.
  const data = JSON.stringify({ mode, key: config.modeStorageKey })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const script = `(function(c){var m=c.mode;try{var s=c.key&&localStorage.getItem(c.key);if(s==='light'||s==='dark'||s==='system'||s==='adaptive')m=s}catch(e){}var d=m==='dark';if(m==='system'||m==='adaptive'){try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}}var r=document.documentElement;r.setAttribute('data-bloom-theme-mode',d?'dark':'light');r.classList.toggle('dark',d)})(${data});`;
  return { css, script };
}
