// Web variant of the `./fonts` barrel.
//
// The default barrel (`./index.ts`) re-exports `applyFontFaces` from
// `./apply-font-faces`, which on native is a no-op stub. The web fork
// explicitly reaches for `./apply-font-faces.web`, which performs the real
// `@font-face` injection using inlined base64 data URLs (see
// `font-data.web.ts`).
//
// Web bundlers select this file via the `"browser"` condition in
// `package.json`'s `exports['./fonts']`; native bundlers fall through to
// `./index.ts` via the `"react-native"` condition.
export { fontFamilies, fontCssVars } from './tokens';
export type { FontFamilyName } from './tokens';
export { applyFontFaces } from './apply-font-faces.web';
export { FONT_ASSETS } from './font-assets';
export { FontLoader } from './FontLoader';
export type { FontLoaderProps } from './FontLoader';
