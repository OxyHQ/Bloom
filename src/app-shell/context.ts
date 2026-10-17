/**
 * What `AppShell` tells the page inside it about its navigation drawer, so a
 * page without a `title` — or with its own `header` — can still open it.
 */
import { createContext, useContext } from 'react';

export interface AppShellContextValue {
  /**
   * Whether the sidebar is a drawer right now (below `lg`, or below `sm` for
   * `variant: 'rail'`). `false` when it sits in flow or there is no sidebar —
   * a menu button has nothing to open then.
   */
  drawerAvailable: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);
AppShellContext.displayName = 'BloomAppShellContext';

export const AppShellProvider = AppShellContext.Provider;

/** The enclosing `AppShell`'s drawer. Throws outside one. */
export function useAppShell(): AppShellContextValue {
  const value = useContext(AppShellContext);
  if (!value) throw new Error('useAppShell must be used inside an <AppShell>.');
  return value;
}

/** The enclosing `AppShell`'s drawer, or `null` outside one. */
export function useOptionalAppShell(): AppShellContextValue | null {
  return useContext(AppShellContext);
}

/** What a panel knows about itself — see `useAppShellPanel`. */
export interface AppShellPanelValue {
  /** The panel's `id`, when it was given one. */
  id?: string;
  /**
   * Drawn ALONE: the only panel of its group, or the one a collapsed group
   * shows. A panel offers its own way to the others (a Map / List toggle)
   * exactly then, and never beside them.
   */
  alone: boolean;
  /** Rounded with the gutter around it, or full-bleed. */
  framed: boolean;
}

const OUTSIDE_PANEL: AppShellPanelValue = { alone: false, framed: false };

export const AppShellPanelContext = createContext<AppShellPanelValue | null>(null);
AppShellPanelContext.displayName = 'BloomAppShellPanelContext';

/** The enclosing `AppShellPanel`: its id, whether it is drawn alone and framed. */
export function useAppShellPanel(): AppShellPanelValue {
  return useContext(AppShellPanelContext) ?? OUTSIDE_PANEL;
}
