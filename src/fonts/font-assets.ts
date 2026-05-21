// Native font asset map for `useFonts(FONT_ASSETS)`.
//
// We ship variable .ttf files for Inter and Geist Mono (extracted from the
// official rsms/inter and vercel/geist-font releases) so the same family name
// covers all weights at runtime. `@fontsource(-variable)?/*` packages only
// publish .woff2 for their variable axes — modern react-native font loading
// requires .ttf, so we use the upstream variable TTFs instead. On web,
// `apply-font-faces.ts` references the .woff2 variants directly and this file
// is never imported.

export const FONT_ASSETS = {
  BlomusModernus: require('../../assets/fonts/BlomusModernus-Regular.ttf'),
  'BlomusModernus-Bold': require('../../assets/fonts/BlomusModernus-Bold.ttf'),
  Inter: require('../../assets/fonts/InterVariable.ttf'),
  'Geist Mono': require('../../assets/fonts/GeistMono-Variable.ttf'),
} as const;
