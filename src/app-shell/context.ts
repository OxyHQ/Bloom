/**
 * What `AppShell` tells the page inside it about its navigation drawer, so a
 * page without a `title` — or with its own `header` — can still open it.
 */
import { createContext, useContext, type RefObject } from 'react';
import { ScreenHostContext, ScreenViewportContext } from '../screen/context';
import type { ColorClaim } from './use-color-claims';

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
  /** The current host surface. Dialog owns focus, dismissal and its own chrome. */
  presentation?: 'inline' | 'floating';
  /** Root modular panels retain hidden content; use this to suspend background work. */
  visible?: boolean;
  active?: boolean;
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

export const AppShellPanelContext = createContext<
  | (AppShellPanelValue & {
      /** Internal: this inline host publishes visibility CSS variables. */ cssVisibility?: boolean;
    })
  | null
>(null);
AppShellPanelContext.displayName = 'BloomAppShellPanelContext';

/** The enclosing `AppShellPanel`: its id, whether it is drawn alone and framed. */
export function useAppShellPanel(): AppShellPanelValue {
  return useContext(AppShellPanelContext) ?? OUTSIDE_PANEL;
}

/** The actual panel viewport, not a second scrolling wrapper. */
export const PanelScrollContainerContext = createContext<RefObject<unknown> | null>(null);
/** Null means document/outside; web current is an HTMLElement, native a ScrollArea handle. */
export function usePanelScrollContainer<T = unknown>(): RefObject<T | null> | null {
  const screen = useContext(ScreenViewportContext);
  const legacy = useContext(PanelScrollContainerContext);
  const host = useContext(ScreenHostContext);
  return (
    screen
      ? screen.scrollRef
      : (legacy ?? (host.kind === 'document' ? null : (host.scrollRef ?? null)))
  ) as RefObject<T | null> | null;
}

/**
 * Where an active screen's colour preset is forwarded so the whole shell — the
 * sidebar, the bottom bar and every sibling panel — adopts it. Absent when each
 * panel is its own surface (deck): there a preset themes its own column only.
 */
export const ShellColorClaimContext = createContext<ColorClaim | null>(null);
ShellColorClaimContext.displayName = 'BloomShellColorClaimContext';
