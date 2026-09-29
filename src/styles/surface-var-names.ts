/**
 * The names of the CSS custom properties a surface publishes — a LEAF module
 * (no imports) so the `design-tokens` entry can name them without pulling React
 * into its graph. What each one holds, and who publishes it:
 * `styles/surface-paint.ts` `surfaceVars`.
 */
export const SURFACE_VAR = {
  fill: '--bloom-surface',
  raised: '--bloom-surface-raised',
  hairline: '--bloom-hairline',
  textSecondary: '--bloom-text-secondary',
  textTertiary: '--bloom-text-tertiary',
  textGraphical: '--bloom-text-graphical',
  /** The focus ring's gap — `styles/interactive-web-css.ts` explains why it is a variable. */
  ringOffset: '--bloom-ring-offset',
} as const;
