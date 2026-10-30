import { createContext, useContext } from 'react';

/**
 * Whether a region above already holds the window's top leading corner: it
 * draws the window's controls and keeps their room (`AppShell`,
 * `SettingsLayout`). A shell or layout inside it is not at the corner, so it
 * keeps no room and draws no controls — the corner has one owner.
 */
const WindowCornerContext = createContext(false);

export const WindowCornerProvider = WindowCornerContext.Provider;

export function useWindowCornerTaken(): boolean {
  return useContext(WindowCornerContext);
}
