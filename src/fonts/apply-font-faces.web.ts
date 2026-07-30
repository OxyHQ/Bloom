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
 * Idempotent: safe to call multiple times; subsequent calls early-return
 * after the `<style id="bloom-fonts">` tag has been mounted. SSR-safe via
 * the `typeof document === 'undefined'` guard.
 *
 * The URLs come from `./font-urls.web`, which imports the `.woff2` files so
 * the consuming bundler emits them as separate, cacheable assets. See that
 * module for the per-bundler details and for the one thing a consumer has to
 * provide (Metro needs `woff2` in `assetExts`).
 */
export function applyFontFaces(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face { font-family: 'BlomusModernus'; src: url("${blomusModernusRegular}") format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BlomusModernus'; src: url("${blomusModernusBold}") format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Inter'; src: url("${interVariable}") format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Geist Mono'; src: url("${geistMonoVariable}") format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root {
      --bloom-font-display: ${fontFamilies.display};
      --bloom-font-sans: ${fontFamilies.sans};
      --bloom-font-mono: ${fontFamilies.mono};
    }
  `;
  document.head.appendChild(style);
}
