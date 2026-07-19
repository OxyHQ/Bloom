import { type AppColorName } from './color-presets';
import type { ExplicitAccents } from './preset-vars';

/**
 * Platform-neutral DEFAULT variant of `applyNativeRootVars` — a no-op.
 *
 * This is the file resolved by every bundler / type-checker that does NOT do
 * React Native's platform-extension resolution:
 *   - a consumer's `tsc` (resolving Bloom's `"react-native"` -> `./src/...` source
 *     export condition: `theme/index.ts` -> `BloomThemeProvider` -> this import);
 *   - non-Metro web bundlers (Vite/Rolldown, webpack) resolving the package
 *     `exports` `import`/`require` conditions to `lib/.../native-root-vars.js`.
 *
 * It deliberately does NOT import `react-native-css/native-internal`. That subpath
 * is native-only. Statically importing it from a file a web bundler resolves breaks
 * module resolution outright (the original report: `Rolldown failed to resolve
 * import "react-native-css/native-internal" from .../native-root-vars.js`).
 * Importing it from a file a consumer's `tsc` resolves breaks type-check (TS2307).
 *
 * Confining the real implementation (and that import) to the `.native` sibling —
 * `native-root-vars.native.ts`, which ONLY Metro selects — keeps both web bundling
 * AND downstream `tsc` green, while native still publishes the preset vars into
 * react-native-css's GLOBAL `rootVariables` family so the whole native tree
 * (navigator screens + portals/modals) resolves the palette.
 *
 * The other variants:
 *   - `native-root-vars.native.ts` — iOS/Android (Metro), the real implementation;
 *   - `native-root-vars.web.ts` — web, also a no-op (web writes the same vars to
 *     `document.documentElement` via `applyColorPresetVars` instead).
 *
 * The signature is intentionally identical to those variants so the import site in
 * `BloomThemeProvider` is platform-agnostic.
 */
export function applyNativeRootVars(
  _colorPreset: AppColorName,
  _mode: 'light' | 'dark',
  _accents?: ExplicitAccents,
): void {
  // Intentionally empty — the native variant (`native-root-vars.native.ts`) does
  // the real work; this neutral default and the web fork are inert.
}
