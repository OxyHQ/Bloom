import { AvatarFlightHost } from './AvatarFlightHost';
import React from 'react';
import { Dialog } from '../dialog';
import { ComposerPanel } from '../composer-panel';
import { AgentCreator } from '../agent-creator';
import { ComponentsContext } from './context';
import { MultiAgentChatBase } from './MultiAgentChatBase';
import type { MultiAgentChatProps } from './types';
const components = { Dialog, ComposerPanel, AgentCreator, FlightHost: AvatarFlightHost };
export function MultiAgentChat(props: MultiAgentChatProps) {
  return <ComponentsContext.Provider value={components}><MultiAgentChatBase {...props} /></ComponentsContext.Provider>;
}
