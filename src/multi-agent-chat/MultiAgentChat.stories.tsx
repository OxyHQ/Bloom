import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { RiBankLine } from '../icons/remix/RiBankLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiFolder6Line } from '../icons/remix/RiFolder6Line';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiLogoutBoxRLine } from '../icons/remix/RiLogoutBoxRLine';
import { RiMessage2Line } from '../icons/remix/RiMessage2Line';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { RiSchoolLine } from '../icons/remix/RiSchoolLine';
import { RiShieldUserLine } from '../icons/remix/RiShieldUserLine';
import type { SidebarTeam } from '../sidebar/types';
import { MultiAgentChat } from './MultiAgentChat.web';

/** The host's team card and menu: app data, passed in as `team`. */
const TEAM: SidebarTeam = {
  name: 'Bloom team',
  email: 'team@oxy.so',
  avatar: { initials: 'B', color: 'blue' },
  footer: { label: 'Bloom' },
  groups: [
    {
      id: 'workspace',
      items: [
        { key: 'profile', label: 'View team profile', icon: RiBankLine },
        { key: 'folders', label: 'Folders', icon: RiFolder6Line },
        { key: 'messages', label: 'Messages', icon: RiMessage2Line, badge: '94' },
        { key: 'people', label: 'People', icon: RiGroupLine },
      ],
    },
    {
      id: 'company',
      label: 'Company',
      items: [
        { key: 'billing', label: 'Billing', icon: RiBankCardLine },
        { key: 'details', label: 'Company Details', icon: RiSchoolLine },
        { key: 'integrations', label: 'Integrations', icon: RiBox3Line },
      ],
    },
    {
      id: 'personal',
      label: 'Personal',
      items: [
        { key: 'notifications', label: 'Notifications', icon: RiNotification3Line },
        { key: 'account', label: 'Account Details', icon: RiShieldUserLine },
        { key: 'sign-out', label: 'Sign out', icon: RiLogoutBoxRLine },
      ],
    },
  ],
};

const meta: Meta<typeof MultiAgentChat> = {
  id: 'agents-multi-agent-chat',
  title: 'Patterns/Agents/Multi-agent Chat',
  component: MultiAgentChat,
  parameters: { layout: 'fullscreen' },
  args: { storageKey: null, team: TEAM, style: { flex: 1, width: '100%' } },
};
export default meta;
export const Default: StoryObj<typeof MultiAgentChat> = {};
