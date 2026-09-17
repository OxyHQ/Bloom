/**
 * The social app LAYOUT — the frame the app's own screens hang on, and nothing
 * of the content itself. It is the three-region shell a feed-based social app
 * uses, rebuilt out of the current component set:
 *
 *   rail        a sticky, full-height `Sidebar` on the left — icons only until
 *              `EXPANDED_FROM` (1300), labels past it; below `ROW_FROM` (500)
 *              it is a drawer the top bar opens
 *   centre     the routed screen inside a `ContentPanel`, which is full-bleed
 *              below `ROW_FROM` and a rounded, bordered panel past it, with the
 *              page background showing as a gutter around it
 *   right      a 350 side column from `RIGHT_FROM` (990) — search and widgets —
 *              sticky under the top of the viewport while the document scrolls
 *   phone      a top bar (avatar → drawer, title, one action), the panel
 *              full-bleed, a bottom bar slot and a floating compose button
 *
 * The centre and the right column share a `CONTENT_MAX` (950) cap and the pair
 * is centred in what the rail leaves, so the feed lands at ~600 next to a 350
 * column — the reading width the panel was drawn for.
 *
 * Every region is a SLOT: `children`, `aside`, `tabBar`, `compose`,
 * `phoneAction` and the sidebar's own props are the app's. This file decides
 * only where they sit and what happens as the window changes. It scrolls the
 * DOCUMENT on web, so both columns pin themselves with `position: sticky` and
 * the phone address bar collapses the way it does on any web page.
 */
