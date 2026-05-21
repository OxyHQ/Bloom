// No-op on native. The web variant lives in apply-font-faces.web.ts and
// is selected by bundlers via the package.json conditions. RN consumers
// never need font-face injection — useFonts handles loading on native.
//
// This file MUST have zero `.woff2` imports. Metro parses module-level
// imports at bundle time and would otherwise fail to resolve the `.woff2`
// assets (not in Metro's default `assetExts`). See
// `apply-font-faces.web.ts` for the real implementation.
export function applyFontFaces(): void {
  // intentionally empty
}
