/**
 * The settings modal's web-only interaction CSS:
 * `focus-visible:ring-2 ring-border-focus-ring`, `cursor-pointer` and the colour
 * transitions. Every pressable here is a react-native-web `Pressable`, so the
 * rules hang off `dataSet` attributes (a class never reaches the DOM — see
 * `chip/Chip.tsx`). Hover COLOURS are state-driven so they paint on native too;
 * only the transition and the keyboard ring live here. Injected through
 * `adoptStyleSheet` (never a `<style>` element), a no-op without a `document`.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';

export const IS_WEB = Platform.OS === 'web';

const STYLE_ID = 'bloom-settings-modal-web-css';

/** `ease` 150ms colour transition + keyboard ring. `inset` rings sit inside the box. */
const CSS = `
[data-bloom-settings-press] {
  cursor: pointer;
  outline: none;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
}
[data-bloom-settings-press][aria-disabled="true"] {
  cursor: default;
}
[data-bloom-settings-press]:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-settings-ring);
}
[data-bloom-settings-press][data-ring-inset]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-settings-ring);
}
[data-bloom-settings-press][data-ring-offset]:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-settings-ring-offset), 0 0 0 4px var(--bloom-settings-ring);
}
[data-bloom-settings-scroll] {
  scrollbar-width: none;
}
[data-bloom-settings-scroll]::-webkit-scrollbar {
  display: none;
}
[data-bloom-settings-dialog]:focus {
  outline: none;
}
`;

export function useSettingsWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
}

/** `dataSet` for a react-native-web node; nothing on native. */
export function webData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: data } : {};
}
