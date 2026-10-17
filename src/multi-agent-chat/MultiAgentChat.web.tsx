import { AvatarFlightHost } from './AvatarFlightHost.web';
import React from 'react';
import { Dialog } from '../dialog/index.web';
import { ComposerPanel } from '../composer-panel/index.web';
import { AgentCreator } from '../agent-creator/index.web';
import { ComponentsContext } from './context';
import { MultiAgentChatBase } from './MultiAgentChatBase';
import type { MultiAgentChatProps } from './types';
const components = { Dialog, ComposerPanel, AgentCreator, FlightHost: AvatarFlightHost };
export function MultiAgentChat(props: MultiAgentChatProps) {
  return <ComponentsContext.Provider value={components}><MultiAgentChatBase {...props} /></ComponentsContext.Provider>;
}
