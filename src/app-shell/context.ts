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

/** Logical pane visibility, including while its exit animation is retained. */
export const AppShellPaneActiveContext = createContext(true);
/** Suspend pane-local global shortcuts/effects as soon as a pane is hidden. */
export function useAppShellPaneActive(): boolean {
  return useContext(AppShellPaneActiveContext);
}

/** Whether `AppShellSplitPanes` currently draws this pane alone. */
export const AppShellPaneAloneContext = createContext(false);
/**
 * True inside a split pane drawn ALONE — below `splitFrom`, or when it is the
 * only pane shown — and false beside another pane or outside split panes. A
 * pane shows its own way to the other one (a Map / List toggle) exactly then.
 */
export function useAppShellPaneAlone(): boolean {
  return useContext(AppShellPaneAloneContext);
}
