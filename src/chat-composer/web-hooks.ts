import { useEffect } from 'react';
import { Platform } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { CHAT_COMPOSER_STYLE_ID, CHAT_COMPOSER_WEB_CSS } from './shared';

export const IS_WEB = Platform.OS === 'web';

/**
 * A `dataSet` attribute on web — the hook the family's stylesheet hangs its
 * transitions, focus rings and hidden scrollbars off — and nothing on native.
 */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}

/**
 * Adopt the family stylesheet once (web; a no-op on native).
 *
 * Through `adoptStyleSheet`, never a `<style>` element: a `style-src 'self'`
 * policy drops a `<style>` element's contents silently, and the fork's own
 * "did I already inject it" guard still reports success.
 */
export function useChatComposerWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(CHAT_COMPOSER_STYLE_ID, CHAT_COMPOSER_WEB_CSS);
  }, []);
}
