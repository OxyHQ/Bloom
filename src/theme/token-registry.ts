import { APP_COLOR_NAMES, type AppColorName } from './color-presets';
import { getPresetVars } from './preset-vars';

/**
 * The canonical set of Bloom theme token names — WITHOUT the leading `--`.
 *
 * This is the single source of truth for which tokens a preset produces. It
 * covers exactly the keys returned by `getPresetVars(name, mode)` (the base
 * shadcn palette plus the synthesized extended tokens: card/chart/content-area/
 * sidebar-*). The list is intentionally hand-maintained and verified by
 * `token-registry.test.ts` against the live `getPresetVars('oxy', 'light')`
 * output, so any drift in the preset shape fails CI.
 *
 * Order mirrors `getPresetVars`'s insertion order: base tokens first (in the
 * order they appear in the preset data), then the synthesized extended tokens.
 */
export const CANONICAL_TOKENS = [
  'background',
  'foreground',
  'surface',
  'surface-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'sidebar',
  'card',
  'card-foreground',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'content-area',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

/** A canonical token name (no leading `--`). */
export type CanonicalToken = (typeof CANONICAL_TOKENS)[number];

/**
 * Matches a shadcn-style raw HSL triple — `H S% L%`, optionally with an alpha
 * tail `H S% L% / A`. The value starts with a digit (or a leading `-`) and
 * carries at least one `%` (the saturation/lightness units), which distinguishes
 * a bare triple from an already-resolved color (`rgb(...)`, `#fff`) or a
 * unitless/length token (`--radius: 0.5rem`).
 */
const RAW_HSL_TRIPLE = /^-?\d[\d.]*\s+[\d.]+%/;

/**
 * Convert a shadcn-style HSL triple (`'H S% L%'`, optionally with an alpha tail
 * `'H S% L% / A'`) into an sRGB `rgb(...)` string.
 *
 * Standard HSL→sRGB math with integer-rounded channels and modern
 * space-separated output (`rgb(r g b)` / `rgb(r g b / a)`). This is the SINGLE
 * conversion the whole library uses — web document writes, web scope vars, and
 * native `rootVariables` all flow through `getResolvedTokens`, which calls this.
 * The byte-for-byte output is frozen by the golden parity fixture
 * (`__fixtures__/golden-resolved-tokens.json`), so the visible palette cannot
 * drift.
 *
 * Task 2's `oklchToSrgb` (in `color-space.ts`) stays available for a FUTURE
 * OKLCH re-authoring of the seed palette; it is intentionally NOT used here —
 * routing through OKLCH would shift the rounded channels off the frozen palette.
 *
 * Pure function — no side effects.
 */
export function hslToSrgb(triple: string): string {
  const [colorPart, alphaPart] = triple.split('/').map((part) => part.trim());
  const channels = (colorPart ?? '').split(/\s+/).filter(Boolean);

  const hue = parseFloat((channels[0] ?? '0').replace(/deg$/i, ''));
  const sat = parseFloat((channels[1] ?? '0').replace('%', '')) / 100;
  const light = parseFloat((channels[2] ?? '0').replace('%', '')) / 100;

  const h = Number.isFinite(hue) ? hue : 0;
  const s = Number.isFinite(sat) ? sat : 0;
  const l = Number.isFinite(light) ? light : 0;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = ((((h % 360) + 360) % 360) / 60);
  const second = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;
  if (huePrime < 1) {
    [r, g, b] = [chroma, second, 0];
  } else if (huePrime < 2) {
    [r, g, b] = [second, chroma, 0];
  } else if (huePrime < 3) {
    [r, g, b] = [0, chroma, second];
  } else if (huePrime < 4) {
    [r, g, b] = [0, second, chroma];
  } else if (huePrime < 5) {
    [r, g, b] = [second, 0, chroma];
  } else {
    [r, g, b] = [chroma, 0, second];
  }

  const match = l - chroma / 2;
  const red = Math.round((r + match) * 255);
  const green = Math.round((g + match) * 255);
  const blue = Math.round((b + match) * 255);

  if (alphaPart !== undefined && alphaPart !== '') {
    const alpha = alphaPart.endsWith('%')
      ? parseFloat(alphaPart) / 100
      : parseFloat(alphaPart);
    const safeAlpha = Number.isFinite(alpha) ? alpha : 1;
    return `rgb(${red} ${green} ${blue} / ${safeAlpha})`;
  }

  return `rgb(${red} ${green} ${blue})`;
}

/**
 * Resolve a preset's canonical runtime color tokens to sRGB `rgb(...)` strings.
 *
 * THE single source of runtime color tokens for the whole library, on BOTH web
 * and native. Takes the raw triple map from `getPresetVars(preset, mode)` (base
 * + extended) and converts every value that looks like an HSL triple via
 * `hslToSrgb`. Non-triple values (already-resolved colors, length/radius tokens)
 * pass through unchanged. Keys retain the `--` prefix, so each `--x` token IS a
 * full CSS color — no resolved-color companion universe, no per-platform wrapping.
 *
 * The result is frozen by the golden parity fixture
 * (`__fixtures__/golden-resolved-tokens.json`), guaranteeing the visible palette
 * matches the previous resolved-color pipeline byte-for-byte.
 */
export function getResolvedTokens(
  preset: AppColorName,
  mode: 'light' | 'dark',
): Record<string, string> {
  const raw = getPresetVars(preset, mode);
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    resolved[key] = RAW_HSL_TRIPLE.test(value) ? hslToSrgb(value) : value;
  }
  return resolved;
}

export { APP_COLOR_NAMES };
