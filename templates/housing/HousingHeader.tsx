import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';

import { AppShell, useAppShell } from '../../src/app-shell';
import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { Divider } from '../../src/divider';
import { resolveMenuPalette } from '../../src/floating/menu-palette';
import { useInteractionState } from '../../src/hooks/use-interaction-state';
import {
  RiAlarmWarningLine,
  RiBookmarkLine,
  RiCompass3Line,
  RiGlobalLine,
  RiHome4Line,
  RiMegaphoneLine,
  RiMenuLine,
} from '../../src/icons/remix';
import type { SidebarNavItem } from '../../src/sidebar';
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
const PageContext = createContext<HousingPage>('explore');

/** The page being shown, so the rail can mark it. */
export const HousingPageProvider = PageContext.Provider;

export function useHousingPage() {
  return useContext(PageContext);
}

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
 * What the header's nav control does to the rail. The rail's collapsed state
 * lives in the frame, the control lives in the page's own header, and above
 * `lg` there is no drawer to open — so the two meet here rather than through a
 * prop threaded down every page.
 */
interface HousingNavControls {
  collapsed: boolean;
  toggle: () => void;
}

const NavControlContext = createContext<HousingNavControls | null>(null);

/**
 * The page frame — and the app's NAVIGATION. The brand lives here, in the
 * rail's `logo`, not in the top bar: a marketplace header that repeats the mark
 * on every page spends its most valuable corner on something the rail already
 * says, and below `lg` the rail becomes the drawer that same corner opens.
 *
 * Edge to edge over the preview's padding, the page background, the DOCUMENT
 * scrolling on web (`AppShell`'s own mode), so the rail pins itself and the
 * pages keep their sticky headers.
 *
 * `aside` is the widget column: the shell keeps it beside the page from
 * `xl` and drops it below that, where the page needs the width more than the
 * widgets do.
 */
export function HousingFrame({
  children,
  aside,
  testID,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  testID?: string;
}) {
  const theme = useTheme();
  const go = useHousingNav();
  const page = useHousingPage();
  const [collapsed, setCollapsed] = useState(false);
  const nav = useMemo<HousingNavControls>(
    () => ({ collapsed, toggle: () => setCollapsed((c) => !c) }),
    [collapsed],
  );
  const frame: WebCssStyle = {
    ...TEMPLATE_FRAME,
    backgroundColor: theme.colors.background,
  };

  const items: SidebarNavItem[] = [
    { key: 'explore', label: 'Explore', icon: RiCompass3Line, onPress: () => go('explore') },
    { key: 'saved', label: 'Saved', icon: RiBookmarkLine, onPress: () => go('saved') },
    { key: 'my-home', label: 'My home', icon: RiHome4Line, onPress: () => go('my-home') },
    { key: 'evictions', label: 'Evictions', icon: RiAlarmWarningLine, onPress: () => go('evictions') },
  ];
  const secondaryItems: SidebarNavItem[] = [
    { key: 'publish', label: 'List your home', icon: RiMegaphoneLine, onPress: () => go('publish') },
  ];

  return (
    <View style={frame} testID={testID}>
      <AppShell
        scroll="document"
        // The pages draw their own top bar (search, tabs, actions), so the
        // shell's header slot stays empty rather than stacking a second one.
        header={null}
        sidebar={{
          logo: { icon: <HousingMark size={28} />, wordmark: 'Homes', onPress: () => go('explore') },
          items,
          secondaryItems,
          selected: page,
          showSearch: false,
          collapsed,
          onCollapsedChange: setCollapsed,
        }}
        aside={aside}
        asideWidth={332}
        // 1440, not `xl`: at 1280 the rail, a 332 column and the results left
        // the cards a single column each — the widgets have to be free width,
        // not width the page needed.
        asideFrom={1440}
        asideCollapse="hidden"
      >
        <NavControlContext.Provider value={nav}>{children}</NavControlContext.Provider>
      </AppShell>
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

// ---------------------------------------------------------------------------
//  The nav toggle
// ---------------------------------------------------------------------------

/**
 * The menu-and-avatar pill: the app's one navigation control, in the corner the
 * mark used to sit in.
 *
 * It TOGGLES the rail — no menu drops out of it. Below `lg` the rail is the
 * shell's drawer, so the pill opens and closes that (`useAppShell`);
 * from `lg` the rail is in flow and the pill collapses it to its icons and back
 * (`HousingFrame`'s `collapsed`). One control, one thing it does, and the
 * destinations live in the rail it opens rather than being spelled twice.
 */
export function NavToggle() {
  const theme = useTheme();
  const palette = resolveMenuPalette(theme).trigger;
  const { state: hovered, onIn, onOut } = useInteractionState();
  // Always inside `HousingFrame`'s shell, so the drawer is never a question.
  const shell = useAppShell();
  const nav = useContext(NavControlContext);

  const drawer = shell.drawerAvailable;
  const expanded = drawer ? shell.drawerOpen : !(nav?.collapsed ?? false);
  const onPress = useCallback(() => {
    if (drawer) shell.toggleDrawer();
    else nav?.toggle();
  }, [drawer, nav, shell]);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      role="button"
      accessibilityLabel={drawer ? 'Navigation' : 'Collapse navigation'}
      aria-expanded={expanded}
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
      testID="housing-nav-toggle"
    >
      <RiMenuLine width={18} height={18} fill={theme.colors.text} />
      <Avatar size="sm" source={PEOPLE.you.avatar} name={PEOPLE.you.name} />
    </Pressable>
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
 * The marketplace top bar. The BRAND is not here — it lives in the rail
 * (`HousingFrame` gives every page a `Sidebar` carrying the logo), so the top
 * bar carries only what belongs to the page.
 *
 * From `lg`: the nav pill left, in the corner the mark used to hold, `tabs`
 * centred, "List your home" and the globe right, and `search` on a second row.
 * Below `lg`: the nav pill, `compact` in the middle, the page actions;
 * `compactBelow` under it. A hairline closes it.
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
              <NavToggle />
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
                <NavToggle />
                <View style={{ flex: 1 }}>{compact}</View>
              </>
            ) : (
              <>
                <NavToggle />
                <View style={{ flex: 1 }} />
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
