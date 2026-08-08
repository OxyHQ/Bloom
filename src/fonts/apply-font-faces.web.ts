import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import {
  blomusModernusRegular,
  blomusModernusBold,
  interVariable,
  geistMonoVariable,
} from './font-urls.web';
import { fontFamilies } from './tokens';

const STYLE_ID = 'bloom-fonts';

/**
 * Inject @font-face rules and font CSS variables onto :root.
 *
 * Web-only. The native counterpart in `apply-font-faces.ts` is a no-op
 * stub — native loads its fonts through `useFonts(FONT_ASSETS)`, so the file
 * split keeps the web font payload out of the native bundle entirely.
 * Idempotent: safe to call multiple times; `adoptStyleSheet` keys the sheet by
 * id, so repeat calls re-parse nothing. SSR-safe via its `typeof document`
 * guard. `BloomThemeProvider` calls this on every mount by default, which is
 * why it also has to survive a page whose CSP forbids inline styles — see
 * `styles/adopt-style-sheet.ts`.
 *
 * The URLs come from `./font-urls.web`, which imports the `.woff2` files so
 * the consuming bundler emits them as separate, cacheable assets. See that
 * module for the per-bundler details and for the one thing a consumer has to
 * provide (Metro needs `woff2` in `assetExts`).
 */
export function applyFontFaces(): void {
  adoptStyleSheet(
    STYLE_ID,
    `
    @font-face { font-family: 'BlomusModernus'; src: url("${blomusModernusRegular}") format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BlomusModernus'; src: url("${blomusModernusBold}") format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Inter'; src: url("${interVariable}") format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Geist Mono'; src: url("${geistMonoVariable}") format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root {
      --bloom-font-display: ${fontFamilies.display};
      --bloom-font-sans: ${fontFamilies.sans};
      --bloom-font-mono: ${fontFamilies.mono};
    }
  `,
  );
}
