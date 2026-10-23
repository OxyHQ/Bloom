import { buildTheme } from './build-theme';
import { buildScopeVars } from './color-scope/style-builder';
import type { ScopePalette } from './color-scope/context';
import type { AppColorName } from './color-presets';

// Named presets are a finite registry. Reuse their engine results across the
// document head and all server paint owners, without churning the seed LRU.
const palettes = new Map<string, ScopePalette>();

export function getPrepaintPalette(preset: AppColorName, mode: 'light' | 'dark'): ScopePalette {
  const key = `${preset}/${mode}`;
  let palette = palettes.get(key);
  if (!palette) {
    palette = { theme: buildTheme(preset, mode), vars: buildScopeVars(preset, mode) };
    palettes.set(key, palette);
  }
  return palette;
}
