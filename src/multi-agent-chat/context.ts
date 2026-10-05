import { createContext, useContext, type ComponentType } from 'react';
import type { AgentCreatorProps } from '../agent-creator/types';
import type { ComposerPanelProps } from '../composer-panel/types';
import type { DialogProps } from '../dialog/types';
export interface MultiAgentChatComponents {
  Portal: ComponentType<{ children: React.ReactElement }>;
  Surface: ComponentType<import('../surface/types').SurfaceProps>;
  Select: typeof import('../select');
  Dropdown: typeof import('../dropdown-menu');
  ContextMenu: typeof import('../context-menu');
  FlightHost: ComponentType<React.PropsWithChildren>;
  Dialog: ComponentType<DialogProps>;
  ComposerPanel: ComponentType<ComposerPanelProps>;
  AgentCreator: ComponentType<AgentCreatorProps>;
}
export const ComponentsContext = createContext<MultiAgentChatComponents | null>(
  null,
);
export function useChatComponents() {
  const components = useContext(ComponentsContext);
  if (!components) throw new Error('MultiAgentChat component bindings missing');
  return components;
}
