import { useEffect } from 'react';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { COMPOSER_STYLE_ID, COMPOSER_WEB_CSS } from './shared';
import { IS_WEB } from '../styles/platform';

/**
 * A `dataSet` attribute on web — the hook the family's stylesheet hangs its
 * transitions, focus rings and hidden scrollbars off — and nothing on native.
 */

/** Adopt the family stylesheet once (web; a no-op on native). */
export function useComposerWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(COMPOSER_STYLE_ID, COMPOSER_WEB_CSS);
  }, []);
}
