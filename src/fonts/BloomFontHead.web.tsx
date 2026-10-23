import { FONT_FACE_SOURCES } from './font-face-css.web';
import type { BloomFontHeadProps } from './types';

/** Place in the HTML document head, before blocking stylesheets, never in the app root. */
export function BloomFontHead({ families = ['sans', 'display'] }: BloomFontHeadProps) {
  return (
    <>
      {FONT_FACE_SOURCES.filter((font) => families.includes(font.family)).map((font) => (
        <link
          key={`${font.family}-${font.weight}`}
          rel="preload"
          href={font.url}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      ))}
    </>
  );
}
