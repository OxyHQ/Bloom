import { RiAddLine } from '../icons/remix/RiAddLine';
import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Button } from '../button';
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
import {
  Sidebar,
  SidebarFolder,
  SidebarItem,
  SidebarModeSwitcher,
  SidebarPlanCard,
  SidebarRailItem,
} from './index';
import type {
  SidebarAccount,
  SidebarLogo,
  SidebarMode,
  SidebarNavItem,
  SidebarPlan,
  SidebarTeam,
  SidebarTree,
  SidebarTreeFolder,
  SidebarTreeItem,
} from './types';

const meta: Meta<typeof Sidebar> = {
  id: 'blocks-sidebar',
  title: 'Composition/Navigation/Sidebar',
  component: Sidebar,
  // The demo data is exported for the AppShell stories; it is not a story.
  excludeStories: /^DEMO_/,
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

function OnboardingDemo() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const tasks = [
    { key: 'page', label: 'Create a page' },
    { key: 'team', label: 'Invite your team' },
    { key: 'project', label: 'Track a project' },
  ];
  return (
    <View style={{ flexDirection: 'row', height: 600, gap: 24 }}>
      <Sidebar
        surface="docked"
        size="sm"
        showSearch={false}
        showThemeToggle={false}
        items={[{ key: 'home', label: 'Home', icon: RiHomeLine }]}
        onboarding={{
          title: 'Welcome to Bloom',
          leading: <RiGuideLine width={20} height={20} />,
          onPress: () => setAll(true),
          steps: tasks.map((task) => ({
            ...task,
            completed: completed.includes(task.key),
            onPress: () => setActive(task.key),
          })),
          visibleCount: all ? tasks.length : 2,
          onSeeAll: () => setAll(true),
        }}
        tree={{
          label: 'Workspace',
          items: [{ key: 'notes', label: 'Notes', icon: RiFolder6Line }],
        }}
      />
      <View style={{ flex: 1, gap: 16, paddingTop: 24 }}>
        <Text>
          {active ? tasks.find((task) => task.key === active)?.label : 'Choose a task to begin.'}
        </Text>
        {active ? (
          <Button
            onPress={() => {
              setCompleted((previous) => [...previous, active]);
              setActive(null);
            }}
          >
            Complete task
          </Button>
        ) : null}
        {completed.length ? (
          <Button onPress={() => setCompleted([])} appearance="subtle">
            Reset progress
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export const Onboarding: Story = {
  render: () => <OnboardingDemo />,
};

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

function Frame({ children, height = 820 }: { children: React.ReactNode; height?: number }) {
  return (
    <View
      style={{
        maxWidth: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 24,
      }}
    >
      {React.Children.map(children, (child) => (
        <View style={{ height, maxWidth: '100%' }}>{child}</View>
      ))}
    </View>
  );
}

/** The floating rail, interactive: collapse, search (⌘L), both menus. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [two, setTwo] = useState('search');
    const [three, setThree] = useState('chat');
    return (
      <View testID="mode-switchers" style={{ width: 236, gap: 24, padding: 12 }}>
        <SidebarModeSwitcher
          testID="modes-two"
          modes={DEMO_MODES}
          value={two}
          onValueChange={setTwo}
        />
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
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
      }}
    >
      <RiAsterisk width={18} height={18} fill="#ffffff" />
    </View>
  );
}

const DEMO_LOGO: SidebarLogo = {
  icon: <DemoMark />,
  wordmark: 'Oxy',
  href: '#home',
  onPress: () => {},
};

/**
 * `logo`: a mark and a wordmark leading the header. The account switcher moves
 * to its own row; collapsed, the mark stays and the wordmark folds away; the
 * rail shows the mark only.
 */
export const WithLogo: Story = {
  parameters: { controls: { disable: true } },
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
        <Sidebar
          defaultCollapsed
          logo={DEMO_LOGO}
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected="home"
          team={DEMO_TEAM}
        />
        <Sidebar
          mobile
          onClose={() => {}}
          logo={DEMO_LOGO}
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected="home"
          team={DEMO_TEAM}
        />
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
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Sidebar
        logo={{ wordmark: 'Mention' }}
        items={DEMO_NAV}
        secondaryItems={DEMO_SECONDARY}
        selected="home"
        team={DEMO_TEAM}
      />
    </Frame>
  ),
};

export const Collapsed: Story = {
  parameters: { controls: { disable: true } },
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

/** The drawer variants: `mobile` (close button) and `mobile surface="plain"` (search in the header). */
export const Mobile: Story = {
  parameters: { controls: { disable: true } },
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
        surface="plain"
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
  parameters: { controls: { disable: true } },
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

const REPOSITORY_FOLDERS = [
  {
    key: 'web',
    label: 'web',
    items: [
      { key: 'badge', label: 'pro badge restyle', meta: '2h' },
      { key: 'docs', label: 'installation docs page', meta: '1d' },
    ],
  },
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
  {
    key: 'studio',
    label: 'studio landing page work',
    items: [{ key: 'hero', label: 'hero section animation', meta: '3d' }],
  },
] satisfies SidebarTreeFolder[];

const REPOSITORIES: SidebarTree = { label: 'Repositories', folders: REPOSITORY_FOLDERS };

const PLAN: SidebarPlan = {
  name: 'Design team',
  plan: 'Pro Plan',
  avatar: { initials: 'B', color: 'blue' },
};

/**
 * The AI chat's rail: primary rows, a "Repositories" tree whose folders expand
 * into chats (with the curved connector and time chips), and a plan card in
 * place of the team menu. Quick search filters the tree too.
 */
export const Tree: Story = {
  parameters: { controls: { disable: true } },
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
        <Sidebar
          mobile
          surface="plain"
          items={CHAT_NAV}
          secondaryItems={DEMO_SECONDARY}
          account={DEMO_ACCOUNT}
          tree={REPOSITORIES}
          selectedTreeItem={selected}
          plan={PLAN}
        />
      </Frame>
    );
  },
};

/**
 * Several sections: "Recently viewed" lists its homes directly — the section
 * IS the list — while "Saved" keeps the user's own folders. Each keeps its own
 * label and actions; quick search filters both.
 */
export const TreeSections: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [selected, setSelected] = useState('loft');
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          items={DEMO_NAV}
          account={DEMO_ACCOUNT}
          tree={[
            {
              key: 'recent',
              label: 'Recently viewed',
              items: [
                { key: 'loft', label: 'Loft in Gràcia', meta: '2h' },
                { key: 'flat', label: 'Two-bed flat, Eixample', meta: '1d' },
                { key: 'house', label: 'House with garden', meta: '3d' },
              ],
            },
            {
              key: 'saved',
              label: 'Saved',
              folders: [
                {
                  key: 'shortlist',
                  label: 'Shortlist',
                  defaultOpen: true,
                  items: [
                    { key: 'studio', label: 'Studio near the beach' },
                    { key: 'penthouse', label: 'Penthouse, Poblenou' },
                  ],
                },
                {
                  key: 'later',
                  label: 'Maybe later',
                  items: [{ key: 'farm', label: 'Farmhouse' }],
                },
              ],
            },
          ]}
          selectedTreeItem={selected}
          onTreeItemPress={(item) => setSelected(item.key)}
        />
      </Frame>
    );
  },
};

