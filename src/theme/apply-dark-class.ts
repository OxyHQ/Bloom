import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { getPresetVars } from './preset-vars';

export function applyDarkClass(resolved: 'light' | 'dark') {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
}

/**
 * Apply a color preset's CSS custom properties to the document root.
 * No-op on native — only affects web.
 *
 * Writes both the raw HSL triples (e.g. `--primary: 185 100% 20%`) and the
 * resolved `--color-*` vars (`--color-primary: hsl(185 100% 20%)`) so both
 * shadcn-style `hsl(var(--primary))` plumbing and Tailwind v4 `@theme`
 * utilities resolve consistently. Includes extended tokens (card, chart-*,
 * content-area, sidebar-*) so consumer apps don't need to synthesize them.
 */
export function applyColorPresetVars(preset: AppColorName, resolved: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!APP_COLOR_PRESETS[preset]) return;

  const vars = getPresetVars(preset, resolved, { includeResolvedColorVars: true });
  const root = document.documentElement.style;

  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, value);
  }
}
