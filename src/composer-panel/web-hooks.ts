import { useEffect } from 'react';
import { Platform } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { COMPOSER_STYLE_ID, COMPOSER_WEB_CSS } from './shared';

export const IS_WEB = Platform.OS === 'web';

/**
 * A `dataSet` attribute on web — the hook the family's stylesheet hangs its
 * transitions, focus rings and hidden scrollbars off — and nothing on native.
 */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}

/** Adopt the family stylesheet once (web; a no-op on native). */
export function useComposerWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(COMPOSER_STYLE_ID, COMPOSER_WEB_CSS);
  }, []);
}
