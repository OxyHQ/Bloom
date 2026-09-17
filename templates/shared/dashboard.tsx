import React, { useState } from 'react';
import { Image, Platform, View, useWindowDimensions, type ViewStyle } from 'react-native';

import { AppShell, NotificationBell } from '../../src/app-shell';
import { Avatar } from '../../src/avatar';
import { Breadcrumb, BreadcrumbItem } from '../../src/breadcrumb';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import type { ButtonIconComponent } from '../../src/button/types';
import type { DataTableRowActionItem } from '../../src/data-table';
import {
  RiAddFill,
  RiAsterisk,
  RiBankCardLine,
  RiBankLine,
  RiBox3Line,
  RiCalendarLine,
  RiChatAiLine,
  RiCustomerServiceLine,
  RiDeleteBin6Line,
  RiDownloadCloud2Line,
  RiEditLine,
  RiFilter3Fill,
  RiFolder6Line,
  RiGitPullRequestLine,
  RiGroupLine,
  RiHomeLine,
  RiImageAiLine,
  RiKanbanView2,
  RiLogoutBoxRLine,
  RiMegaphoneLine,
  RiMessage2Line,
  RiNotification3Line,
  RiSchoolLine,
  RiSettings4Line,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiUserAddLine,
  RiUserSmileLine,
} from '../../src/icons/remix';
import type { NotificationCenterItem } from '../../src/notification-center';
import type { SidebarAccount, SidebarNavItem, SidebarTeam } from '../../src/sidebar';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import type { WebCssStyle } from '../../src/styles/web-view-style';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';

import annPress from './assets/avatars/ann-press.webp';
import aspenLubin from './assets/avatars/aspen-lubin.webp';
import jaydonAminoff from './assets/avatars/jaydon-aminoff.webp';
import johnClarkson from './assets/avatars/john-clarkson.webp';
import kiannaVaccaro from './assets/avatars/kianna-vaccaro.webp';
import liviaSaris from './assets/avatars/livia-saris.webp';
import mariaLubin from './assets/avatars/maria-lubin.webp';
import michaelEkstrom from './assets/avatars/michael-ekstrom.webp';

/**
 * What the dashboard-family templates share and Bloom does not publish as
 * reusable components: the demo sidebar, team and account menus, the
 * header's notification feed and breadcrumb trail, the seeded PRNG and the
 * photo people their tables draw from, and the few template-only cells and
 * grids. Every reusable piece is a Bloom component; this file only composes
 * and feeds them.
 */

// ---------------------------------------------------------------------------
//  Assets
// ---------------------------------------------------------------------------

/**
 * A bundler asset as an absolute URI: Vite hands back a root-relative URL
 * string, Metro a module id. Absolute, because `Avatar` treats a string that is
 * not a URL as an image-resolver file id.
 */
export function assetUri(asset: string | number): string | undefined {
  if (typeof asset !== 'string') return Image.resolveAssetSource?.(asset)?.uri;
  const origin = (globalThis as { location?: { origin?: string } }).location?.origin;
  return asset.startsWith('/') && origin ? `${origin}${asset}` : asset;
}

export const AVATARS = {
  annPress,
  aspenLubin,
  jaydonAminoff,
  johnClarkson,
  kiannaVaccaro,
  liviaSaris,
  mariaLubin,
  michaelEkstrom,
} as const;

/** The first eight rows of every seeded people table use these photos. */
export const PHOTO_PEOPLE: { name: string; avatar: string | number }[] = [
  { name: 'John Clarkson', avatar: johnClarkson },
  { name: 'Aspen Lubin', avatar: aspenLubin },
  { name: 'Michael Ekstrom', avatar: michaelEkstrom },
  { name: 'Kianna Vaccaro', avatar: kiannaVaccaro },
  { name: 'Livia Saris', avatar: liviaSaris },
  { name: 'Jaydon Aminoff', avatar: jaydonAminoff },
  { name: 'Maria Lubin', avatar: mariaLubin },
  { name: 'Ann Press', avatar: annPress },
];

