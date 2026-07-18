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
  sans: 'BlomusModernus, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const fontCssVars = {
  display: '--bloom-font-display',
  sans: '--bloom-font-sans',
  mono: '--bloom-font-mono',
} as const;

export type FontFamilyName = keyof typeof fontFamilies;

/**
 * Shape of the font asset map handed to `expo-font`'s `useFonts()`.
 *
 * Values are Metro asset-registry ids produced by `require('./assets/*.ttf')`,
 * so the map is only ever populated under Metro (`font-assets.native.ts`).
 * Every other platform resolves an empty map — web installs the same families
 * as `@font-face` rules instead (`apply-font-faces.web.ts`).
 *
 * Declared here, in the platform-neutral tokens module, so all three
 * `font-assets` variants can share it without importing each other.
 */
export type FontAssetMap = Record<string, number>;
