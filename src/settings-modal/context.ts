import { createContext, useContext, useMemo } from 'react';

import { useTheme } from '../theme/use-theme';
import { resolveSettingsPalette, type SettingsPalette } from './palette';

/**
 * How much room the modal has, from the window width:
 *   `compact`  < 640 — full screen, list → page navigation, rows stack
 *   `medium`   < 900 — side by side, narrower rail and insets
 *   `regular`         — the 871×614 panel
 */
export type SettingsModalLayout = 'compact' | 'medium' | 'regular';

export const SETTINGS_COMPACT_MAX = 640;
export const SETTINGS_MEDIUM_MAX = 900;

export function settingsLayoutFor(width: number): SettingsModalLayout {
  if (width < SETTINGS_COMPACT_MAX) return 'compact';
  if (width < SETTINGS_MEDIUM_MAX) return 'medium';
  return 'regular';
}

export interface SettingsModalContextValue {
  /** Show the "Saved" toast for ~2s. */
  showSaved: () => void;
  /** Request the modal to close. */
  close: () => void;
  /** The modal's current layout, so pages and rows can adapt. */
  layout: SettingsModalLayout;
}

const NOOP = () => {};

export const SettingsModalContext = createContext<SettingsModalContextValue>({
  showSaved: NOOP,
  close: NOOP,
  layout: 'regular',
});
SettingsModalContext.displayName = 'BloomSettingsModalContext';

/**
 * The saved-toast trigger of the enclosing `SettingsModal` — `onSaved`,
 * which its Profile inputs call when a changed value commits. A no-op
 * outside a modal, so a page renders anywhere.
 */
export function useSettingsSavedToast(): () => void {
  return useContext(SettingsModalContext).showSaved;
}

/** The enclosing modal's layout (`regular` outside a modal). */
export function useSettingsLayout(): SettingsModalLayout {
  return useContext(SettingsModalContext).layout;
}

/** Whether a row is the last in its `SettingsCard` — `last:border-b-0`. */
export const SettingsRowPositionContext = createContext<{ last: boolean }>({ last: true });

export function useSettingsPalette(): SettingsPalette {
  const theme = useTheme();
  return useMemo(() => resolveSettingsPalette(theme), [theme]);
}
