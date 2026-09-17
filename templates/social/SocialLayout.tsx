/**
 * The social app LAYOUT — the frame a public microblogging app hangs its
 * content on, with nothing of the content itself in it.
 *
 *   wide (lg+)    `AppShell`'s sidebar in flow on the left (logo, navigation,
 *                 a full-width compose button, the account row), the feed
 *                 column centred at `FEED_WIDTH` with its tab bar stuck to the
 *                 top, and `AppShell`'s `aside` on the right from `xl`:
 *                 a search field and stacked side cards, pinned while the
 *                 document scrolls
 *   medium        the sidebar collapses to the 80px rail; the aside stacks
 *                 under the feed below `xl`, or is dropped with
 *                 `asideCollapse="hidden"`
 *   phone         a top bar (avatar, title, action), the feed full width, and
 *                 a floating `TabBar` at the bottom; the sidebar becomes the
 *                 drawer the top bar's avatar opens
 *
 * Every region is a SLOT. `feed`, `aside`, `compose` and the tab content are
 * the app's; this file decides only where they sit and how they behave when
 * the window changes. It scrolls the DOCUMENT on web (see `docs/app-shell.mdx`),
 * so the sidebar and the aside pin themselves and the phone address bar
 * collapses the way it does on any web page.
 */
import React, { useMemo, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';

import { AppShell } from '../../src/app-shell';
import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { RiAddLine } from '../../src/icons/remix/RiAddLine';
import type { SidebarNavItem } from '../../src/sidebar';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { WEB_POSITION_FIXED, WEB_POSITION_STICKY, type WebCssStyle } from '../../src/styles/web-view-style';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';

/** The feed column's width — the one number the whole layout is built around. */
export const FEED_WIDTH = 600;
/** The side column's width from `xl`. */
export const ASIDE_WIDTH = 350;

export interface SocialLayoutProps {
  /** Sidebar rows (the app's routes). */
  items: SidebarNavItem[];
  selected: string;
  onNavigate: (item: SidebarNavItem) => void;
  /** The brand mark and wordmark at the top of the sidebar. */
  logo: { icon?: React.ReactNode; wordmark?: React.ReactNode };
  /** The account row at the foot of the sidebar. */
  account?: { name: string; avatar?: { source?: string; initials?: string } };
  /** Sticks to the top of the feed column: the tabs, or a page header. */
  feedHeader?: React.ReactNode;
  /** The feed itself. */
  children?: React.ReactNode;
  /** The right column, from `xl`. */
  aside?: React.ReactNode;
  /** `stack` (default) puts the aside under the feed below `xl`; `hidden` drops it. */
  asideCollapse?: 'stack' | 'hidden';
  /** The phone's bottom bar (a `TabBar`, or anything). */
  tabBar?: React.ReactNode;
  /**
   * The compose affordance. `Sidebar` takes no arbitrary slot, so the layout
   * floats it: bottom-left over the rail on wide screens (where a sidebar
   * button would sit) and bottom-right above the tab bar on a phone.
   */
  compose?: React.ReactNode;
  /** The phone's top bar right slot (a settings or sparkle icon button). */
  phoneAction?: React.ReactNode;
  /** The phone top bar's title. Defaults to the selected row's label. */
  phoneTitle?: string;
  testID?: string;
}

const IS_WEB = Platform.OS === 'web';

/** The page frame: full-bleed, and the document is what scrolls on web. */
export const SOCIAL_FRAME: WebCssStyle = IS_WEB
  ? { alignSelf: 'stretch', marginTop: -24, marginBottom: -24, marginLeft: -24, marginRight: -24 }
  : { flex: 1, width: '100%' };

export function SocialLayout({
  items,
  selected,
  onNavigate,
  logo,
  account,
  feedHeader,
  children,
  aside,
  asideCollapse = 'stack',
  tabBar,
  compose,
  phoneAction,
  phoneTitle,
  testID,
}: SocialLayoutProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const phone = width < BREAKPOINTS.md;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hairline = theme.isDark ? neutral[800] : neutral[200];
  const title = phoneTitle ?? items.find((item) => item.key === selected)?.label ?? '';

  // The sidebar carries the brand, the routes and the compose button; below
  // `lg` the same props drive the drawer.
  const sidebar = {
    logo,
    items,
    selected,
    onNavigate,
    account,
    showSearch: false,
    showThemeToggle: false,
    variant: phone ? ('panel' as const) : width < BREAKPOINTS.lg ? ('rail' as const) : ('panel' as const),
  };

  // The feed's own header — tabs, a title row — pinned to the top of the
  // column while the document scrolls under it.
  const stickyHeader: WebCssStyle | null =
    feedHeader == null
      ? null
      : IS_WEB
        ? { position: WEB_POSITION_STICKY, top: 0, zIndex: 2, backgroundColor: theme.colors.background }
        : { backgroundColor: theme.colors.background };

  const feedColumn = (
    <View
      testID={testID ? `${testID}-feed` : undefined}
      style={{
        width: '100%',
        maxWidth: phone ? undefined : FEED_WIDTH,
        alignSelf: 'center',
        borderLeftWidth: phone ? 0 : 1,
        borderRightWidth: phone ? 0 : 1,
        borderColor: hairline,
        minHeight: '100%',
      }}
    >
      {feedHeader != null ? <View style={stickyHeader ?? undefined}>{feedHeader}</View> : null}
      {children}
    </View>
  );

  return (
    <View style={SOCIAL_FRAME} testID={testID}>
      <AppShell
        testID={testID ? `${testID}-shell` : undefined}
        sidebar={sidebar}
        drawer="overlay"
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        contentMaxWidth={FEED_WIDTH + ASIDE_WIDTH + 48}
        aside={aside}
        asideWidth={ASIDE_WIDTH}
        asideFrom="xl"
        asideCollapse={asideCollapse}
        header={
          phone ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingBottom: 8,
              }}
            >
              <Avatar
                size={32}
                name={account?.name}
                source={account?.avatar?.source}
                alt={account?.name ?? 'Open navigation'}
                onPress={() => setDrawerOpen(true)}
              />
              <Text variant="headline-semibold" numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: theme.colors.text }}>
                {title}
              </Text>
              <View style={{ minWidth: 32, alignItems: 'flex-end' }}>{phoneAction}</View>
            </View>
          ) : null
        }
      >
        {feedColumn}
      </AppShell>
      {compose != null ? (
        <View
          testID={testID ? `${testID}-compose` : undefined}
          style={{
            position: IS_WEB ? WEB_POSITION_FIXED : 'absolute',
            bottom: phone && tabBar ? 88 : 24,
            ...(phone ? { right: 16 } : { left: 24 }),
          }}
        >
          {compose}
        </View>
      ) : null}
      {phone && tabBar ? (
        <View
          testID={testID ? `${testID}-tabbar` : undefined}
          style={{
            position: IS_WEB ? WEB_POSITION_FIXED : 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {tabBar}
        </View>
      ) : null}
    </View>
  );
}

/** The sidebar's compose button, sized to the rail. Rendered by the app inside `sidebar`. */
export function ComposeButton({ label = 'Post', onPress, collapsed }: { label?: string; onPress?: () => void; collapsed?: boolean }) {
  return (
    <Button variant="primary" size="large" fullWidth={!collapsed} iconOnly={collapsed} leadingIcon={RiAddLine} onPress={onPress}>
      {collapsed ? '' : label}
    </Button>
  );
}
