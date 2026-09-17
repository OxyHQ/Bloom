import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { useTheme } from '../theme/use-theme';
import {
  RiSearchLine,
  RiComputerLine,
  RiAddFill,
  RiAsterisk,
  RiBankCardLine,
  RiBankLine,
  RiBox3Line,
  RiCalendarLine,
  RiChatAiLine,
  RiCustomerServiceLine,
  RiFolder6Line,
  RiGroupLine,
  RiGuideLine,
  RiHeartFill,
  RiHeartLine,
  RiHome5Fill,
  RiHomeFill,
  RiHomeLine,
  RiImageAiLine,
  RiKanbanView2,
  RiLogoutBoxRLine,
  RiMegaphoneLine,
  RiMessage2Line,
  RiNotification3Fill,
  RiNotification3Line,
  RiRobot2Fill,
  RiRobot2Line,
  RiSchoolLine,
  RiSettings3Fill,
  RiSettings3Line,
  RiSettings4Line,
  RiShieldUserLine,
  RiUserSmileLine,
} from '../icons/remix';
import { Sidebar, SidebarFolder, SidebarItem, SidebarModeSwitcher, SidebarPlanCard, SidebarRailItem } from './index';
import type { SidebarAccount, SidebarLogo, SidebarMode, SidebarNavItem, SidebarPlan, SidebarTeam, SidebarTree } from './types';

const meta: Meta<typeof Sidebar> = {
  title: 'Blocks/Sidebar',
  component: Sidebar,
  // The demo data is exported for the AppShell stories; it is not a story.
  excludeStories: /^DEMO_/,
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

/** Demo navigation items. */
export const DEMO_NAV: SidebarNavItem[] = [
  { key: 'home', label: 'Home', icon: RiHomeLine, href: '#home', badge: 152 },
  { key: 'project-board', label: 'Project board', icon: RiKanbanView2, href: '#project-board' },
  { key: 'marketing', label: 'Marketing', icon: RiMegaphoneLine, href: '#marketing' },
  { key: 'calendar', label: 'Calendar', icon: RiCalendarLine, href: '#calendar' },
  { key: 'finance', label: 'Finance', icon: RiBankLine, href: '#finance' },
  { key: 'medical', label: 'Medical Report', icon: RiAsterisk, href: '#medical' },
  { key: 'ai-chat', label: 'AI Chat', icon: RiChatAiLine, href: '#ai-chat' },
  { key: 'ai-image', label: 'AI Image Generation', icon: RiImageAiLine, href: '#ai-image' },
  { key: 'profile', label: 'Profile', icon: RiUserSmileLine, href: '#profile' },
];

export const DEMO_SECONDARY: SidebarNavItem[] = [
  { key: 'support', label: 'Support', icon: RiCustomerServiceLine },
  { key: 'settings', label: 'Settings', icon: RiSettings4Line, onPress: () => {} },
];

/** Demo team menu groups. */
export const DEMO_TEAM: SidebarTeam = {
  name: 'Design team',
  email: 'team@example.com',
  avatar: { initials: 'B', color: 'blue' },
  groups: [
    {
      id: 'workspace',
      items: [
        { key: 'profile', icon: RiBankLine, label: 'View team profile' },
        { key: 'folders', icon: RiFolder6Line, label: 'Folders' },
        { key: 'messages', icon: RiMessage2Line, label: 'Messages', badge: '94' },
        { key: 'people', icon: RiGroupLine, label: 'People' },
      ],
    },
    {
      id: 'company',
      label: 'Company',
      items: [
        { key: 'billing', icon: RiBankCardLine, label: 'Billing' },
        { key: 'company', icon: RiSchoolLine, label: 'Company Details' },
        { key: 'integrations', icon: RiBox3Line, label: 'Integrations' },
      ],
    },
    {
      id: 'personal',
      label: 'Personal',
      items: [
        { key: 'notifications', icon: RiNotification3Line, label: 'Notifications' },
        { key: 'account', icon: RiShieldUserLine, label: 'Account Details' },
        { key: 'sign-out', icon: RiLogoutBoxRLine, label: 'Sign out' },
      ],
    },
  ],
  footer: { label: 'Bloom', version: 'v1.0.1' },
};

/** Demo account menu users. */
export const DEMO_ACCOUNT: SidebarAccount = {
  name: 'Maya Collins',
  avatar: { initials: 'M', color: 'neutral' },
  users: [
    { id: 'm', name: 'Maya Collins', avatar: { initials: 'M', color: 'neutral' } },
    { id: 's', name: 'Sam Rivera', avatar: { initials: 'S', color: 'lime' } },
    { id: 'l', name: 'Lena Park', avatar: { initials: 'L', color: 'pink' } },
  ],
  onAddUser: () => {},
  onManage: () => {},
};

function Frame({ children }: { children: React.ReactNode }) {
  return <View style={{ height: 820, flexDirection: 'row', gap: 24 }}>{children}</View>;
}

/** The floating rail, interactive: collapse, search (⌘L), both menus. */
export const Default: Story = {
  render: function Render() {
    const [selected, setSelected] = useState('home');
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected={selected}
          onNavigate={(item) => setSelected(item.key)}
          account={DEMO_ACCOUNT}
          team={DEMO_TEAM}
        />
      </Frame>
    );
  },
};

