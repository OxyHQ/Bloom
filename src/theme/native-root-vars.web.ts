import { type AppColorName } from './color-presets';

/**
 * Web fork of `applyNativeRootVars` — a no-op.
 *
 * On web, `BloomThemeProvider` already writes the active preset's CSS vars to
 * `document.documentElement` via `applyColorPresetVars`, which the browser /
 * react-native-web resolve natively. The native/default variant — the plain
 * sibling `native-root-vars.ts` — instead publishes those vars into
 * react-native-css's GLOBAL `rootVariables` family.
 *
 * Keeping the native variant's `react-native-css/native-internal` import out of
 * the web bundle is the whole reason this is a platform-split module: web (and
 * any non-NativeWind host) picks this `.web` fork over the plain file and so
 * never statically pulls react-native-css internals.
 *
 * The signature is intentionally identical to the plain variant so the import
 * site in `BloomThemeProvider` is platform-agnostic.
 */
export function applyNativeRootVars(_colorPreset: AppColorName, _mode: 'light' | 'dark'): void {
  // Intentionally empty — web applies preset vars to `document.documentElement`.
}
