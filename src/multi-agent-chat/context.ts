import { createContext, useContext, type ComponentType } from 'react';
import type { DialogProps } from '../dialog/types';
import type { ComposerPanelProps } from '../composer-panel/types';
import type { AgentCreatorProps } from '../agent-creator/types';
export interface MultiAgentChatComponents {
  FlightHost: ComponentType<React.PropsWithChildren>;
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