interface DemoPage {
  key: string;
  label: string;
  emoji: string;
  children: DemoPage[];
}

const DEMO_PAGES: DemoPage[] = [
  {
    key: 'roadmap',
    label: 'Roadmap',
    emoji: '🗺️',
    children: [
      { key: 'q1', label: 'Q1 goals', emoji: '🎯', children: [] },
      { key: 'q2', label: 'Q2 goals', emoji: '🚀', children: [] },
    ],
  },
  { key: 'notes', label: 'Meeting notes', emoji: '📝', children: [] },
  { key: 'ideas', label: 'Ideas', emoji: '💡', children: [] },
];

/** The page `key` taken out of `pages`, and what is left. */
function takePage(pages: DemoPage[], key: string): [DemoPage | null, DemoPage[]] {
  let taken: DemoPage | null = null;
  const rest = pages.flatMap((page) => {
    if (page.key === key) {
      taken = page;
      return [];
    }
    const [inner, children] = takePage(page.children, key);
    if (inner) taken = inner;
    return [{ ...page, children }];
  });
  return [taken, rest];
}

/** `page` put before, after or inside `target` (absent: at the end). */
function placePage(
  pages: DemoPage[],
  page: DemoPage,
  target: string | undefined,
  position: 'before' | 'inside' | 'after',
): DemoPage[] {
  if (!target) return [...pages, page];
  return pages.flatMap((each) => {
    if (each.key !== target)
      return [{ ...each, children: placePage(each.children, page, target, position) }];
    if (position === 'before') return [page, each];
    if (position === 'after') return [each, page];
    return [{ ...each, children: [...each.children, page] }];
  });
}

