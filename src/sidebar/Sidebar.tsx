import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  type LayoutChangeEvent,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Badge } from '../badge';
import { CloseButton } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCloseLine, RiSearchLine, RiSideBarFill } from '../icons/remix';
import { Kbd } from '../kbd';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { ThemeToggle } from '../theme-toggle';
import { Text, TYPE_SCALE } from '../typography';
import { useSidebarPalette, type SidebarPalette } from './palette';
import { Collapsible, CollapseProvider, IS_WEB, MORPH_MS, useSidebarWebCss } from './parts';
import { SidebarFolder } from './SidebarFolder';
import { SidebarItem } from './SidebarItem';
import { SidebarModeSwitcher } from './SidebarModeSwitcher';
import { SidebarPlanCard } from './SidebarPlanCard';
import { SidebarRail } from './SidebarRail';
import { SidebarTeamMenu } from './SidebarTeamMenu';
import { SidebarLogoView } from './SidebarLogoView';
import { SidebarUserMenu } from './SidebarUserMenu';
import type { SidebarNavItem, SidebarProps } from './types';

/**
 * `Sidebar` — the floating app rail, expanded or collapsed.
 *
 *   panel      260 wide expanded (p12), 52 collapsed (px7 py12 — with the 1px
 *              border that leaves exactly the 36px item column; 60/px11
 *              reads loose around a pill column), radius 24,
 *              1px border-button-white, shadow-sidebar, background-secondary;
 *              `flat` drops the chrome onto background-full
 *   top        scroller (−8 margin / 8 padding, so rings and the profile pill
 *              are not clipped), gap 12: account switcher + collapse control
 *              (a column, avatar last, when collapsed), quick search, nav
 *              (px2 expanded, gap 4)
 *   bottom     gap 12: theme toggle (segmented expanded, icon collapsed),
 *              secondary rows, team card
 *   search     pill button p8 gap8 on background-tertiary (hover tertiary-hover
 *              at 55%) with a ⌘L hint; active it becomes a field with a 2px
 *              inset border-button-active ring, filters every row, and closes
 *              on Escape, the clear button or a press outside
 *
 * `variant="rail"` renders `SidebarRail` instead (navigation only).
 *
 * The two widths morph (300ms ease-in-out) while labels, badges and the hint
 * collapse through `Collapsible` — the icons never move. Reduced motion snaps.
 */

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);
const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 52;
/** Horizontal padding while collapsed: (52 − 2 × 1px border − 36px column) / 2. */
const COLLAPSED_PADDING_X = 7;

function matchesQuery(label: string, query: string): boolean {
  return label.toLocaleLowerCase().includes(query);
}

function SearchField({
  palette,
  inputRef,
  value,
  onChangeText,
  onDismiss,
  placeholder,
  label,
  compact = false,
}: {
  palette: SidebarPalette;
  inputRef: React.RefObject<TextInput | null>;
  value: string;
  onChangeText: (text: string) => void;
  onDismiss: (restoreFocus: boolean) => void;
  placeholder: string;
  label: string;
  compact?: boolean;
}) {
  const inputStyle: TextStyle & WebCssStyle = {
    ...TYPE_SCALE['body-medium'],
    // The mobile field carries `tracking-[-0.015em]`.
    letterSpacing: compact ? -0.21 : 0,
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: palette.text,
    fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
    ...(IS_WEB ? { outlineStyle: 'none' as never } : null),
  };
  return (
    <>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textTertiary}
        autoFocus
        onKeyPress={(event) => {
          if (event.nativeEvent.key === 'Escape') {
            (event as unknown as { preventDefault?: () => void }).preventDefault?.();
            onDismiss(true);
          }
        }}
        style={inputStyle}
        testID="sidebar-search-input"
      />
      <CloseButton
        size="2xs"
        accessibilityLabel="Clear navigation search"
        onPress={() => onDismiss(true)}
        style={{ backgroundColor: palette.tertiaryHover }}
      />
    </>
  );
}

