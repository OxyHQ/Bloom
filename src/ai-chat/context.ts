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

/** What `AiChatShell` hands the chat container's mobile header. */
export interface AiChatShellState {
  /** Below `xl`: the panel is a drawer and the mobile header shows. */
  compact: boolean;
  /** Below `lg`: the sidebar is a push drawer. */
  navCollapsed: boolean;
  hasNav: boolean;
  hasPanel: boolean;
  openNav: () => void;
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
