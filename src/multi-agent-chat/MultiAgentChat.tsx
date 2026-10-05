import { AgentCreator } from '../agent-creator';
import { ComposerPanel } from '../composer-panel';
import * as ContextMenu from '../context-menu';
import { Dialog } from '../dialog';
import * as Dropdown from '../dropdown-menu';
import { Portal } from '../portal';
import * as Select from '../select';
import { Surface } from '../surface';
import { AvatarFlightHost } from './AvatarFlightHost';
import { ComponentsContext } from './context';
import { MultiAgentChatBase } from './MultiAgentChatBase';
import type { MultiAgentChatProps } from './types';
const components = {
  Portal,
  Surface,
  Select,
  Dropdown,
  ContextMenu,
  Dialog,
  ComposerPanel,
  AgentCreator,
  FlightHost: AvatarFlightHost,
};
export function MultiAgentChat(props: MultiAgentChatProps) {
  return (
    <ComponentsContext.Provider value={components}>
      <MultiAgentChatBase {...props} />
    </ComponentsContext.Provider>
  );
}