/**
 * A workspace app: the team leads from the header (a choice of workspaces),
 * the person is the card at the foot, and the pages are a tree — nested,
 * with icons and hover actions, in collapsible sections, moved by dragging
 * (or Alt+Shift+Arrows on a focused row).
 */
export const Workspace: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [workspace, setWorkspace] = useState('acme');
    const [pages, setPages] = useState(DEMO_PAGES);
    const [open, setOpen] = useState<Record<string, boolean>>({ roadmap: true });
    const [selected, setSelected] = useState('q1');
    const row = (page: DemoPage): SidebarTreeItem => ({
      key: page.key,
      label: page.label,
      leading: <Text>{page.emoji}</Text>,
      items: page.children.map(row),
      expandable: true,
      emptyLabel: 'No pages inside',
      open: open[page.key] ?? false,
      onOpenChange: (next) => setOpen((all) => ({ ...all, [page.key]: next })),
      draggable: true,
      actionsVisibility: 'hover',
      actions: <Badge content="+" />,
    });
    const workspaces = [
      { key: 'acme', label: 'Acme', description: 'Admin', initials: 'A' },
      { key: 'home', label: 'Home', description: 'Personal', initials: 'H' },
    ];
    const current = workspaces.find((w) => w.key === workspace)!;
    return (
      <Frame>
        <Sidebar
          testID="sidebar"
          size="sm"
          surface="docked"
          showThemeToggle={false}
          showSearch={false}
          teamPlacement="header"
          team={{
            name: current.label,
            avatar: { initials: current.initials, shape: 'squircle', color: 'blue' },
            groups: [
              {
                id: 'workspaces',
                label: 'Your workspaces',
                selection: 'single',
                items: workspaces.map((w) => ({
                  key: w.key,
                  label: w.label,
                  description: w.description,
                  avatar: { initials: w.initials, shape: 'squircle', color: 'blue' },
                  selected: w.key === workspace,
                  onPress: () => setWorkspace(w.key),
                })),
              },
              { id: 'create', items: [{ key: 'new', label: 'Create workspace', icon: RiAddLine }] },
            ],
          }}
          account={{
            name: 'Maya Collins',
            email: 'maya@oxy.so',
            avatar: { initials: 'M' },
            groups: [
              { id: 'me', items: [{ key: 'settings', label: 'Settings', icon: RiSettings3Line }] },
              {
                id: 'out',
                items: [
                  { key: 'out', label: 'Sign out', icon: RiLogoutBoxRLine, tone: 'destructive' },
                ],
              },
            ],
          }}
          items={[
            { key: 'search', label: 'Search', icon: RiSearchLine, shortcut: 'Mod+K' },
            { key: 'home', label: 'Home', icon: RiHomeLine },
            { key: 'inbox', label: 'Inbox', icon: RiNotification3Line, badge: 3 },
          ]}
          tree={[
            {
              key: 'favorites',
              label: 'Favorites',
              collapsible: true,
              emptyLabel: 'Star a page to keep it here',
            },
            {
              key: 'private',
              label: 'Private',
              collapsible: true,
              actionsVisibility: 'hover',
              actions: <Badge content="+" />,
              items: pages.map(row),
            },
          ]}
          selectedTreeItem={selected}
          onTreeItemPress={(item) => setSelected(item.key)}
          onTreeItemDrop={({ item, target, position }) =>
            setPages((all) => {
              const [page, rest] = takePage(all, item.key);
              return page ? placePage(rest, page, target?.key, position) : all;
            })
          }
        />
      </Frame>
    );
  },
};

