/**
 * The root a region that hands a Bloom component a class (`bloom22` on the case)
 * is drawn in on the web, before: Bloom 22's provider, the last Bloom that took
 * the class. Every other region's before side is drawn under this checkout's
 * Bloom provider, which writes the theme's variables the app's classes read.
 */
import type { ReactNode } from 'react';
import { BloomThemeProvider as BloomThemeProvider22 } from 'bloom-22/theme';

import type { WebFrame } from '../../../bloom-language/parity/support/web';

export const bloom22Web: WebFrame = (element: ReactNode, scheme) => (
  <BloomThemeProvider22 fonts={false} mode={scheme}>
    {element}
  </BloomThemeProvider22>
);
