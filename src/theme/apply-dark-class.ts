import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';

export function applyDarkClass(resolved: 'light' | 'dark') {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
}

/**
 * Apply a color preset's CSS custom properties to the document root.
 * No-op on native — only affects web.
 */
export function applyColorPresetVars(preset: AppColorName, resolved: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const config = APP_COLOR_PRESETS[preset];
  if (!config) return;

  const vars = resolved === 'dark' ? config.dark : config.light;
  const root = document.documentElement.style;

  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, `hsl(${value})`);
  }
}
