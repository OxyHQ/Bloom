import type { ReactElement, ReactNode } from 'react';
import { AgentCreator } from '@bloom/agent-creator';
import { useAvatarFlights } from '@bloom/avatar-flight';
import { AppShell } from '@bloom/app-shell';
import { ComposerPanel } from '@bloom/composer-panel';
import { ConversationSidebar } from '@bloom/conversation-sidebar';
import { Dialog } from '@bloom/dialog';
import * as Dropdown from '@bloom/dropdown-menu';
import { ScrollSurface } from '@bloom/layout/ScrollSurface';
import { ComponentsContext } from '@bloom/multi-agent-chat/context';
import { INITIAL_AGENTS, INITIAL_WORKSPACE, type Workspace } from '@bloom/multi-agent-chat/data';
import { Marketplace } from '@bloom/multi-agent-chat/Marketplace';
import { marketplaceAgentId } from '@bloom/multi-agent-chat/marketplace-data';
import { MultiAgentChat } from '@bloom/multi-agent-chat/MultiAgentChat';
import { SelectedAgentPreview } from '@bloom/multi-agent-chat/SelectedAgentPreview';
import { SupportCopy } from '@bloom/multi-agent-chat/SupportCopy';
import { Portal, PortalOutlet, PortalProvider } from '@bloom/portal';
import { Screen, ScreenScrollView } from '@bloom/screen/index';
import { SettingsSelect } from '@bloom/settings-modal/SettingsSelect';
import { SettingsModal } from '@bloom/settings-modal/modal';
import { Surface } from '@bloom/surface';
import type { SettingsModalProps } from '@bloom/settings-modal/types';
import type { Cases } from '../support/cases';

const noop = () => {};
const components = {
  SettingsModal,
  Screen,
  ScreenScrollView,
  ScrollSurface,
  AppShell,
  Portal,
  Surface,
  SettingsSelect,
  Dropdown,
  ConversationSidebar,
  Dialog,
  ComposerPanel,
  AgentCreator,
};

/** The settings modal's own frame is another family's: draw the marketplace page alone. */
const pageOnly =
  (back: boolean) =>
  ({ pages, onClose }: SettingsModalProps) => {
    const page = pages?.marketplace?.content;
    return (
      <>
        {typeof page === 'function'
          ? page({
              backLabel: 'Back',
              closeLabel: 'Close',
              onBack: back ? onClose : undefined,
              onClose,
            })
          : page}
      </>
    );
  };
const marketComponents = { ...components, SettingsModal: pageOnly(false) };
const backComponents = { ...components, SettingsModal: pageOnly(true) };

/** A portaled surface (the settings modal, a dialog, the notice) draws into the app's outlet. */
function Portaled({ children }: { children: ReactNode }) {
  return (
    <PortalProvider>
      {children}
      <PortalOutlet />
    </PortalProvider>
  );
}

function Preview({ count, caption }: { count: number; caption?: boolean }) {
  const flights = useAvatarFlights();
  return (
    <SelectedAgentPreview
      agents={INITIAL_AGENTS.slice(0, count)}
      flights={flights}
      anchor="case"
      caption={caption}
    />
  );
}

function Market({
  item,
  added,
  back,
}: {
  item?: string;
  added?: boolean;
  back?: boolean;
}): ReactElement {
  return (
    <Portaled>
      <ComponentsContext.Provider value={back ? backComponents : marketComponents}>
        <Marketplace
          agents={
            added && item
              ? [...INITIAL_AGENTS, { ...INITIAL_AGENTS[0]!, id: marketplaceAgentId(item) }]
              : INITIAL_AGENTS
          }
          installedPlugins={added && item ? [item] : []}
          onTogglePlugin={noop}
          onAddBot={noop}
          onChat={noop}
          onClose={noop}
          onCopy={noop}
          initialItem={item}
        />
      </ComponentsContext.Provider>
    </Portaled>
  );
}

const empty: Workspace = { agents: INITIAL_AGENTS, chats: [], activeId: '' };
const fresh: Workspace = {
  ...INITIAL_WORKSPACE,
  chats: INITIAL_WORKSPACE.chats.map((chat) => ({ ...chat, messages: [] })),
};

export const CASES: Cases = {
  'SupportCopy with term': () => <SupportCopy text="Use + to create a bot" term="+" />,
  'SupportCopy without term': () => <SupportCopy text="Send with Enter" term="+" />,
  'SelectedAgentPreview empty': () => <Preview count={0} />,
  'SelectedAgentPreview one': () => <Preview count={1} />,
  'SelectedAgentPreview trio caption': () => <Preview count={3} caption />,
  'SelectedAgentPreview ring': () => <Preview count={5} />,
  'Marketplace discover': () => <Market />,
  'Marketplace discover with back': () => <Market back />,
  'Marketplace plugin detail': () => <Market item="notion" />,
  'Marketplace plugin detail added': () => <Market item="notion" added />,
  'Marketplace bot detail': () => <Market item="pitch-partner" />,
  'Marketplace bot detail added': () => <Market item="pitch-partner" added />,
  'MultiAgentChat default': () => (
    <Portaled>
      <MultiAgentChat storageKey={null} style={{ margin: 1 }} testID="chat" />
    </Portaled>
  ),
  'MultiAgentChat no chats': () => (
    <Portaled>
      <MultiAgentChat storageKey={null} initialWorkspace={empty} defaultEditorId={null} />
    </Portaled>
  ),
  'MultiAgentChat empty chat': () => (
    <Portaled>
      <MultiAgentChat storageKey={null} initialWorkspace={fresh} defaultEditorId={null} />
    </Portaled>
  ),
};