const SidebarPanel: React.FC<SidebarProps> = ({
  items = [],
  secondaryItems = [],
  modes,
  mode,
  onModeChange,
  modesLabel,
  selected,
  onNavigate,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  mobile = false,
  onClose,
  fluid = false,
  flat = false,
  showThemeToggle = true,
  showSearch = true,
  searchShortcutLabel = '⌘L',
  searchShortcut = true,
  searchLabel = 'Quick Search',
  searchPlaceholder,
  noResultsLabel = 'No results',
  logo,
  account,
  team,
  tree,
  selectedTreeItem,
  onTreeItemPress,
  plan,
  style,
  testID,
}) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const reducedMotion = useReducedMotion();

  const [collapsedState, setCollapsed] = useControllableState<boolean>({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  });
  const collapsed = mobile ? false : collapsedState;

  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [suppressUserHover, setSuppressUserHover] = useState(false);
  const searchFieldRef = useRef<View>(null);
  const searchTriggerRef = useRef<View>(null);
  const searchInputRef = useRef<TextInput>(null);
  const normalized = query.trim().toLocaleLowerCase();
  const searchHover = useInteractionState();

  // ---- morph -------------------------------------------------------------
  const progress = useSharedValue(collapsed ? 1 : 0);
  useEffect(() => {
    const target = collapsed ? 1 : 0;
    progress.value = reducedMotion ? target : withTiming(target, { duration: MORPH_MS, easing: EASE_IN_OUT });
  }, [collapsed, reducedMotion, progress]);

  // `fluid` fills its container while expanded; the morph needs a number, so
  // the last expanded width is measured.
  const expandedWidth = useSharedValue(EXPANDED_WIDTH);
  const onPanelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (fluid && !collapsed) expandedWidth.value = event.nativeEvent.layout.width;
    },
    [fluid, collapsed, expandedWidth],
  );
  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    if (fluid && p === 0) return { width: '100%' };
    return { width: expandedWidth.value + (COLLAPSED_WIDTH - expandedWidth.value) * p };
  }, [progress, expandedWidth, fluid]);
  const navInset = useAnimatedStyle(() => {
    const inset = 2 * (1 - progress.value);
    return { paddingLeft: inset, paddingRight: inset };
  }, [progress]);
  const sideBarIconStyle = useAnimatedStyle(
    () => ({ transform: [{ scaleX: progress.value >= 0.5 ? 1 : -1 }] }),
    [progress],
  );

  // ---- search ------------------------------------------------------------
  const activateSearch = useCallback(() => {
    if (!mobile) setCollapsed(false);
    setSearchActive(true);
  }, [mobile, setCollapsed]);

  const deactivateSearch = useCallback((restoreFocus: boolean) => {
    setQuery('');
    setSearchActive(false);
    if (restoreFocus && IS_WEB && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => (searchTriggerRef.current as unknown as HTMLElement | null)?.focus?.());
    }
  }, []);

  // A press anywhere outside the field closes it (web).
  useEffect(() => {
    if (!IS_WEB || !searchActive || typeof document === 'undefined') return;
    const onOutside = (event: MouseEvent) => {
      const node = searchFieldRef.current as unknown as HTMLElement | null;
      if (event.target instanceof Node && node?.contains(event.target)) return;
      deactivateSearch(false);
    };
    // Registered after the click that opened the field has finished bubbling.
    const timer = setTimeout(() => document.addEventListener('click', onOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onOutside);
    };
  }, [searchActive, deactivateSearch]);

  // ⌘L / Ctrl+L opens the search (web).
  useEffect(() => {
    if (!IS_WEB || !showSearch || !searchShortcut || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLocaleLowerCase() === 'l' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        activateSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activateSearch, searchShortcut, showSearch]);

  // ---- rows --------------------------------------------------------------
  const pressFor = useCallback(
    (item: SidebarNavItem) => {
      if (item.onPress) return item.onPress;
      if (onNavigate && item.href != null) return () => onNavigate(item);
      return undefined;
    },
    [onNavigate],
  );

  const shownItems = useMemo(() => items.filter((item) => matchesQuery(item.label, normalized)), [items, normalized]);
  const shownSecondary = useMemo(
    () => secondaryItems.filter((item) => matchesQuery(item.label, normalized)),
    [secondaryItems, normalized],
  );

  const renderRow = (item: SidebarNavItem) => {
    const isSelected = selected === item.key;
    return (
      <SidebarItem
        key={item.key}
        icon={item.icon}
        label={item.label}
        href={item.href}
        selected={isSelected}
        collapsed={collapsed}
        onPress={pressFor(item)}
        testID={`sidebar-item-${item.key}`}
        badge={
          item.badge !== undefined ? (
            <Badge
              content={item.badge}
              style={{ backgroundColor: isSelected ? palette.badgePrimary : palette.badgeNeutral }}
              textStyle={{ color: isSelected ? '#ffffff' : palette.textSecondary }}
            />
          ) : undefined
        }
      />
    );
  };

  // ---- chrome ------------------------------------------------------------
  const chrome: WebCssStyle = flat
    ? { backgroundColor: palette.flat }
    : {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.panelBorder,
        backgroundColor: palette.panel,
        boxShadow: palette.panelShadow,
      };

  const flatMobile = mobile && flat;
  const searchRing = `inset 0 0 0 2px ${palette.searchRing}`;
  const placeholder = searchPlaceholder ?? (flatMobile ? 'Search...' : 'Search navigation…');

  const toggleCollapse = () => {
    const expanding = collapsedState;
    if (!expanding) deactivateSearch(false);
    setCollapsed(!collapsedState);
    setSuppressUserHover(expanding);
  };

  const headerControl = flatMobile ? (
    <View
      ref={searchFieldRef}
      style={{
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: borderRadius.full,
        backgroundColor: palette.tertiary,
        ...(searchActive
          ? { flex: 1, gap: 8, paddingLeft: 8, paddingRight: 10, boxShadow: searchRing }
          : { width: 36, gap: 0, paddingLeft: 8, paddingRight: 8 }),
      }}
    >
      <Pressable
        ref={searchTriggerRef}
        {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
        role="button"
        accessibilityLabel="Search"
        onPress={activateSearch}
        style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <RiSearchLine width={20} height={20} fill={palette.textSecondary} />
      </Pressable>
      {searchActive ? (
        <SearchField
          compact
          palette={palette}
          inputRef={searchInputRef}
          value={query}
          onChangeText={setQuery}
          onDismiss={deactivateSearch}
          placeholder={placeholder}
          label="Filter navigation"
        />
      ) : null}
    </View>
  ) : mobile ? (
    <Pressable
      {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
      role="button"
      accessibilityLabel="Close sidebar"
      onPress={onClose}
      testID="sidebar-close"
    >
      <RiCloseLine width={20} height={20} fill={palette.textSecondary} />
    </Pressable>
  ) : (
    <Pressable
      {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
      role="button"
      accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      onPress={toggleCollapse}
      style={collapsed ? { width: 36, alignItems: 'center', justifyContent: 'center' } : undefined}
      testID="sidebar-collapse"
    >
      <Animated.View style={sideBarIconStyle}>
        <RiSideBarFill width={20} height={20} fill={palette.textSecondary} />
      </Animated.View>
    </Pressable>
  );

  const searchButton = searchActive && !collapsed ? (
    <View
      ref={searchFieldRef}
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: borderRadius.full,
        backgroundColor: palette.tertiary,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 10,
        boxShadow: searchRing,
      }}
      testID="sidebar-search-field"
    >
      <RiSearchLine width={20} height={20} fill={palette.textSecondary} />
      <SearchField
        palette={palette}
        inputRef={searchInputRef}
        value={query}
        onChangeText={setQuery}
        onDismiss={deactivateSearch}
        placeholder={placeholder}
        label="Filter navigation"
      />
    </View>
  ) : (
    <Pressable
      ref={searchTriggerRef}
      {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' }, ...(collapsed ? { title: searchLabel } : null) } : {})}
      role="button"
      accessibilityLabel={searchLabel}
      onPress={activateSearch}
      onHoverIn={searchHover.onIn}
      onHoverOut={searchHover.onOut}
      style={
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 8,
          overflow: 'hidden',
          borderRadius: borderRadius.full,
          backgroundColor: searchHover.state ? palette.searchHover : palette.tertiary,
          '--bloom-sidebar-ring': palette.ring,
        } as WebCssStyle
      }
      testID="sidebar-search"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flex: collapsed ? undefined : 1 }}>
        <RiSearchLine width={20} height={20} fill={palette.textSecondary} />
        <Collapsible collapsed={collapsed}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {searchLabel}
          </Text>
        </Collapsible>
      </View>
      {searchShortcutLabel ? (
        <Collapsible collapsed={collapsed}>
          <Kbd>{searchShortcutLabel}</Kbd>
        </Collapsible>
      ) : null}
    </Pressable>
  );

  // A folder matching the query keeps every row; otherwise only its matching rows.
  const shownFolders = useMemo(
    () =>
      (tree?.folders ?? []).flatMap((folder) => {
        if (!normalized || matchesQuery(folder.label, normalized)) return [folder];
        const matching = folder.items.filter((item) => matchesQuery(item.label, normalized));
        return matching.length ? [{ ...folder, items: matching }] : [];
      }),
    [tree, normalized],
  );
  const nothingMatches =
    shownItems.length === 0 && shownSecondary.length === 0 && shownFolders.length === 0 && !collapsed;
  const hasTree = !!tree;

  const modeSwitcher =
    modes && modes.length > 0 ? (
      <SidebarModeSwitcher
        modes={modes}
        value={mode ?? modes[0]!.key}
        onValueChange={(key) => onModeChange?.(key)}
        collapsed={collapsed}
        accessibilityLabel={modesLabel}
        testID={testID ? `${testID}-modes` : 'sidebar-modes'}
      />
    ) : null;

  const accountMenu = account ? (
    <View
      style={{
        minWidth: 0,
        flexShrink: 1,
        display: flatMobile && searchActive ? 'none' : 'flex',
        maxWidth: 190,
      }}
    >
      <SidebarUserMenu
        account={account}
        collapsed={collapsed}
        suppressHover={suppressUserHover}
        onHoverSuppressionEnd={() => setSuppressUserHover(false)}
        avatarBackground={flat ? palette.avatarFlat : undefined}
        testID="sidebar-account"
      />
    </View>
  ) : null;

  // With a logo the brand leads the header and the account switcher gets its
  // own row under it; collapsed, the mark sits on top of the expand control.
  const headerRow = logo ? (
    <>
      <View
        style={
          collapsed
            ? { width: '100%', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 10 }
            : { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }
        }
      >
        <View style={{ minWidth: 0, flexShrink: 1, display: flatMobile && searchActive ? 'none' : 'flex' }}>
          <SidebarLogoView logo={logo} collapsed={collapsed} testID="sidebar-logo" />
        </View>
        {headerControl}
      </View>
      {accountMenu}
    </>
  ) : (
    <View
      style={
        collapsed
          ? { width: '100%', flexDirection: 'column-reverse', alignItems: 'flex-start', justifyContent: 'center', gap: 10 }
          : { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
      }
    >
      {accountMenu ?? <View />}
      {headerControl}
    </View>
  );

  return (
    <CollapseProvider value={progress}>
      <Animated.View
        role="complementary"
        accessibilityLabel="Sidebar"
        onLayout={onPanelLayout}
        testID={testID}
        style={[
          {
            height: '100%',
            flexShrink: 0,
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: collapsed ? COLLAPSED_PADDING_X : 12,
            paddingRight: collapsed ? COLLAPSED_PADDING_X : 12,
          },
          chrome,
          panelStyle,
          style,
        ]}
      >
        {hasTree ? (
          // With a tree the header and search stay put; only the rows scroll,
          // 24 between the primary rows and the tree section.
          <View style={{ width: '100%', minHeight: 0, flexShrink: 1, gap: 12 }}>
            {headerRow}
            {modeSwitcher}
            {showSearch && !flat ? searchButton : null}
            <ScrollView
              {...(IS_WEB ? { dataSet: { bloomSidebarScroll: 'none' } } : {})}
              style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
              contentContainerStyle={{ gap: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {shownItems.length > 0 ? (
                <View role="navigation" style={{ width: '100%', gap: 4 }}>
                  {shownItems.map(renderRow)}
                </View>
              ) : null}
              {tree && !collapsed && shownFolders.length > 0 ? (
                <View style={{ width: '100%', gap: 10 }}>
                  <Text variant="body-medium" style={{ color: palette.textSecondary }}>
                    {tree.label}
                  </Text>
                  <View role="navigation" accessibilityLabel={tree.label} style={{ width: '100%', gap: 4 }}>
                    {shownFolders.map((folder) => (
                      <SidebarFolder
                        key={folder.key}
                        folder={folder}
                        forceOpen={normalized.length > 0}
                        selectedItem={selectedTreeItem}
                        onItemPress={onTreeItemPress}
                        testID={`sidebar-folder-${folder.key}`}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              {nothingMatches ? (
                <Text variant="body-regular" style={{ paddingLeft: 8, paddingRight: 8, color: palette.textTertiary }}>
                  {noResultsLabel}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        ) : (
        /* The scroller clips on every side, so it is padded out by 8 and pulled
            back with a matching negative margin: the selected row's ring, the
            profile's hover pill and focus rings all land inside the clip. */
        <ScrollView
          style={{ marginTop: -8, marginBottom: -8, marginLeft: -8, marginRight: -8, flexGrow: 0, flexShrink: 1, minHeight: 0 }}
          contentContainerStyle={{ padding: 8, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {headerRow}
          {modeSwitcher}

          <View style={{ width: '100%', gap: 12 }}>
            {showSearch && !flat ? searchButton : null}
            <Animated.View role="navigation" style={[{ width: '100%', gap: 4 }, navInset]}>
              {nothingMatches ? (
                <Text
                  variant="body-regular"
                  style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 12, paddingBottom: 12, color: palette.textTertiary }}
                >
                  {noResultsLabel}
                </Text>
              ) : (
                shownItems.map(renderRow)
              )}
            </Animated.View>
          </View>
        </ScrollView>
        )}

        <View style={{ width: '100%', flexShrink: 0, gap: 12, paddingTop: hasTree ? 12 : 0 }}>
          {showThemeToggle ? (
            collapsed ? (
              <ThemeToggle collapsed />
            ) : (
              <ThemeToggle
                appearance="sidebar-segmented"
                style={flat ? { backgroundColor: palette.panel } : undefined}
              />
            )
          ) : null}
          {shownSecondary.length > 0 ? (
            <View role="navigation" style={{ width: '100%', gap: 4 }}>
              {shownSecondary.map(renderRow)}
            </View>
          ) : null}
          {plan ? (
            <SidebarPlanCard
              plan={plan}
              collapsed={collapsed}
              style={flat && !collapsed ? { backgroundColor: palette.panel } : undefined}
              testID="sidebar-plan"
            />
          ) : team ? (
            <SidebarTeamMenu
              team={team}
              collapsed={collapsed}
              style={flat && !collapsed ? { backgroundColor: palette.panel } : undefined}
              testID="sidebar-team"
            />
          ) : null}
        </View>
      </Animated.View>
    </CollapseProvider>
  );
};

// Two component types, so switching `variant` remounts instead of changing the hook order.
const SidebarComponent: React.FC<SidebarProps> = ({ variant = 'panel', ...props }) =>
  variant === 'rail' ? <SidebarRail {...props} /> : <SidebarPanel {...props} />;

export const Sidebar = memo(SidebarComponent);
Sidebar.displayName = 'Sidebar';