// ---------------------------------------------------------------------------
//  Seeded data helpers
// ---------------------------------------------------------------------------

/** mulberry32 — the tiny deterministic PRNG these tables are seeded with. */
export function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Date.parse("Oct 28, 2026")` without relying on the engine's loose date parser. */
export function dateValue(label: string): number {
  const [month, day, year] = label.replace(',', '').split(' ');
  return new Date(Number(year), MONTHS.indexOf(month ?? ''), Number(day)).getTime();
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
//  Sidebar, team menu and user menu
// ---------------------------------------------------------------------------

export const NAV_ITEMS: SidebarNavItem[] = [
  { key: 'home', label: 'Home', icon: RiHomeLine, href: '#home', badge: 152 },
  { key: 'project-board', label: 'Project board', icon: RiKanbanView2, href: '#project-board' },
  { key: 'marketing', label: 'Marketing', icon: RiMegaphoneLine, href: '#marketing' },
  { key: 'calendar', label: 'Calendar', icon: RiCalendarLine, href: '#calendar' },
  { key: 'finance', label: 'Finance', icon: RiBankLine, href: '#finance' },
  { key: 'medical', label: 'Medical Report', icon: RiAsterisk, href: '#medical-profile' },
  { key: 'ai-chat', label: 'AI Chat', icon: RiChatAiLine, href: '#ai-chat' },
  { key: 'ai-image', label: 'AI Image Generation', icon: RiImageAiLine, href: '#ai-image-generation' },
  { key: 'profile', label: 'Profile', icon: RiUserSmileLine, href: '#ai-profile' },
];

export const SECONDARY_ITEMS: SidebarNavItem[] = [
  { key: 'support', label: 'Support', icon: RiCustomerServiceLine },
  { key: 'settings', label: 'Settings', icon: RiSettings4Line, onPress: () => {} },
];

export const ACCOUNT: SidebarAccount = {
  name: 'Maya Collins',
  avatar: { initials: 'M', color: 'neutral' },
  users: [
    { id: 'm', name: 'Maya Collins', avatar: { initials: 'M', color: 'neutral' }, selected: true },
    { id: 's', name: 'Sam Rivera', avatar: { initials: 'S', color: 'lime' } },
    { id: 'l', name: 'Lena Park', avatar: { initials: 'L', color: 'pink' } },
  ],
  onAddUser: () => {},
  onManage: () => {},
};

export const TEAM: SidebarTeam = {
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

// ---------------------------------------------------------------------------
//  Header notifications
// ---------------------------------------------------------------------------

export const NOTIFICATIONS: NotificationCenterItem[] = [
  {
    id: 'mention-notes',
    category: 'mentions',
    group: 'Today',
    title: 'Livia mentioned you',
    description: 'Can you review the new empty state before we ship the dashboard?',
    timestamp: '2m',
    unread: true,
    avatar: { source: assetUri(liviaSaris), name: 'Livia Saris' },
    actions: [
      { id: 'reply', label: 'Reply', variant: 'primary' },
      { id: 'view', label: 'View thread', variant: 'secondary' },
    ],
  },
  {
    id: 'backup-ready',
    category: 'system',
    group: 'Today',
    title: 'Workspace backup is ready',
    description: 'The July 23 backup finished successfully and is ready to download.',
    timestamp: '18m',
    unread: true,
    status: 'success',
    icon: RiDownloadCloud2Line,
    actions: [{ id: 'download', label: 'Download', variant: 'secondary' }],
  },
  {
    id: 'project-invite',
    category: 'activity',
    group: 'Today',
    title: 'You joined Project Sea',
    description: 'Maria added you as an editor. You now have access to all project files.',
    timestamp: '1h',
    unread: true,
    icon: RiUserAddLine,
    status: 'information',
  },
  {
    id: 'pull-request',
    category: 'mentions',
    group: 'Earlier this week',
    title: 'Jaydon requested your review',
    description: 'Pull request #284 updates the notification preferences flow.',
    timestamp: 'Mon',
    unread: true,
    avatar: { source: assetUri(jaydonAminoff), name: 'Jaydon Aminoff' },
    actions: [{ id: 'review', label: 'Review changes', variant: 'secondary' }],
  },
  {
    id: 'security-check',
    category: 'system',
    group: 'Earlier this week',
    title: 'Security check completed',
    description: 'No exposed credentials or vulnerable dependencies were found.',
    timestamp: 'Sun',
    status: 'success',
    icon: RiShieldCheckLine,
  },
  {
    id: 'deploy-failed',
    category: 'system',
    group: 'Earlier this week',
    title: 'Preview deployment failed',
    description: 'The build stopped while validating the application routes.',
    timestamp: 'Sat',
    unread: true,
    status: 'error',
    icon: RiGitPullRequestLine,
    actions: [
      { id: 'retry', label: 'Retry', variant: 'primary' },
      { id: 'logs', label: 'View logs', variant: 'secondary' },
    ],
  },
];

// ---------------------------------------------------------------------------
//  The shell (`DashboardShell`, `FinanceShell`, `MarketingShell`, `HrShell`,
//  `MedicalShell`, and their identical `*-header.tsx`)
// ---------------------------------------------------------------------------

/**
 * The template spans the preview edge to edge — bleeding over the preview
 * decorator's 24px padding on web — and scrolls the DOCUMENT, the way an app
 * page does: `AppShell` grows the page and pins its own rail.
 */
export const TEMPLATE_FRAME: WebCssStyle =
  Platform.OS === 'web'
    ? { alignSelf: 'stretch', marginTop: -24, marginBottom: -24, marginLeft: -24, marginRight: -24 }
    : { flex: 1, width: '100%' };

export interface DashboardShellProps {
  /** Sidebar row selected on mount (`home`; HR passes a key no row has). */
  selected: string;
  /** The page title and the breadcrumb leaf. */
  title: string;
  /** The breadcrumb leaf when it differs from the title ("Home" under "Welcome Maya"). */
  crumb?: string;
  /** The breadcrumb leaf's icon. */
  crumbIcon: ButtonIconComponent;
  /** The primary header action: "Create ticket", "Add transaction"… */
  primaryAction: string;
  testID?: string;
  children: React.ReactNode;
}

/**
 * The floating sidebar (a page-slide reveal drawer below `lg`), the
 * Design team › Maya › page trail, the title with the notification bell,
 * Filters and the primary action, and the 1300px content column.
 */
export function DashboardShell({
  selected: initialSelected,
  title,
  crumb = title,
  crumbIcon,
  primaryAction,
  testID,
  children,
}: DashboardShellProps) {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <View style={TEMPLATE_FRAME}>
      <AppShell
        testID={testID}
        drawer="reveal"
        sidebar={{
          items: NAV_ITEMS,
          secondaryItems: SECONDARY_ITEMS,
          selected,
          onNavigate: (item) => setSelected(item.key),
          account: ACCOUNT,
          team: TEAM,
        }}
        title={title}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="#dashboard" leading={<Avatar size="xs" color="blue" initials="B" />}>
              Design team
            </BreadcrumbItem>
            <BreadcrumbItem href="#dashboard" leading={<Avatar size="xs" color="neutral" initials="M" />}>
              Maya
            </BreadcrumbItem>
            <BreadcrumbItem current icon={crumbIcon}>
              {crumb}
            </BreadcrumbItem>
          </Breadcrumb>
        }
        actions={
          <>
            <NotificationBell notifications={NOTIFICATIONS} unreadCount={5} width={430} />
            <Button variant="secondary" size="medium" leadingIcon={RiFilter3Fill}>
              Filters
            </Button>
            <Button variant="primary" size="medium" leadingIcon={RiAddFill}>
              {primaryAction}
            </Button>
          </>
        }
      >
        {children}
      </AppShell>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Responsive grids (Tailwind classes on the WINDOW width)
// ---------------------------------------------------------------------------

/** Tailwind's `sm` / `md` / `lg` / `xl`, read off the window like a CSS breakpoint class. */
export function useBreakpoints() {
  const { width } = useWindowDimensions();
  return {
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
  };
}

const GRID_GAP = 16;
const TRACK: ViewStyle = { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 };
const ROW: ViewStyle = { width: '100%', flexDirection: 'row', alignItems: 'stretch', gap: GRID_GAP };
const STACK: ViewStyle = { width: '100%', gap: GRID_GAP };

/**
 * `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`, the third card
 * `md:col-span-2 xl:col-span-1`. Cards on a row stretch to the tallest.
 */
export function ThreeUpChartRow({ children }: { children: [React.ReactNode, React.ReactNode, React.ReactNode] }) {
  const bp = useBreakpoints();
  const [a, b, c] = children;
  if (bp.xl) {
    return (
      <View style={ROW}>
        <View style={TRACK}>{a}</View>
        <View style={TRACK}>{b}</View>
        <View style={TRACK}>{c}</View>
      </View>
    );
  }
  if (bp.md) {
    return (
      <View style={STACK}>
        <View style={ROW}>
          <View style={TRACK}>{a}</View>
          <View style={TRACK}>{b}</View>
        </View>
        {c}
      </View>
    );
  }
  return (
    <View style={STACK}>
      {a}
      {b}
      {c}
    </View>
  );
}

/** `grid grid-cols-1 gap-4 lg:grid-cols-2`, both cards stretched to the taller. */
export function TwoUpChartRow({ children }: { children: [React.ReactNode, React.ReactNode] }) {
  const bp = useBreakpoints();
  const [a, b] = children;
  if (bp.lg) {
    return (
      <View style={ROW}>
        <View style={TRACK}>{a}</View>
        <View style={TRACK}>{b}</View>
      </View>
    );
  }
  return (
    <View style={STACK}>
      {a}
      {b}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Table cells the templates' columns compose
// ---------------------------------------------------------------------------

/** Delete and Edit — the two icon buttons most rows lead their actions with. */
export const DELETE_EDIT_ACTIONS: readonly DataTableRowActionItem[] = [
  { icon: RiDeleteBin6Line, label: 'Delete' },
  { icon: RiEditLine, label: 'Edit' },
];

/** `flex min-w-0 items-center gap-2` — a leading mark and the row's name. */
export function NameCell({ leading, children }: { leading: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1, maxWidth: '100%' }}>
      {leading}
      {children}
    </View>
  );
}

/** `truncate text-body-medium text-text-primary`. */
export function CellText({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text numberOfLines={1} variant="body-medium" style={{ flexShrink: 1, color: theme.colors.text }}>
      {children}
    </Text>
  );
}

/** Name over a secondary line (an employee's role). */
export function NameLines({ name, detail }: { name: string; detail?: string }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View style={{ minWidth: 0, flexShrink: 1 }}>
      <Text numberOfLines={1} variant="body-medium" style={{ color: theme.colors.text }}>
        {name}
      </Text>
      {detail != null ? (
        <Text numberOfLines={1} variant="body-2-medium" style={{ color: neutral[500] }}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

/** `Avatar size="sm"`: a photo, or initials on the neutral / blue disc. */
export function PersonAvatar({
  name,
  avatar,
  color = 'neutral',
}: {
  name: string;
  avatar?: string | number;
  color?: 'neutral' | 'blue';
}) {
  if (avatar != null) return <Avatar size="sm" source={assetUri(avatar)} alt="" />;
  return <Avatar size="sm" color={color} initials={initialsOf(name)} />;
}

/** `size-8 rounded-lg bg-background-tertiary-default`, a 16px `foreground-icon-primary` glyph. */
export function IconTile({ icon: Icon, label }: { icon: ButtonIconComponent; label: string }) {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  return (
    <View
      accessibilityLabel={label}
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.isDark ? n[800] : n[200],
      }}
    >
      <Icon width={16} height={16} fill={theme.colors.text} />
    </View>
  );
}
