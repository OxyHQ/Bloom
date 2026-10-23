import {
  blomusModernusRegular,
  blomusModernusBold,
  interVariable,
  jetbrainsMonoVariable,
} from './font-urls.web';
import { fontFamilies } from './tokens';

/** One asset-backed font sheet for server discovery and client adoption. */
export const FONT_FACE_CSS = `
  @font-face { font-family: 'BlomusModernus'; src: url("${blomusModernusRegular}") format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
  @font-face { font-family: 'BlomusModernus'; src: url("${blomusModernusBold}") format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Inter'; src: url("${interVariable}") format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
  @font-face { font-family: 'JetBrains Mono'; src: url("${jetbrainsMonoVariable}") format('woff2-variations'); font-weight: 100 800; font-style: normal; font-display: swap; }
  :root {
    --bloom-font-display: ${fontFamilies.display};
    --bloom-font-sans: ${fontFamilies.sans};
    --bloom-font-mono: ${fontFamilies.mono};
  }
`;