/** `SidebarFolder` and `SidebarPlanCard` on their own. */
export const TreeParts: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 236, gap: 16 }}>
      <SidebarFolder folder={REPOSITORY_FOLDERS[1]!} selectedItem="image" />
      <SidebarFolder folder={REPOSITORY_FOLDERS[2]!} />
      <SidebarPlanCard plan={PLAN} />
      <SidebarPlanCard plan={PLAN} collapsed />
    </View>
  ),
};

/** Demo rail destinations: a line glyph at rest, the filled one while selected. */
export const DEMO_RAIL_NAV: SidebarNavItem[] = [
  { key: 'home', label: 'Home', icon: RiHomeLine, activeIcon: RiHomeFill, href: '#home' },
  {
    key: 'favorites',
    label: 'Favorites',
    icon: RiHeartLine,
    activeIcon: RiHeartFill,
    href: '#favorites',
  },
  {
    key: 'activity',
    label: 'Activity',
    icon: RiNotification3Line,
    activeIcon: RiNotification3Fill,
    href: '#activity',
    badge: 4,
  },
  {
    key: 'automations',
    label: 'Automations',
    icon: RiRobot2Line,
    activeIcon: RiRobot2Fill,
    href: '#automations',
  },
];

export const DEMO_RAIL_SECONDARY: SidebarNavItem[] = [
  {
    key: 'settings',
    label: 'Settings',
    icon: RiSettings3Line,
    activeIcon: RiSettings3Fill,
    href: '#settings',
  },
];

/** `variant="rail"`: the 80px navigation rail, icon over label, items centred. */
export const Rail: Story = {
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 64, gap: 8 }}>
      <SidebarRailItem icon={RiHomeLine} label="Home" />
      <SidebarRailItem icon={RiHomeLine} label="Home" selected />
      <SidebarRailItem icon={RiHomeLine} activeIcon={RiHome5Fill} label="Home" selected />
      <SidebarRailItem icon={RiNotification3Line} label="Activity" badge={<Badge content={4} />} />
    </View>
  ),
};

/**
 * The three SURFACES, the axis two apps differ on most: the floating `card`,
 * the `plain` column that sits straight on the page, and the `docked` one
 * flush to the window with a single hairline facing the content.
 */
export const Surfaces: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      {(['card', 'plain', 'docked'] as const).map((surface) => (
        <Sidebar
          key={surface}
          surface={surface}
          items={DEMO_NAV}
          secondaryItems={DEMO_SECONDARY}
          selected="calendar"
          account={DEMO_ACCOUNT}
          showSearch={false}
          testID={`sidebar-${surface}`}
        />
      ))}
    </Frame>
  ),
};

/**
 * The three SIZES: 232 / 260 / 300 expanded, a 30 / 36 / 44 square collapsed,
 * an 18 / 20 / 24 glyph. `lg` is the destination-first rail a social app
 * reads with at arm's length.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Sidebar
          key={size}
          size={size}
          items={DEMO_NAV}
          selected="calendar"
          account={DEMO_ACCOUNT}
          tree={SIZES_TREE}
          showSearch={false}
          showThemeToggle={false}
          testID={`sidebar-${size}`}
        />
      ))}
    </Frame>
  ),
};

const SIZES_TREE: SidebarTree[] = [
  {
    key: 'recent',
    label: 'Recently viewed',
    items: [
      { key: 'loft', label: 'Loft in Gràcia', meta: '2h' },
      { key: 'flat', label: 'Two-bed flat', meta: '1d' },
    ],
  },
  {
    key: 'saved',
    label: 'Saved',
    folders: [
      {
        key: 'shortlist',
        label: 'Shortlist',
        defaultOpen: true,
        items: [{ key: 'studio', label: 'Studio near the beach', meta: '3' }],
      },
    ],
  },
  { key: 'archive', label: 'Archive', emptyLabel: 'Nothing archived' },
];

/** Compact modes keep their icons centered at every panel size and surface. */
export const CollapsedModes: Story = {
  args: { size: 'md', surface: 'card' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    surface: { control: 'select', options: ['card', 'docked'] },
  },
  render: function Render(args) {
    const [collapsed, setCollapsed] = useState(true);
    const [mode, setMode] = useState('search');
    return (
      <Frame>
        <Sidebar
          {...args}
          testID="compact-sidebar"
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          modes={DEMO_MODES}
          mode={mode}
          onModeChange={setMode}
          items={DEMO_NAV.slice(0, 3)}
          showSearch={false}
          showThemeToggle
        />
      </Frame>
    );
  },
};

