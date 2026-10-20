import type { ScreenComponents } from '../screen/types';
import { createContext, useContext, type ComponentType } from 'react';
import type { AgentCreatorProps } from '../agent-creator/types';
import type { ComposerPanelProps } from '../composer-panel/types';
import type { DialogProps } from '../dialog/types';
export interface MultiAgentChatComponents extends ScreenComponents {
  SettingsModal: ComponentType<import('../settings-modal/types').SettingsModalProps>;
  ScrollSurface: ComponentType<import('../layout/types').ScrollSurfaceProps>;
  AppShell: ComponentType<import('../app-shell/types').AppShellProps>;
  Portal: ComponentType<{ children: React.ReactElement }>;
  Surface: ComponentType<import('../surface/types').SurfaceProps>;
  Select: typeof import('../select');
  Dropdown: typeof import('../dropdown-menu');
  ConversationSidebar: ComponentType<import('../conversation-sidebar').ConversationSidebarProps>;
  Dialog: ComponentType<DialogProps>;
  ComposerPanel: ComponentType<ComposerPanelProps>;
  AgentCreator: ComponentType<AgentCreatorProps>;
}
export const ComponentsContext = createContext<MultiAgentChatComponents | null>(null);
export function useChatComponents() {
  const components = useContext(ComponentsContext);
  if (!components) throw new Error('MultiAgentChat component bindings missing');
  return components;
}
