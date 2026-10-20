import type { ScreenComponents } from '../screen/types';
import { createContext, useContext, type ComponentType } from 'react';

import type { ComposerLoaderProps } from '../composer-loader';
import type { AppShellProps } from '../app-shell/types';
import type { ComposerPillProps } from '../composer-panel/types';
import type {
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
} from '../dropdown-menu';

/**
 * The web-forked families agent-chat renders, injected by each platform
 * binding (`AgentChat.tsx` / `AgentChat.web.tsx`).
 *
 * `app-shell`, `composer-loader`, `composer-panel` and `dropdown-menu` ship `.web` forks, and a relative
 * import from a neutral file resolves to the NATIVE file under any bundler that
 * reads `package.json#exports` rather than Metro's platform extensions. So the
 * shared implementation never names them: each binding names its platform's
 * files and hands them down through this context.
 */
export interface AgentChatPlatform extends ScreenComponents {
  AppShell: ComponentType<AppShellProps>;
  ComposerLoader: ComponentType<ComposerLoaderProps>;
  ComposerPill: ComponentType<ComposerPillProps>;
  DropdownMenu: ComponentType<DropdownMenuProps>;
  DropdownMenuTrigger: ComponentType<DropdownMenuTriggerProps>;
  DropdownMenuContent: ComponentType<DropdownMenuContentProps>;
  DropdownMenuItem: ComponentType<DropdownMenuItemProps>;
  DropdownMenuSeparator: ComponentType<Record<string, never>>;
}

export const AgentChatPlatformContext = createContext<AgentChatPlatform | null>(null);

export function useAgentChatPlatform(): AgentChatPlatform {
  const platform = useContext(AgentChatPlatformContext);
  if (!platform) {
    throw new Error(
      'agent-chat: a part rendered outside its binding — import AgentChat, AgentChatActions, AgentChatHistory and AgentChatComposer from @oxy.so/bloom/agent-chat.',
    );
  }
  return platform;
}
