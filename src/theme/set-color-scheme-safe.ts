import { Appearance, Platform } from 'react-native';
import type { ThemeMode } from './types';

/**
 * Safely set the color scheme via Appearance API.
 *
 * Behavior by mode:
 * - 'light' / 'dark': set the explicit override.
 * - 'system' / 'adaptive': leave the OS in control. We must NOT call
 *   Appearance.setColorScheme(resolved) here — doing so installs an
 *   app-level override that masks the OS preference. Once that override
 *   is set, useColorScheme() / Appearance.getColorScheme() return the
 *   frozen override instead of the live OS value, and the app stops
 *   following dark↔light OS toggles until a cold restart.
 *
 *   On iOS we additionally pass 'unspecified' to clear any prior
 *   override that may have been installed by a previous explicit mode.
 *   'unspecified' is the documented sentinel that tells the native
 *   Appearance module to fall back to the OS preference. (RN's JS
 *   implementation forwards this straight through to the native
 *   bridge; on iOS this clears the override.)
 *
 *   On Android (RN 0.83+) the native Kotlin signature has @NonNull on
 *   `style` and rejects null, and 'unspecified' is not honored as a
 *   clear-override sentinel on Android either. As a result, if a user
 *   previously selected 'light' or 'dark' and then switches back to
 *   'system' on Android, the override remains until the next cold
 *   restart. Users who never explicitly overrode are unaffected because
 *   we never install an override in system mode in the first place.
 *
 * On react-native-web, Appearance.setColorScheme is not implemented at
 * all; the browser controls the color scheme, so we bail out on web.
 */
export function setColorSchemeSafe(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    return;
  }

  const effectiveMode = mode === 'adaptive' ? 'system' : mode;

  if (effectiveMode === 'system') {
    // Clear any prior app-level override so useColorScheme() tracks the
    // OS. iOS honors 'unspecified' as a sentinel to fall back to the
    // system preference; Android does not (see note above).
    if (Platform.OS === 'ios') {
      Appearance.setColorScheme('unspecified');
    }
    return;
  }

  Appearance.setColorScheme(effectiveMode);
}
