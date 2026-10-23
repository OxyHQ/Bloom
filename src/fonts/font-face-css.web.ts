import {
  blomusModernusRegular,
  blomusModernusBold,
  interVariable,
  jetbrainsMonoVariable,
} from './font-urls.web';
import { fontFamilies } from './tokens';

/** Font discovery and face declarations share the bundler's exact asset URLs. */
export const FONT_FACE_SOURCES = [
  {
    family: 'sans',
    name: 'Inter',
    url: interVariable,
    weight: '100 900',
    format: 'woff2-variations',
  },
  {
    family: 'display',
    name: 'BlomusModernus',
    url: blomusModernusRegular,
    weight: '400',
    format: 'woff2',
  },
  {
    family: 'display',
    name: 'BlomusModernus',
    url: blomusModernusBold,
    weight: '700',
    format: 'woff2',
  },
  {
    family: 'mono',
    name: 'JetBrains Mono',
    url: jetbrainsMonoVariable,
    weight: '100 800',
    format: 'woff2-variations',
  },
] as const;

/** One asset-backed font sheet for server discovery and client adoption. */
export const FONT_FACE_CSS = `
  ${FONT_FACE_SOURCES.map(
    ({ name, url, weight, format }) =>
      `@font-face { font-family: '${name}'; src: url("${url}") format('${format}'); font-weight: ${weight}; font-style: normal; font-display: swap; }`,
  ).join('\n')}
  :root {
    --bloom-font-display: ${fontFamilies.display};
    --bloom-font-sans: ${fontFamilies.sans};
    --bloom-font-mono: ${fontFamilies.mono};
  }
`;
