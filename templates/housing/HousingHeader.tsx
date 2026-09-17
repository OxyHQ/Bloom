import React, { createContext, forwardRef, useContext } from 'react';
import {
  Platform,
  Pressable,
  View,
  useWindowDimensions,
  type PressableProps,
  type View as RNView,
} from 'react-native';

import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { Divider } from '../../src/divider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../src/dropdown-menu';
import { resolveMenuPalette } from '../../src/floating/menu-palette';
import { useInteractionState } from '../../src/hooks/use-interaction-state';
import { RiGlobalLine, RiHome4Line, RiMenuLine } from '../../src/icons/remix';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { WEB_POSITION_STICKY, type WebCssStyle } from '../../src/styles/web-view-style';
import { Z_INDEX } from '../../src/styles/z-index';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { TEMPLATE_FRAME } from '../shared/dashboard';
import { PEOPLE } from './data';

// ---------------------------------------------------------------------------
//  Navigation between the template's pages
// ---------------------------------------------------------------------------

export type HousingPage = 'explore' | 'rent' | 'sale' | 'stay' | 'swap' | 'my-home' | 'evictions' | 'publish' | 'saved';

const NavContext = createContext<(page: HousingPage) => void>(() => {});

/** The template's tiny router: pages call it to move between each other. */
export const HousingNavProvider = NavContext.Provider;

export function useHousingNav() {
  return useContext(NavContext);
}

// ---------------------------------------------------------------------------
//  Layout helpers
// ---------------------------------------------------------------------------

/** The window-width tiers the pages branch on. */
export function useHousingLayout() {
  const { width, height } = useWindowDimensions();
  const md = width >= BREAKPOINTS.md;
  const lg = width >= BREAKPOINTS.lg;
  const xl = width >= BREAKPOINTS.xl;
  return { width, height, md, lg, xl, gutter: xl ? 48 : md ? 32 : 16 };
}

export const IS_WEB = Platform.OS === 'web';

/**
 * The page frame: edge to edge over the preview's padding, the page
 * background, at least one viewport tall. The DOCUMENT scrolls on web.
 */
