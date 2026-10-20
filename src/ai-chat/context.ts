import type { ScreenComponents } from '../screen/types';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

import { useScreenContext } from '../screen/context';
import type { ContentPanelProps } from '../content-panel/types';
import type { TooltipSize } from '../tooltip/constants';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * The web-forked families `ai-chat` renders, injected by each platform binding
 * (`AiChat.tsx` / `AiChat.web.tsx`).
 *
 * `tooltip` ships a `.web` fork, and a relative import from a neutral file
 * resolves to the NATIVE file under any bundler that reads `package.json#exports`
 * rather than Metro's platform extensions. So the shared implementation never
 * names it: each binding names its platform's files and hands them down.
 */
export interface AiChatPlatform extends ScreenComponents {
  AppShell: ComponentType<import('../app-shell/types').AppShellProps>;
  Tooltip: ComponentType<{
    children: ReactNode;
    position?: 'top' | 'bottom';
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
  }>;
  TooltipTrigger: ComponentType<{ children: ReactNode }>;
  TooltipTextBubble: ComponentType<{ children: ReactNode; size?: TooltipSize }>;
  /**
   * The framed document surface: a document-scrolled chat's card is one, so
   * its gutter mask, corners and edge are the panel's own.
   */
  ContentPanel: ComponentType<ContentPanelProps>;
}

export const AiChatPlatformContext = createContext<AiChatPlatform | null>(null);

export function useAiChatPlatform(): AiChatPlatform {
  const platform = useContext(AiChatPlatformContext);
  if (!platform) {
    throw new Error(
      'ai-chat: a part rendered outside its binding — import the ai-chat components from @oxy.so/bloom/ai-chat.',
    );
  }
  return platform;
}

/**
 * What `AiChatShell` publishes: read it with `useAiChatShell()`. The chat
 * container's mobile header runs on it, and so does anything a host needs to
 * know about the frame around its own nav.
 */
export interface AiChatShellState {
  /** The context panel is currently hidden by the shared responsive layout. */
  compact: boolean;
  /** The navigation panel is currently hidden by the shared responsive layout. */
  navCollapsed: boolean;
  hasNav: boolean;
  hasPanel: boolean;
  /** Actual navigation visibility, read from AppShell's retained panel. */
  navPresented: boolean;
  /** The in-flow sidebar is narrowed to its rail width (`sidebarCollapsed`). */
  sidebarCollapsed: boolean;
  /**
   * The page scrolls the DOCUMENT (`scroll="document"`, web). The container
   * pins its chrome to the screen and the thread follows the window instead of
   * a `ScrollView` of its own.
   */
  documentScroll: boolean;
  openNav: () => void;
  closeNav: () => void;
  openPanel: () => void;
  panelLabel: string;
  panelIcon: AiChatShellIcon;
  labels: {
    openNavigation: string;
    openPanel: (panel: string) => string;
  };
}

/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type AiChatShellIcon = BloomIconComponent;

export const AiChatShellContext = createContext<AiChatShellState | null>(null);

export function useAiChatShell(): AiChatShellState | null {
  return useContext(AiChatShellContext);
}

/** The enclosing Screen's measured chrome footprint, in pixels. */
export interface AiChatChromeInsets {
  top: number;
  bottom: number;
}

/** Compatibility reader for Screen's measured chrome. Prefer useScreen in new routes. */
export function useAiChatChromeInsets(): AiChatChromeInsets | null {
  const screen = useScreenContext();
  return screen ? { top: screen.topInset, bottom: screen.bottomInset } : null;
}
