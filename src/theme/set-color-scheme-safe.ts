import { Appearance, Platform } from 'react-native';
import type { ThemeMode } from './types';

/**
 * Safely set the color scheme via Appearance API.
 * On Android (RN 0.83+), Appearance.setColorScheme has a Kotlin non-null
 * annotation on `style`. Passing null for 'system' crashes.
 * Workaround: resolve the system preference and pass 'light'/'dark' instead.
 *
 * On react-native-web, Appearance.setColorScheme is not implemented at all
 * (it's `undefined`), which crashes with "setColorScheme is not a function".
 * Appearance.getColorScheme() still works on web, so reading the system
 * preference is fine — it's only the setter that's missing. The browser /
 * electron controls the color scheme anyway, so we just bail out on web.
 */
export function setColorSchemeSafe(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    return;
  }

  const effectiveMode = mode === 'adaptive' ? 'system' : mode;
  if (effectiveMode === 'system') {
    const resolved = Appearance.getColorScheme() ?? 'light';
    Appearance.setColorScheme(resolved);
  } else {
    Appearance.setColorScheme(effectiveMode);
  }
}
