/**
 * Font family tokens for the Bloom design system.
 *
 * `fontFamilies` resolves to CSS-style stacks (with system fallbacks) and is
 * used to populate the `:root` custom properties on web and as the literal
 * `fontFamily` string source on native.
 *
 * `fontCssVars` is the inverse map: name -> CSS custom property name.
 */

export const fontFamilies = {
  display: 'BlomusModernus, Georgia, "Times New Roman", serif',
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const fontCssVars = {
  display: '--bloom-font-display',
  sans: '--bloom-font-sans',
  mono: '--bloom-font-mono',
} as const;

export type FontFamilyName = keyof typeof fontFamilies;
