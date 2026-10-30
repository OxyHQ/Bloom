import { createContext, useContext } from 'react';

/**
 * Whether a region above already holds the window's top leading corner: it
 * draws the window's controls and keeps their room (`AppShell`,
 * `SettingsLayout`, a `Screen` that is the window's content). A shell or
 * layout inside it is not at the corner, so it keeps no room and draws no
 * controls — the corner has one owner.
 */
const WindowCornerContext = createContext(false);

export const WindowCornerProvider = WindowCornerContext.Provider;

export function useWindowCornerTaken(): boolean {
  return useContext(WindowCornerContext);
}

/**
 * The window's chrome, handed down to the region that is it: a box whose top
 * edge is the window's top edge, so its header row is the window's title area
 * (the drag region), and which keeps `leading` px from its own leading edge
 * clear for the window's controls (0 when they are not over it).
 */
export interface WindowChrome {
  readonly leading: number;
}

/**
 * Who holds the window's chrome. The corner's owner hands it to its content
 * when nothing of its own is there (an `AppShell` with no sidebar, top bar or
 * header gives it to its panel layout, which gives it to the panels along the
 * window's top edge); the first `Screen` under it takes it for its header and
 * hands `null` to its content. `null` everywhere else.
 */
const WindowChromeContext = createContext<WindowChrome | null>(null);

export const WindowChromeProvider = WindowChromeContext.Provider;

export function useWindowChrome(): WindowChrome | null {
  return useContext(WindowChromeContext);
}