export function HousingFrame({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const theme = useTheme();
  const frame: WebCssStyle = {
    ...TEMPLATE_FRAME,
    backgroundColor: theme.colors.background,
    ...(IS_WEB ? { minHeight: '100dvh' as unknown as number } : null),
  };
  return (
    <View style={frame} testID={testID}>
      {children}
    </View>
  );
}

/** A centred content column with the page gutter. */
export function PageColumn({
  children,
  maxWidth = 1280,
  style,
}: {
  children: React.ReactNode;
  maxWidth?: number;
  style?: WebCssStyle;
}) {
  const { gutter } = useHousingLayout();
  return (
    <View
      style={[
        { width: '100%', maxWidth: maxWidth + gutter * 2, alignSelf: 'center', paddingLeft: gutter, paddingRight: gutter },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Sticks to the top of the document on web; a plain block on native. */
export function webSticky(top: number): WebCssStyle {
  return IS_WEB ? { position: WEB_POSITION_STICKY, top } : {};
}

/** A hairline in the page's neutral ramp. */
export function Hairline() {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return <Divider color={theme.isDark ? neutral[800] : neutral[200]} />;
}

// ---------------------------------------------------------------------------
//  Logo
// ---------------------------------------------------------------------------

/** The mark: the accent tile with a house. */
export function HousingMark({ size = 32 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
      }}
    >
      <RiHome4Line width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} fill={theme.colors.primaryForeground} />
    </View>
  );
}

export function HousingLogo({ wordmark = true }: { wordmark?: boolean }) {
  const theme = useTheme();
  const go = useHousingNav();
  return (
    <Pressable
      onPress={() => go('explore')}
      accessibilityRole="link"
      accessibilityLabel="Homes, back to explore"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      testID="housing-logo"
    >
      <HousingMark />
      {wordmark ? (
        <Text variant="title-3-semibold" style={{ color: theme.colors.text }}>
          Homes
        </Text>
      ) : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Account menu
// ---------------------------------------------------------------------------

/** The menu-and-avatar pill. Spreads the trigger's props (`asChild`). */
const AccountPill = forwardRef<RNView, PressableProps>(function AccountPill(props, ref) {
  const theme = useTheme();
  const palette = resolveMenuPalette(theme).trigger;
  const { state: hovered, onIn, onOut } = useInteractionState();
  return (
    <Pressable
      ref={ref}
      {...props}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 44,
        paddingLeft: 14,
        paddingRight: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: hovered ? palette.hoverBorder : palette.border,
        backgroundColor: hovered ? palette.hoverBackground : palette.background,
      }}
    >
      <RiMenuLine width={18} height={18} fill={theme.colors.text} />
      <Avatar size="sm" source={PEOPLE.you.avatar} name={PEOPLE.you.name} />
    </Pressable>
  );
});

export function AccountMenu() {
  const go = useHousingNav();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild label="Account menu">
        <AccountPill testID="housing-account" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onPress={() => go('explore')}>Explore</DropdownMenuItem>
        <DropdownMenuItem onPress={() => go('saved')}>Saved</DropdownMenuItem>
        <DropdownMenuItem onPress={() => go('my-home')}>My home</DropdownMenuItem>
        <DropdownMenuItem onPress={() => go('evictions')}>Evictions</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onPress={() => go('rent')}>Example: rental</DropdownMenuItem>
        <DropdownMenuItem onPress={() => go('sale')}>Example: sale</DropdownMenuItem>
        <DropdownMenuItem onPress={() => go('stay')}>Example: vacation rental</DropdownMenuItem>
        <DropdownMenuItem onPress={() => go('swap')}>Example: swap</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onPress={() => go('publish')}>List your home</DropdownMenuItem>
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderActions({ listHome = true }: { listHome?: boolean }) {
  const go = useHousingNav();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {listHome ? (
        <Button variant="ghost" size="medium" onPress={() => go('publish')} testID="housing-list-home">
          List your home
        </Button>
      ) : null}
      <Button variant="ghost" size="medium" iconOnly leadingIcon={RiGlobalLine} accessibilityLabel="Language and currency" />
      <View style={{ width: 4 }} />
      <AccountMenu />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  The header
// ---------------------------------------------------------------------------

export interface HousingHeaderProps {
  /** From `lg`: centred in the top row (the search mode tabs). */
  tabs?: React.ReactNode;
  /** From `lg`: a second row, centred (the search bar). */
  search?: React.ReactNode;
  /** Below `lg`: the row's middle (the compact search trigger). */
  compact?: React.ReactNode;
  /** Below `lg`: a second row (the segmented mode tabs). */
  compactBelow?: React.ReactNode;
  /** Cap the content width (the listing pages' column). */
  maxWidth?: number;
}

/**
 * The marketplace top bar. From `lg`: the mark and wordmark left, `tabs`
 * centred, "List your home" and the account pill right, and `search` on a
 * second row. Below `lg`: the mark, `compact` in the middle (or the wordmark
 * when there is none), the account pill; `compactBelow` under it. A hairline
 * closes it.
 */
export function HousingHeader({ tabs, search, compact, compactBelow, maxWidth = 1280 }: HousingHeaderProps) {
  const theme = useTheme();
  const { md, lg } = useHousingLayout();

  return (
    // Above the content that follows (a sticky category row), so an open
    // search panel paints over it.
    <View style={{ zIndex: Z_INDEX.dropdown, backgroundColor: theme.colors.background }} testID="housing-header">
      {lg ? (
        <PageColumn maxWidth={maxWidth} style={{ paddingBottom: search ? 20 : 0 }}>
          <View style={{ height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <HousingLogo />
            </View>
            {tabs ? <View>{tabs}</View> : null}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <HeaderActions />
            </View>
          </View>
          {search ? <View style={{ alignItems: 'center' }}>{search}</View> : null}
        </PageColumn>
      ) : (
        <PageColumn maxWidth={maxWidth} style={{ paddingTop: 12, paddingBottom: 12, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {compact ? (
              <>
                {md ? <HousingLogo wordmark={false} /> : null}
                <View style={{ flex: 1 }}>{compact}</View>
                {md ? <AccountMenu /> : null}
              </>
            ) : (
              <>
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                  <HousingLogo />
                </View>
                <HeaderActions listHome={md} />
              </>
            )}
          </View>
          {compactBelow}
        </PageColumn>
      )}
      <Hairline />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Footer
// ---------------------------------------------------------------------------

export function HousingFooter({ maxWidth = 1280, bottomSpace = 0 }: { maxWidth?: number; bottomSpace?: number }) {
  const theme = useTheme();
  const { md } = useHousingLayout();
  const { neutral } = resolveButtonRamps(theme);
  const go = useHousingNav();
  const columns: { title: string; links: { label: string; onPress?: () => void }[] }[] = [
    {
      title: 'Find a home',
      links: [
        { label: 'Rent', onPress: () => go('explore') },
        { label: 'Buy', onPress: () => go('explore') },
        { label: 'Vacation rentals', onPress: () => go('explore') },
        { label: 'Swap', onPress: () => go('explore') },
      ],
    },
    {
      title: 'Your home',
      links: [
        { label: 'List your home', onPress: () => go('publish') },
        { label: 'My home', onPress: () => go('my-home') },
        { label: 'Saved', onPress: () => go('saved') },
      ],
    },
    {
      title: 'Community',
      links: [{ label: 'Evictions', onPress: () => go('evictions') }, { label: 'Building reviews' }, { label: 'Tenant rights' }],
    },
  ];
  return (
    <View style={{ backgroundColor: theme.isDark ? neutral[950] : neutral[50], paddingBottom: bottomSpace }} testID="housing-footer">
      <Hairline />
      <PageColumn maxWidth={maxWidth} style={{ paddingTop: 32, paddingBottom: 24, gap: 24 }}>
        <View style={{ flexDirection: md ? 'row' : 'column', gap: md ? 48 : 24 }}>
          {columns.map((column) => (
            <View key={column.title} style={{ flex: md ? 1 : undefined, gap: 8, alignItems: 'flex-start' }}>
              <Text variant="body-2-semibold" style={{ color: theme.colors.text }}>
                {column.title}
              </Text>
              {column.links.map((link) => (
                <Button key={link.label} variant="link" linkTone="secondary" size="small" onPress={link.onPress}>
                  {link.label}
                </Button>
              ))}
            </View>
          ))}
        </View>
        <Hairline />
        <View
          style={{
            flexDirection: md ? 'row' : 'column',
            alignItems: md ? 'center' : 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 4 }}>
            <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
              © 2026 Homes
            </Text>
            {['Privacy', 'Terms', 'Sitemap'].map((link) => (
              <Button key={link} variant="link" linkTone="secondary" size="small">
                {link}
              </Button>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Button variant="link" linkTone="secondary" size="small" leadingIcon={RiGlobalLine}>
              English (GB)
            </Button>
            <Button variant="link" linkTone="secondary" size="small">
              € EUR
            </Button>
          </View>
        </View>
      </PageColumn>
    </View>
  );
}
