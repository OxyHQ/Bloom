import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

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
export interface AiChatPlatform {
  Tooltip: ComponentType<{
    children: ReactNode;
    position?: 'top' | 'bottom';
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
  }>;
  TooltipTrigger: ComponentType<{ children: ReactNode }>;
  TooltipTextBubble: ComponentType<{ children: ReactNode; size?: TooltipSize }>;
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
  /** Below `xl`: the panel is a drawer and the mobile header shows. */
  compact: boolean;
  /** Below `lg`: the sidebar is a push drawer. */
  navCollapsed: boolean;
  hasNav: boolean;
  hasPanel: boolean;
  /**
   * Whether the nav is on screen at all: `true` from `lg` up (in flow) and,
   * below it, only while the drawer is open.
   *
   * A closed drawer stays MOUNTED — it is translated offscreen, not removed —
   * so a nav rendered into `mobileSidebar` is still focusable and still read by
   * a screen reader unless its own tree says otherwise. This is the signal to
   * hide it by: skip the tab order and mark the subtree hidden while it is
   * `false`.
   */
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

/**
 * Internal: what a document-scrolled shell tells the card inside it — the
 * colour of the gutter around the card, which the card's pinned frame paints
 * over whatever of the conversation scrolls into it. `null` when the page is
 * not document-scrolled, or when the shell paints no surface of its own and
 * there is no known colour to mask with.
 */
export const AiChatDocumentGutterContext = createContext<string | null>(null);

export function useAiChatShell(): AiChatShellState | null {
  return useContext(AiChatShellContext);
}

/**
 * The heights an `AiChatContainer floatingChrome` measures for the chrome it
 * floats over its `children`: the header block at the top and the footer
 * (`AgentThinking` + composer, with its fade strip) at the bottom, px.
 */
export interface AiChatChromeInsets {
  top: number;
  bottom: number;
}

/** Where the thread is, reported to the container so each edge knows when to fade. */
export interface AiChatScrollMetrics {
  offset: number;
  viewport: number;
  content: number;
}

/**
 * What a floating-chrome container hands its `children`. Internal: the thread
 * reads `insets` and reports its scroll; hosts read only the insets, through
 * `useAiChatChromeInsets()`.
 */
export interface AiChatFloatingChrome {
  insets: AiChatChromeInsets;
  reportScroll: (metrics: AiChatScrollMetrics) => void;
}

export const AiChatFloatingChromeContext = createContext<AiChatFloatingChrome | null>(null);

/**
 * Inside `AiChatContainer floatingChrome`: how much of the top and bottom of the
 * card the floating header and composer cover, so a custom child (an empty
 * state, a scroller of its own) can keep its resting content clear of them.
 * `null` anywhere else — outside a container, or in one that stacks its chrome.
 */
export function useAiChatChromeInsets(): AiChatChromeInsets | null {
  return useContext(AiChatFloatingChromeContext)?.insets ?? null;
}
