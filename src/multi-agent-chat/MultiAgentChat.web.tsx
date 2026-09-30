import { AgentCreator } from '../agent-creator/index.web';
import { ComposerPanel } from '../composer-panel/index.web';
import * as ContextMenu from '../context-menu/index.web';
import { Dialog } from '../dialog/index.web';
import * as Dropdown from '../dropdown-menu/index.web';
import { Portal } from '../portal/index.web';
import * as Select from '../select/index.web';
import { Surface } from '../surface/index.web';
import { AvatarFlightHost } from './AvatarFlightHost.web';
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