/** Overflow cues update before scrolling and disappear when all rows fit. */
export const ScrollOverflow: Story = {
  args: { surface: 'card' },
  argTypes: { surface: { control: 'select', options: ['card', 'docked', 'plain'] } },
  render: function Render(args) {
    const [selected, setSelected] = useState('home');
    return (
      <Frame height={320}>
        <Sidebar
          {...args}
          testID="overflow-sidebar"
          style={{ height: 320 }}
          items={DEMO_NAV}
          selected={selected}
          onNavigate={(item) => setSelected(item.key)}
          showSearch={false}
          showThemeToggle={false}
        />
        <Sidebar
          {...args}
          testID="fitting-sidebar"
          style={{ height: 320 }}
          items={DEMO_NAV.slice(0, 2)}
          showSearch={false}
          showThemeToggle={false}
        />
      </Frame>
    );
  },
};

export const Playground: Story = {
  args: {
    items: DEMO_NAV,
    selected: 'home',
    modes: DEMO_MODES,
    mode: 'search',
    collapsed: false,
    size: 'md',
    surface: 'card',
    showSearch: true,
    showThemeToggle: true,
  },
  parameters: {
    controls: {
      disable: false,
      include: [
        'selected',
        'mode',
        'collapsed',
        'size',
        'surface',
        'showSearch',
        'showThemeToggle',
      ],
    },
  },
  argTypes: {
    selected: { control: 'select', options: DEMO_NAV.map((item) => item.key) },
    mode: { control: 'select', options: ['search', 'computer'] },
    collapsed: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    surface: { control: 'select', options: ['card', 'docked', 'plain'] },
    showSearch: { control: 'boolean' },
    showThemeToggle: { control: 'boolean' },
  },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return (
      <View style={{ height: 700, maxWidth: '100%' }}>
        <Sidebar
          {...args}
          style={{ height: '100%', maxWidth: '100%' }}
          onCollapsedChange={(collapsed) => updateArgs({ collapsed })}
          onModeChange={(mode) => updateArgs({ mode })}
          onNavigate={(item) => updateArgs({ selected: item.key })}
        />
      </View>
    );
  },
};

/** Every fixed and scrolling control uses the same compact icon lane. */
export const PrimaryAction: Story = {
  args: {
    ...Playground.args,
    logo: DEMO_LOGO,
    items: DEMO_NAV.slice(0, 3),
    secondaryItems: DEMO_SECONDARY,
    primaryAction: { label: 'New post', icon: RiAddLine, onPress: () => {} },
  },
  parameters: Playground.parameters,
  argTypes: Playground.argTypes,
  render: function PrimaryAction(args) {
    const [, updateArgs] = useArgs();
    return (
      <View style={{ height: 900, maxWidth: '100%' }}>
        <Sidebar
          {...args}
          testID="action-sidebar"
          style={{ height: '100%', maxWidth: '100%' }}
          onCollapsedChange={(collapsed) => updateArgs({ collapsed })}
          onModeChange={(mode) => updateArgs({ mode })}
          onNavigate={(item) => updateArgs({ selected: item.key })}
        />
      </View>
    );
  },
};

/** Shared material while retaining the current sidebar navigation API. */
export const BlurPanel: Story = {
  render: () => (
    <div
      style={{
        padding: 24,
        height: 760,
        width: 'fit-content',
        borderRadius: 28,
        background:
          'radial-gradient(circle at 18% 22%, #f97316 0 14%, transparent 34%), radial-gradient(circle at 78% 18%, #8b5cf6 0 12%, transparent 32%), radial-gradient(circle at 62% 78%, #06b6d4 0 14%, transparent 36%), radial-gradient(circle at 24% 82%, #ec4899 0 12%, transparent 32%), linear-gradient(135deg, #fde68a, #a7f3d0 50%, #bfdbfe)',
      }}
    >
      <Sidebar
        testID="sidebar-blur"
        items={DEMO_NAV}
        secondaryItems={DEMO_SECONDARY}
        account={DEMO_ACCOUNT}
        team={DEMO_TEAM}
        selected="home"
      />
    </div>
  ),
};
