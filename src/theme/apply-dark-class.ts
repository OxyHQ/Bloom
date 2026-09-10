import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import type { ExplicitAccents } from './preset-vars';
import { getResolvedTokens } from './token-registry';

export function applyDarkClass(resolved: 'light' | 'dark') {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
}

/**
 * Theme the browser's document canvas as well as the app's React surfaces.
 * The root background covers exposed viewport/overscroll areas; color-scheme
 * lets browser-owned controls follow the resolved mode. theme-color is a hint
 * for mobile browser chrome, whose final appearance remains browser-controlled.
 * Called only by the app-wide provider, never by color/seed scopes.
 */
export function applyDocumentTheme(resolved: 'light' | 'dark', background: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  for (const element of [document.documentElement, document.body]) {
    if (!element) continue;
    // The canonical token is the document paint source. The concrete colour is
    // still passed separately for metadata, which cannot consume CSS variables.
    element.style.backgroundColor = 'var(--background)';
    element.style.colorScheme = resolved;
  }

  // Authored entries are useful before hydration, but become competing runtime
  // owners afterwards. Adopt one entry and remove every fallback once Bloom's
  // root provider has resolved the actual app preference.
  const head = document.head;
  if (!head) return;
  let meta = head.querySelector<HTMLMetaElement>('meta[data-bloom-theme-color]');
  if (!meta) {
    meta = head.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ??
      document.createElement('meta');
    meta.setAttribute('data-bloom-theme-color', '');
    meta.name = 'theme-color';
  }
  meta.content = background;
  meta.removeAttribute('media');
  if (!meta.isConnected) head.append(meta);
  for (const candidate of Array.from(head.querySelectorAll('meta[name="theme-color"]'))) {
    if (candidate !== meta) candidate.remove();
  }
}

/**
 * Apply a color preset's CSS custom properties to the document root.
 * No-op on native — only affects web (early-returns on `Platform.OS !== 'web'`).
 *
 * Web var contract (the form Tailwind v4 `@theme inline` compiles to)
 * -------------------------------------------------------------------
 * The shadcn/Tailwind-v4 web apps compile their color utilities to reference the
 * BASE token directly (`.bg-background { background-color: var(--background) }`),
 * so on web the base `--x` tokens MUST be FULL CSS colors. `getResolvedTokens`
 * returns every canonical token already resolved to an sRGB `rgb(...)` string,
 * so `var(--x)` resolves to a valid color directly — no per-value wrapping. The
 * same rgb values feed native (`color-mix` alpha utilities resolve on sRGB), so
 * web and native share one canonical token pipeline.
 *
 * Includes extended tokens (card, chart-*, content-area, sidebar-*) so consumer
 * apps don't need to synthesize them.
 */
/**
 * Write a pre-computed `--x -> value` record to the document root (web only).
 * The single web writer primitive: both the preset path (`applyColorPresetVars`)
 * and `BloomThemeProvider`'s dynamic-seed path feed their already-resolved vars
 * through here, so the "write to document" logic lives in exactly one place.
 */
export function applyVarsToDocument(vars: Record<string, string>) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, value);
  }
}

export function applyColorPresetVars(
  preset: AppColorName,
  resolved: 'light' | 'dark',
  accents?: ExplicitAccents,
) {
  if (!APP_COLOR_PRESETS[preset]) return;
  applyVarsToDocument(getResolvedTokens(preset, resolved, accents));
}
