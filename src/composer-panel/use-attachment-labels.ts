import { useMemo } from 'react';

import { useMessages } from '../locale/messages';
import { COMPOSER_PANEL_MESSAGES } from './messages';

/**
 * The names of an attachment tile's dismiss and retry for a file.
 *
 * A caller's `remove` / `retry` stays a prefix to the file name, as it always
 * was; Bloom's own wording is the language's whole phrase. Shared by the panel
 * and the pill, which draw the same strip.
 */
export function useAttachmentLabels(overrides: { remove?: string; retry?: string } | undefined) {
  const { messages } = useMessages(COMPOSER_PANEL_MESSAGES);
  const removeOverride = overrides?.remove;
  const retryOverride = overrides?.retry;
  return useMemo(
    () => ({
      removeFileLabel:
        removeOverride !== undefined
          ? (name: string) => `${removeOverride} ${name}`
          : messages.removeFile,
      retryFileLabel:
        retryOverride !== undefined
          ? (name: string) => `${retryOverride} ${name}`
          : messages.retryFile,
    }),
    [removeOverride, retryOverride, messages],
  );
}
