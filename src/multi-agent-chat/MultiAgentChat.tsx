import { SettingsModal } from '../settings-modal/modal';
import { Screen, ScreenScrollView } from '../screen/index';
import { ScrollSurface } from '../layout/ScrollSurface';
import { AgentCreator } from '../agent-creator';
import { AppShell } from '../app-shell';
import { ComposerPanel } from '../composer-panel';
import { ConversationSidebar } from '../conversation-sidebar';
import { Dialog } from '../dialog';
import * as Dropdown from '../dropdown-menu';
import { Portal } from '../portal';
import * as Select from '../select';
import { Surface } from '../surface';
import { ComponentsContext } from './context';
import { MultiAgentChatBase } from './MultiAgentChatBase';
import type { MultiAgentChatProps } from './types';
const components = {
  SettingsModal,
  Screen,
  ScreenScrollView,
  ScrollSurface,
  AppShell,
  Portal,
  Surface,
  Select,
  Dropdown,
  ConversationSidebar,
  Dialog,
  ComposerPanel,
  AgentCreator,
};
export function MultiAgentChat(props: MultiAgentChatProps) {
  return (
    <ComponentsContext.Provider value={components}>
      <MultiAgentChatBase {...props} />
    </ComponentsContext.Provider>
  );
}
