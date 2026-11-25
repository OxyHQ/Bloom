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
 *
 * It imports nothing, so a reader of the names (`useColorTokens`) does not pull
 * in the colour engine; `token-registry` re-exports it.
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
  'tertiary',
  'tertiary-foreground',
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
  'chart-6',
  'chart-7',
  'chart-8',
  'chart-9',
  'chart-1-active',
  'chart-2-active',
  'chart-3-active',
  'chart-4-active',
  'chart-5-active',
  'chart-6-active',
  'chart-7-active',
  'chart-8-active',
  'chart-9-active',
  'content-area',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',

  // --- the accent families ---
  // Each accent is a FAMILY, not a colour: a fill, the label that is legible on
  // it, a `-text` form for a mark on the page, and a `-subtle` translucent tint
  // for the surface behind one. A single value can only ever be a fill, which is
  // why consumers hand-rolled the rest with hex-alpha arithmetic.
  'primary-text',
  'vivid',
  'vivid-foreground',
  'primary-subtle',
  'secondary-text',
  'secondary-subtle',
  'tertiary-text',
  'tertiary-subtle',

  // --- semantic status, themed per mode ---
  // Replaces four frozen hexes that all FAILED AA under white text (warning at
  // 2.15, success 2.54, info 3.68, error 3.76) and had no subtle or text member.
  'success',
  'success-foreground',
  'success-text',
  'success-subtle',
  'error',
  'error-foreground',
  'error-text',
  'error-subtle',
  'warning',
  'warning-foreground',
  'warning-text',
  'warning-subtle',
  'info',
  'info-foreground',
  'info-text',
  'info-subtle',
] as const;

/** A canonical token name (no leading `--`). */
export type CanonicalToken = (typeof CANONICAL_TOKENS)[number];