/** Search / Computer: the modes a sidebar switches between. */
export const DEMO_MODES: SidebarMode[] = [
  { key: 'search', label: 'Search', icon: RiSearchLine, shortcut: '⌥⌃1' },
  { key: 'computer', label: 'Computer', icon: RiComputerLine, shortcut: '⌥⌃2' },
];

/** A mode switcher under the header (`modes`), expanded and collapsed. */
export const WithModes: Story = {
  render: function Render() {
    const [mode, setMode] = useState('search');
    const [selected, setSelected] = useState('home');
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          modes={DEMO_MODES}
          mode={mode}
          onModeChange={setMode}
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected={selected}
          onNavigate={(item) => setSelected(item.key)}
          account={DEMO_ACCOUNT}
          team={DEMO_TEAM}
        />
        <Sidebar
          collapsed
          modes={DEMO_MODES}
          mode={mode}
          onModeChange={setMode}
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected={selected}
          onNavigate={(item) => setSelected(item.key)}
          account={DEMO_ACCOUNT}
          team={DEMO_TEAM}
        />
      </Frame>
    );
  },
};

/** `SidebarModeSwitcher` on its own: two and three modes. */
export const ModeSwitcher: Story = {
  render: function Render() {
    const [two, setTwo] = useState('search');
    const [three, setThree] = useState('chat');
    return (
      <View testID="mode-switchers" style={{ width: 236, gap: 24, padding: 12 }}>
        <SidebarModeSwitcher testID="modes-two" modes={DEMO_MODES} value={two} onValueChange={setTwo} />
        <SidebarModeSwitcher
          testID="modes-three"
          modes={[
            { key: 'chat', label: 'Chat', icon: RiSearchLine },
            { key: 'agents', label: 'Agents', icon: RiComputerLine },
            { key: 'search', label: 'Search', icon: RiSearchLine },
          ]}
          value={three}
          onValueChange={setThree}
        />
      </View>
    );
  },
};

/** A demo mark: a 28px accent tile with a glyph. Pass your own SVG or image. */
function DemoMark() {
  const theme = useTheme();
  return (
    <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }}>
      <RiAsterisk width={18} height={18} fill="#ffffff" />
    </View>
  );
}

const DEMO_LOGO: SidebarLogo = { icon: <DemoMark />, wordmark: 'Oxy', href: '#home', onPress: () => {} };

/**
 * `logo`: a mark and a wordmark leading the header. The account switcher moves
 * to its own row; collapsed, the mark stays and the wordmark folds away; the
 * rail shows the mark only.
 */
export const WithLogo: Story = {
  render: function Render() {
    const [selected, setSelected] = useState('home');
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          logo={DEMO_LOGO}
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected={selected}
          onNavigate={(item) => setSelected(item.key)}
          account={DEMO_ACCOUNT}
          team={DEMO_TEAM}
        />
        <Sidebar defaultCollapsed logo={DEMO_LOGO} items={DEMO_NAV} secondaryItems={DEMO_SECONDARY} selected="home" team={DEMO_TEAM} />
        <Sidebar mobile onClose={() => {}} logo={DEMO_LOGO} items={DEMO_NAV} secondaryItems={DEMO_SECONDARY} selected="home" team={DEMO_TEAM} />
        <Sidebar
          variant="rail"
          logo={DEMO_LOGO}
          items={DEMO_RAIL_NAV}
          secondaryItems={DEMO_RAIL_SECONDARY}
          selected="home"
        />
      </Frame>
    );
  },
};

/** A wordmark on its own (an SVG wordmark works the same). */
export const WithWordmarkOnly: Story = {
  render: () => (
    <Frame>
      <Sidebar logo={{ wordmark: 'Mention' }} items={DEMO_NAV} secondaryItems={DEMO_SECONDARY} selected="home" team={DEMO_TEAM} />
    </Frame>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <Frame>
      <Sidebar
        testID="sidebar"
        defaultCollapsed
        items={DEMO_NAV}
        secondaryItems={DEMO_SECONDARY}
        selected="home"
        account={DEMO_ACCOUNT}
        team={DEMO_TEAM}
      />
    </Frame>
  ),
};

/** The drawer variants: `mobile` (close button) and `mobile flat` (search in the header). */
export const Mobile: Story = {
  render: () => (
    <Frame>
      <Sidebar
        mobile
        onClose={() => {}}
        items={DEMO_NAV}
        secondaryItems={DEMO_SECONDARY}
        selected="calendar"
        account={DEMO_ACCOUNT}
        team={DEMO_TEAM}
      />
      <Sidebar
        mobile
        flat
        items={DEMO_NAV}
        secondaryItems={DEMO_SECONDARY}
        selected="calendar"
        account={DEMO_ACCOUNT}
        team={DEMO_TEAM}
      />
    </Frame>
  ),
};

