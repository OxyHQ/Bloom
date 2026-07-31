// Node variant of the `./fonts` barrel, selected by the `node` export
// condition. Same surface as `./index.ts`, with every member resolved to the
// inert implementation:
//
// - `./apply-font-faces` is the no-op stub. The web one is unreachable here on
//   purpose: it imports `font-urls.web`, whose `.woff2` imports Node feeds to
//   the JS parser, so loading it throws `SyntaxError` before any runtime guard
//   can help.
// - `./font-assets` is the empty map — there is no native font registry.
// - `./FontLoader.node` renders children and nothing else.
//
// Both platform-forked members are named OUTRIGHT rather than left
// extensionless, for the same reason `index.web.ts` does it: Node performs no
// platform-extension resolution, so a bare specifier would fall through to
// whichever file happens to sit at that path.
export { fontFamilies, fontCssVars } from './tokens';
export type { FontFamilyName } from './tokens';
export { applyFontFaces } from './apply-font-faces';
export { FONT_ASSETS } from './font-assets';
export { FontLoader } from './FontLoader.node';
export type { FontLoaderProps } from './FontLoader.node';
