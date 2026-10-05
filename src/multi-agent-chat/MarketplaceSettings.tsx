import { useEffect } from 'react';
import { useDialogControl } from '../dialog/context';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { RiBookOpenLine } from '../icons/remix/RiBookOpenLine';
import { RiCodeBlock } from '../icons/remix/RiCodeBlock';
import { RiDatabase2Line } from '../icons/remix/RiDatabase2Line';
import { RiGitMergeLine } from '../icons/remix/RiGitMergeLine';
import { RiOrganizationChart } from '../icons/remix/RiOrganizationChart';
import { RiPaletteLine } from '../icons/remix/RiPaletteLine';
import { RiPlugLine } from '../icons/remix/RiPlugLine';
import { RiSchoolLine } from '../icons/remix/RiSchoolLine';
import { RiSettings6Line } from '../icons/remix/RiSettings6Line';
import { RiSettingsLine } from '../icons/remix/RiSettingsLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { RiToolsFill } from '../icons/remix/RiToolsFill';
import { useMessages } from '../locale/messages';
import type { SettingsModalPage, SettingsNavGroup } from '../settings-modal';
import { SettingsModal } from '../settings-modal';
import {
  MULTI_AGENT_CHAT_MESSAGES,
  type MultiAgentChatMessages,
} from './messages';
import { useWorkspaceSettingsPages } from './WorkspaceSettingsPages';
const groupsFor = (messages: MultiAgentChatMessages): SettingsNavGroup[] => [
  {
    label: messages.settings,
    items: [
      {
        key: 'general',
        label: messages.general,
        icon: RiSettings6Line,
        page: 'general',
      },
      {
        key: 'profile',
        label: messages.profile,
        icon: RiSchoolLine,
        page: 'profile',
      },
      {
        key: 'marketplace',
        label: messages.marketplace,
        icon: RiStore2Line,
        page: 'marketplace',
      },
      { key: 'appearance', label: messages.appearance, icon: RiPaletteLine },
      { key: 'billing', label: messages.billing, icon: RiBankCardLine },
      {
        key: 'rules',
        label: messages.rulesAndWorkflows,
        icon: RiOrganizationChart,
      },
      { key: 'tools', label: messages.tools, icon: RiToolsFill, page: 'tools' },
      {
        key: 'storage',
        label: messages.storage,
        icon: RiDatabase2Line,
        page: 'storage',
      },
    ],
  },
  {
    label: messages.desktopApp,
    items: [
      { key: 'desktop-general', label: messages.general, icon: RiSettingsLine },
      { key: 'plugins', label: messages.plugins, icon: RiPlugLine },
      { key: 'developer', label: messages.developer, icon: RiCodeBlock },
    ],
  },
  {
    label: messages.customize,
    items: [
      { key: 'skills', label: messages.skills, icon: RiBookOpenLine },
      { key: 'git', label: messages.git, icon: RiGitMergeLine },
    ],
  },
];
export function MarketplaceSettings({
  marketplace,
  defaultPage,
  onClose,
}: {
  marketplace: SettingsModalPage['content'];
  defaultPage: 'general' | 'marketplace';
  onClose: () => void;
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const control = useDialogControl(),
    pages = useWorkspaceSettingsPages();
  useEffect(() => {
    control.open();
  }, [control]);
  return (
    <SettingsModal
      control={control}
      onClose={onClose}
      defaultPage={defaultPage}
      initialView="page"
      groups={groupsFor(messages)}
      pages={{
        ...pages,
        marketplace: {
          title: messages.marketplace,
          fullBleed: true,
          content: marketplace,
        },
      }}
    />
  );
}
