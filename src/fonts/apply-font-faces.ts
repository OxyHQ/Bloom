import { Platform } from 'react-native';
import blomusReg from './assets/BlomusModernus-Regular.woff2';
import blomusBold from './assets/BlomusModernus-Bold.woff2';
import interVar from './assets/InterVariable.woff2';
import geistMono from './assets/GeistMono-Variable.woff2';
import { fontFamilies } from './tokens';

const STYLE_ID = 'bloom-fonts';

/**
 * Inject @font-face rules and font CSS variables onto :root.
 *
 * No-op on native and when `document` is unavailable (SSR). Idempotent —
 * safe to call multiple times; subsequent calls early-return after the
 * `<style id="bloom-fonts">` tag has been mounted.
 *
 * Follows the same shape as `applyDarkClass` / `applyColorPresetVars`: a
 * single file with an internal `Platform.OS` check rather than a `.web.ts` /
 * `.native.ts` split. Bundlers strip the unreachable web import code path
 * on native because the function body short-circuits before referencing the
 * woff2 URLs.
 */
export function applyFontFaces(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusReg}) format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusBold}) format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Inter'; src: url(${interVar}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Geist Mono'; src: url(${geistMono}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root {
      --bloom-font-display: ${fontFamilies.display};
      --bloom-font-sans: ${fontFamilies.sans};
      --bloom-font-mono: ${fontFamilies.mono};
    }
  `;
  document.head.appendChild(style);
}