import React, { useMemo, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';

import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { RiAddLine } from '../../src/icons/remix/RiAddLine';
import { ContentPanel } from '../../src/content-panel';
import { Sidebar } from '../../src/sidebar';
import type { SidebarNavItem, SidebarProps } from '../../src/sidebar';
import {
  WEB_POSITION_FIXED,
  WEB_POSITION_STICKY,
  WEB_VIEWPORT_HEIGHT,
  type WebCssStyle,
} from '../../src/styles/web-view-style';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';

/** Row layout and the framed panel start here; below this the app is one column. */
export const ROW_FROM = 500;
/** The right column appears here. */
export const RIGHT_FROM = 990;
/** The rail shows labels here; below it, icons only. */
export const EXPANDED_FROM = 1300;
/** Centre + right column, together. */
export const CONTENT_MAX = 950;
/** The right column's width. */
export const ASIDE_WIDTH = 350;
/** The gutter the page background shows around the framed panel. */
export const GUTTER = 8;
/** Where the right column pins itself. */
export const ASIDE_STICKY_TOP = 50;

const IS_WEB = Platform.OS === 'web';

/**
 * The app owns the whole viewport: in Storybook that means bleeding over the
 * preview decorator's 24px padding, the way the other templates do.
 */
export const SOCIAL_FRAME: WebCssStyle = IS_WEB
  ? { alignSelf: 'stretch', marginTop: -24, marginBottom: -24, marginLeft: -24, marginRight: -24 }
  : { flex: 1, width: '100%' };

export interface SocialLayoutProps {
  /** The rail's routes. */
  items: SidebarNavItem[];
  selected: string;
  onNavigate: (item: SidebarNavItem) => void;
  /** Everything else the rail takes (logo, account, secondary rows…). */
  sidebar?: Omit<SidebarProps, 'items' | 'selected' | 'onNavigate' | 'collapsed' | 'mobile' | 'onClose' | 'flat'>;
  /** The routed screen. */
  children?: React.ReactNode;
  /** The right column's content (search, widgets, footer links). */
  aside?: React.ReactNode;
  /** The phone's bottom bar (a `TabBar`). */
  tabBar?: React.ReactNode;
  /** Floated bottom-left over the rail, or bottom-right over the phone's bar. */
  compose?: React.ReactNode;
  /** The phone top bar's trailing slot. */
  phoneAction?: React.ReactNode;
  /** The phone top bar's title. Defaults to the selected row's label. */
  phoneTitle?: string;
  /** The account whose avatar opens the drawer on a phone. */
  account?: { name?: string; avatar?: string };
  testID?: string;
}

export function SocialLayout({
  items,
  selected,
  onNavigate,
  sidebar,
  children,
  aside,
  tabBar,
  compose,
  phoneAction,
  phoneTitle,
  account,
  testID,
}: SocialLayoutProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const row = width >= ROW_FROM;
  const showAside = width >= RIGHT_FROM && aside != null;
  const expanded = width >= EXPANDED_FROM;
  const title = phoneTitle ?? items.find((item) => item.key === selected)?.label ?? '';

  const railStyle: WebCssStyle | null = IS_WEB
    ? { position: WEB_POSITION_STICKY, top: 0, alignSelf: 'flex-start', height: WEB_VIEWPORT_HEIGHT }
    : null;
  const asideStyle: WebCssStyle | null = IS_WEB
    ? { position: WEB_POSITION_STICKY, top: ASIDE_STICKY_TOP, alignSelf: 'flex-start' }
    : null;

  const railProps: SidebarProps = {
    ...sidebar,
    items,
    selected,
    onNavigate,
    // `flat` drops the floating-panel chrome; the rail then sits ON the page
    // background — only the centre panel is a card, or the two whites meet in a
    // seam down the middle of the app.
    flat: true,
    collapsed: !expanded,
    style: [{ backgroundColor: 'transparent' }, sidebar?.style],
  };

  return (
    <View
      testID={testID}
      style={{
        ...SOCIAL_FRAME,
        flexGrow: 1,
        minHeight: IS_WEB ? WEB_VIEWPORT_HEIGHT : undefined,
        width: '100%',
        flexDirection: row ? 'row' : 'column',
        justifyContent: row ? 'center' : undefined,
        backgroundColor: theme.colors.background,
      }}
    >
      {row ? (
        <View testID={testID ? `${testID}-rail` : undefined} style={railStyle ?? undefined}>
          <Sidebar {...railProps} />
        </View>
      ) : (
        <View
          testID={testID ? `${testID}-topbar` : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderColor: theme.isDark ? neutral[800] : neutral[200],
          }}
        >
          <Avatar
            size={32}
            name={account?.name}
            source={account?.avatar}
            alt={account?.name ?? 'Open navigation'}
            onPress={() => setDrawerOpen(true)}
          />
          <Text variant="headline-semibold" numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: theme.colors.text }}>
            {title}
          </Text>
          <View style={{ minWidth: 32, alignItems: 'flex-end' }}>{phoneAction}</View>
        </View>
      )}

      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: row ? 'row' : 'column',
          maxWidth: row ? CONTENT_MAX : undefined,
        }}
      >
        {/* The gutter: the page background around the panel, flush against the
            rail on its left so the two meet without a seam. */}
        <View
          style={{
            flex: 1,
            minWidth: 0,
            paddingTop: row && IS_WEB ? GUTTER : 0,
            paddingRight: row && IS_WEB ? GUTTER : 0,
            paddingBottom: row && IS_WEB ? GUTTER : 0,
          }}
        >
          <ContentPanel framedFrom={ROW_FROM} maskColor={theme.colors.background}>
            {children}
          </ContentPanel>
        </View>

        {showAside ? (
          <View
            testID={testID ? `${testID}-aside` : undefined}
            style={[{ width: ASIDE_WIDTH, flexShrink: 0 }, asideStyle]}
          >
            {aside}
          </View>
        ) : null}
      </View>

      {/* Below the row breakpoint the rail arrives as a drawer. */}
      {!row && drawerOpen ? (
        <View
          testID={testID ? `${testID}-drawer` : undefined}
          style={{
            position: IS_WEB ? WEB_POSITION_FIXED : 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 20,
          }}
        >
          <Sidebar {...railProps} collapsed={false} mobile onClose={() => setDrawerOpen(false)} />
        </View>
      ) : null}

      {compose != null ? (
        <View
          testID={testID ? `${testID}-compose` : undefined}
          style={{
            position: IS_WEB ? WEB_POSITION_FIXED : 'absolute',
            bottom: !row && tabBar ? 88 : 24,
            ...(row ? { left: 24 } : { right: 16 }),
          }}
        >
          {compose}
        </View>
      ) : null}

      {!row && tabBar ? (
        <View
          testID={testID ? `${testID}-tabbar` : undefined}
          style={{ position: IS_WEB ? WEB_POSITION_FIXED : 'absolute', left: 0, right: 0, bottom: 0 }}
        >
          {tabBar}
        </View>
      ) : null}
    </View>
  );
}

/** The rail's compose affordance: full width with labels, a round glyph without. */
export function ComposeButton({
  label = 'Post',
  onPress,
  collapsed,
}: {
  label?: string;
  onPress?: () => void;
  collapsed?: boolean;
}) {
  return (
    <Button
      variant="primary"
      size="large"
      fullWidth={!collapsed}
      iconOnly={collapsed}
      leadingIcon={RiAddLine}
      accessibilityLabel={label}
      onPress={onPress}
    >
      {collapsed ? '' : label}
    </Button>
  );
}