/** `SidebarItem` states on its own: rest, selected with badge, collapsed. */
export const Items: Story = {
  render: () => (
    <View style={{ width: 236, gap: 4 }}>
      <SidebarItem icon={RiHomeLine} label="Home" />
      <SidebarItem icon={RiHomeLine} label="Home" selected />
      <SidebarItem icon={RiKanbanView2} label="Project board" collapsed />
      <SidebarItem icon={RiKanbanView2} label="Project board" selected collapsed />
    </View>
  ),
};

const CHAT_NAV: SidebarNavItem[] = [
  { key: 'new-agent', label: 'New agent', icon: RiAddFill },
  { key: 'automations', label: 'Automations', icon: RiRobot2Line },
  { key: 'customize', label: 'Customize', icon: RiGuideLine },
];

const REPOSITORIES: SidebarTree = {
  label: 'Repositories',
  folders: [
    { key: 'web', label: 'web', items: [{ key: 'badge', label: 'pro badge restyle', meta: '2h' }, { key: 'docs', label: 'installation docs page', meta: '1d' }] },
    {
      key: 'vibl',
      label: 'vibl coding project',
      defaultOpen: true,
      items: [
        { key: 'landing', label: 'landing page design', meta: '34m' },
        { key: 'image', label: 'image generation', meta: 'now' },
        { key: 'coding', label: 'coding scenario', meta: 'now' },
        { key: 'mobile', label: 'mobile app for vuejs...', meta: '5h' },
      ],
    },
    { key: 'studio', label: 'studio landing page work', items: [{ key: 'hero', label: 'hero section animation', meta: '3d' }] },
  ],
};

const PLAN: SidebarPlan = { name: 'Design team', plan: 'Pro Plan', avatar: { initials: 'B', color: 'blue' } };

/**
 * The AI chat's rail: primary rows, a "Repositories" tree whose folders expand
 * into chats (with the curved connector and time chips), and a plan card in
 * place of the team menu. Quick search filters the tree too.
 */
export const Tree: Story = {
  render: function Render() {
    const [selected, setSelected] = useState('coding');
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          items={CHAT_NAV}
          secondaryItems={DEMO_SECONDARY}
          account={DEMO_ACCOUNT}
          tree={REPOSITORIES}
          selectedTreeItem={selected}
          onTreeItemPress={(item) => setSelected(item.key)}
          plan={PLAN}
        />
        <Sidebar mobile flat items={CHAT_NAV} secondaryItems={DEMO_SECONDARY} account={DEMO_ACCOUNT} tree={REPOSITORIES} selectedTreeItem={selected} plan={PLAN} />
      </Frame>
    );
  },
};

/** `SidebarFolder` and `SidebarPlanCard` on their own. */
export const TreeParts: Story = {
  render: () => (
    <View style={{ width: 236, gap: 16 }}>
      <SidebarFolder folder={REPOSITORIES.folders[1]!} selectedItem="image" />
      <SidebarFolder folder={REPOSITORIES.folders[2]!} />
      <SidebarPlanCard plan={PLAN} />
      <SidebarPlanCard plan={PLAN} collapsed />
    </View>
  ),
};

/** Demo rail destinations: a line glyph at rest, the filled one while selected. */
export const DEMO_RAIL_NAV: SidebarNavItem[] = [
  { key: 'home', label: 'Home', icon: RiHomeLine, activeIcon: RiHomeFill, href: '#home' },
  { key: 'favorites', label: 'Favorites', icon: RiHeartLine, activeIcon: RiHeartFill, href: '#favorites' },
  { key: 'activity', label: 'Activity', icon: RiNotification3Line, activeIcon: RiNotification3Fill, href: '#activity', badge: 4 },
  { key: 'automations', label: 'Automations', icon: RiRobot2Line, activeIcon: RiRobot2Fill, href: '#automations' },
];

export const DEMO_RAIL_SECONDARY: SidebarNavItem[] = [
  { key: 'settings', label: 'Settings', icon: RiSettings3Line, activeIcon: RiSettings3Fill, href: '#settings' },
];

/** `variant="rail"`: the 80px navigation rail, icon over label, items centred. */
export const Rail: Story = {
  render: function Render() {
    const [selected, setSelected] = useState('home');
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          variant="rail"
          items={DEMO_RAIL_NAV}
          secondaryItems={DEMO_RAIL_SECONDARY}
          selected={selected}
          onNavigate={(item) => setSelected(item.key)}
        />
      </Frame>
    );
  },
};

/** `SidebarRailItem` states on its own: rest, selected, selected with the filled glyph, badge. */
export const RailItems: Story = {
  render: () => (
    <View style={{ width: 64, gap: 8 }}>
      <SidebarRailItem icon={RiHomeLine} label="Home" />
      <SidebarRailItem icon={RiHomeLine} label="Home" selected />
      <SidebarRailItem icon={RiHomeLine} activeIcon={RiHome5Fill} label="Home" selected />
      <SidebarRailItem icon={RiNotification3Line} label="Activity" badge={<Badge content={4} />} />
    </View>
  ),
};
