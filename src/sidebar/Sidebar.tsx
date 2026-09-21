import { useBloomAppearance } from '../appearance';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
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
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiSideBarFill } from '../icons/remix/RiSideBarFill';
import { Kbd } from '../kbd';
import { borderRadius } from '../styles/tokens';
import { Z_INDEX } from '../styles/z-index';
import type { WebCssStyle } from '../styles/web-view-style';
import { ThemeToggle } from '../theme-toggle';
import { Text, TYPE_SCALE } from '../typography';
import { resolveSidebarGeometry, SidebarGeometryProvider } from './geometry';
import { SidebarSizeProvider, SIDEBAR_METRICS } from './metrics';
import { useSidebarPalette, type SidebarPalette } from './palette';
import { Collapsible, CollapseProvider, IS_WEB, MORPH_MS, useSidebarWebCss } from './parts';
import { SidebarFolder } from './SidebarFolder';
import { SidebarItem } from './SidebarItem';
import { SidebarModeSwitcher } from './SidebarModeSwitcher';
import { SidebarPlanCard } from './SidebarPlanCard';
import { SidebarPrimaryAction } from './SidebarPrimaryAction';
import { SidebarRail } from './SidebarRail';
import { SidebarScrollArea } from './SidebarScrollArea';
import { SidebarTeamMenu } from './SidebarTeamMenu';
import { SidebarLogoView } from './SidebarLogoView';
import { SidebarUserMenu } from './SidebarUserMenu';
import type { SidebarNavItem, SidebarProps } from './types';

/**
 * `Sidebar` — the floating app rail, expanded or collapsed.
 *
 *   panel      `size` wide expanded (p12), its collapsed width at px7 py12 —
 *              with the 1px border that leaves exactly the size's item column
 *              (`metrics.ts`; `md` is the historical 260 / 52 / 36)
 *   surface    `card` radius 24, 1px border-button-white, shadow-sidebar,
 *              background-secondary; `plain` drops the chrome onto
 *              background-full; `docked` keeps the fill, squares the corners
 *              and leaves one hairline on the inner edge, full height
 *   top        fixed account/logo + collapse control, modes and quick search,
 *              gap 12; destinations alone scroll below (px2 expanded, gap 4).
 *              The viewport overlaps half the last control, at most 20px,
 *              with matching content padding and 8px side room for rings.
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);

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
        size="xs"
        accessibilityLabel="Clear navigation search"
        onPress={() => onDismiss(true)}
        style={{ backgroundColor: palette.tertiaryHover }}
      />
    </>
  );
}

const SidebarPanel: React.FC<SidebarProps> = ({
  items = [],
  primaryAction,
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
  surface = 'card',
  size: sizeProp,
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
  const canonicalSize = sizeProp === 'small' ? 'sm' : sizeProp === 'medium' ? 'md' : sizeProp === 'large' ? 'lg' : sizeProp;
  const {size: scopedSize} = useBloomAppearance({size: canonicalSize}, {size: 'md', tone: 'neutral'});
  const size = scopedSize === 'xs' ? 'sm' : scopedSize;
  const metrics = SIDEBAR_METRICS[size];
  useSidebarWebCss();
  const reducedMotion = useReducedMotion();

  const [collapsedState, setCollapsed] = useControllableState<boolean>({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  });
  const collapsed = mobile ? false : collapsedState;

  const [searchActive, setSearchActive] = useState(false);
  const [headerOverlap, setHeaderOverlap] = useState(10);
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

  const searchGapStyle = useAnimatedStyle(() => ({ gap: 8 * (1 - progress.value) }), [progress]);

  // `fluid` fills its container while expanded; the morph needs a number, so
  // the last expanded width is measured. The collapsed end is the size's own.
  const geometry = useMemo(() => resolveSidebarGeometry(metrics, surface, Boolean(primaryAction), Boolean(tree)), [metrics, surface, primaryAction, tree]);
  const { collapsedWidth, collapsedLane, expandedInset } = geometry;
  const expandedWidth = useSharedValue(metrics.expanded);
  useEffect(() => {
    if (!fluid) expandedWidth.value = metrics.expanded;
  }, [fluid, metrics.expanded, expandedWidth]);
  const onPanelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (fluid && !collapsed && progress.value === 0) expandedWidth.value = event.nativeEvent.layout.width;
    },
    [fluid, collapsed, expandedWidth, progress],
  );
  const expandedPadding = metrics.padding;
  const collapsedPadding = metrics.collapsedPaddingX;
  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const padding = expandedPadding + (collapsedPadding - expandedPadding) * p;
    return {
      width: fluid && p === 0 ? '100%' : expandedWidth.value + (collapsedWidth - expandedWidth.value) * p,
      paddingLeft: padding, paddingRight: padding,
    };
  }, [progress, expandedWidth, fluid, collapsedWidth, expandedPadding, collapsedPadding]);
  const navInset = useAnimatedStyle(() => {
    const inset = expandedInset * (1 - progress.value);
    return { paddingLeft: inset, paddingRight: inset };
  }, [progress, expandedInset]);
  const searchInset = useAnimatedStyle(() => {
    const start = metrics.row.padding + expandedInset;
    const end = metrics.row.padding;
    const padding = start + (end - start) * progress.value;
    return { paddingLeft: padding, paddingRight: padding, marginLeft: (collapsedLane - metrics.row.square) / 2 * progress.value, marginRight: (collapsedLane - metrics.row.square) / 2 * progress.value };
  }, [progress, metrics.row.square, metrics.row.padding, metrics.row.icon, expandedInset, collapsedLane]);
  const sideBarIconStyle = useAnimatedStyle(
    () => ({ transform: [{ scaleX: 2 * progress.value - 1 }] }),
    [progress],
  );

  const hasLogo = !!logo;
  const hasAccount = !!account;
  const headerGeometry = useAnimatedStyle(() => ({
    height: hasLogo ? 36 + 30 * progress.value : hasAccount ? 32 + 30 * progress.value : 20,
  }), [progress, hasLogo, hasAccount]);
  const headerIdentityGeometry = useAnimatedStyle(() => ({
    top: hasLogo ? 0 : 30 * progress.value,
    right: (hasLogo ? 28 : 20) * (1 - progress.value),
  }), [progress, hasLogo]);
  const headerControlGeometry = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      left: `${100 * (1 - p)}%` as `${number}%`,
      width: 20 + (collapsedLane - 20) * p,
      top: hasLogo ? 8 + 38 * p : hasAccount ? 6 * (1 - p) : 0,
      transform: [{ translateX: -20 * (1 - p) }],
    };
  }, [progress, hasLogo, hasAccount, collapsedLane]);
  const themeGeometry = useAnimatedStyle(() => ({ height: 40 - 4 * progress.value }), [progress]);
  const themeExpandedStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }), [progress]);
  const themeCollapsedStyle = useAnimatedStyle(() => ({ opacity: progress.value }), [progress]);

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
              textStyle={{ color: isSelected ? palette.badgePrimaryForeground : palette.textSecondary }}
            />
          ) : undefined
        }
      />
    );
  };

  // ---- chrome ------------------------------------------------------------
  // Three surfaces, one place. `docked` keeps the panel fill and spends its
  // edge on ONE hairline — the side facing the content — because a column
  // flush to the window has no other edge to draw: a border all the way round
  // would draw two lines nobody can see and one they can.
  const chrome: WebCssStyle =
    surface === 'plain'
      ? { backgroundColor: palette.flat }
      : surface === 'docked'
        ? {
            backgroundColor: palette.panel,
            borderRightWidth: 1,
            borderRightColor: palette.dockedEdge,
          }
        : {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.panelBorder,
            backgroundColor: palette.panel,
            boxShadow: palette.panelShadow,
          };

  const plain = surface === 'plain';
  const flatMobile = mobile && plain;
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
      style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
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
    <AnimatedPressable
      ref={searchTriggerRef}
      {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' }, ...(collapsed ? { title: searchLabel } : null) } : {})}
      role="button"
      accessibilityLabel={searchLabel}
      onPress={activateSearch}
      onHoverIn={searchHover.onIn}
      onHoverOut={searchHover.onOut}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: metrics.row.square,
          paddingTop: metrics.row.padding,
          paddingBottom: metrics.row.padding,
          overflow: 'hidden',
          borderRadius: borderRadius.full,
          backgroundColor: searchHover.state ? palette.searchHover : palette.tertiary,
          '--bloom-sidebar-ring': palette.ring,
        } as WebCssStyle, searchGapStyle, searchInset,
      ]}
      testID="sidebar-search"
    >
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', minWidth: 0, flex: 1 }, searchGapStyle]}>
        <View style={{ flexShrink: 0 }}>
          <RiSearchLine width={metrics.row.icon} height={metrics.row.icon} fill={palette.textSecondary} />
        </View>
        <Collapsible collapsed={collapsed}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {searchLabel}
          </Text>
        </Collapsible>
      </Animated.View>
      {searchShortcutLabel ? (
        <Collapsible collapsed={collapsed}>
          <Kbd>{searchShortcutLabel}</Kbd>
        </Collapsible>
      ) : null}
    </AnimatedPressable>
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

  // A fresh closure here would re-render the memoised switcher on every
  // keystroke in the quick-search field.
  const handleModeChange = useCallback((key: string) => onModeChange?.(key), [onModeChange]);

  const modeSwitcher =
    modes && modes.length > 0 ? (
      <SidebarModeSwitcher
        modes={modes}
        value={mode ?? modes[0]!.key}
        onValueChange={handleModeChange}
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
        avatarBackground={plain ? palette.avatarFlat : undefined}
        testID="sidebar-account"
      />
    </View>
  ) : null;

  // Keep the same children mounted while the header changes from a row to a
  // column. Numeric positions share the panel clock, including reversals.
  const headerRow = mobile ? (
    <>
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {logo ? <View style={{ minWidth: 0, flexShrink: 1, display: flatMobile && searchActive ? 'none' : 'flex' }}>
          <SidebarLogoView logo={logo} collapsed={false} testID="sidebar-logo" />
        </View> : accountMenu ?? <View />}
        {headerControl}
      </View>
      {logo ? accountMenu : null}
    </>
  ) : (
    <>
      <Animated.View testID="sidebar-header" style={[{ width: '100%', position: 'relative' }, headerGeometry]}>
        {logo || account ? <Animated.View style={[{ position: 'absolute', left: 0, minWidth: 0 }, headerIdentityGeometry]}>
          {logo ? <SidebarLogoView logo={logo} collapsed={collapsed} testID="sidebar-logo" /> : accountMenu}
        </Animated.View> : null}
        <Animated.View testID="sidebar-header-control" style={[{ position: 'absolute', height: 20 }, headerControlGeometry]}>
          {headerControl}
        </Animated.View>
      </Animated.View>
      {logo ? accountMenu : null}
    </>
  );

  return (
    <SidebarSizeProvider value={size}>
    <SidebarGeometryProvider value={geometry}>
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
            paddingTop: metrics.padding,
            paddingBottom: metrics.padding,
          },
          chrome,
          panelStyle,
          style,
        ]}
      >
        <View style={{ width: '100%', minHeight: 0, flexShrink: 1 }}>
          {/* Fixed chrome shares the panel's morph, never the destination scroll.
              The viewport reaches half a control behind it, so rows dissolve
              before reaching the controls while the first row retains its gap. */}
          <View
            testID={`${testID ?? 'sidebar'}-fixed-header`}
            pointerEvents="box-none"
            onLayout={(event) => setHeaderOverlap(Math.min(20, event.nativeEvent.layout.height / 2))}
            style={{ width: '100%', flexShrink: 0, gap: 12, zIndex: Z_INDEX.floating }}
          >
            {headerRow}
            {modeSwitcher}
            {showSearch && !flatMobile ? searchButton : null}
          </View>
          <SidebarScrollArea
            fadeColor={plain ? palette.flat : palette.panel}
            testID={`${testID ?? 'sidebar'}-scroll`}
            {...(IS_WEB ? { dataSet: { bloomSidebarScroll: 'none' } } : {})}
            style={{ marginTop: -headerOverlap, marginBottom: -8, marginLeft: -8, marginRight: -8, flexGrow: 0, flexShrink: 1, minHeight: 0 }}
            contentContainerStyle={{ paddingTop: headerOverlap + 12, paddingBottom: 8, paddingLeft: 8, paddingRight: 8, gap: hasTree ? 24 : 0 }}
            showsVerticalScrollIndicator={false}
          >
            {shownItems.length > 0 || !hasTree ? (
              <Animated.View role="navigation" style={[{ width: '100%', gap: 4 }, !hasTree && navInset]}>
                {nothingMatches && !hasTree ? (
                  <Text variant="body-regular" style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 12, paddingBottom: 12, color: palette.textTertiary }}>
                    {noResultsLabel}
                  </Text>
                ) : shownItems.map(renderRow)}
              </Animated.View>
            ) : null}
            {tree && !collapsed && shownFolders.length > 0 ? (
              <View style={{ width: '100%', gap: 10 }}>
                <Text variant="body-medium" style={{ color: palette.textSecondary }}>{tree.label}</Text>
                <View role="navigation" accessibilityLabel={tree.label} style={{ width: '100%', gap: 4 }}>
                  {shownFolders.map((folder) => (
                    <SidebarFolder key={folder.key} folder={folder} forceOpen={normalized.length > 0}
                      selectedItem={selectedTreeItem} onItemPress={onTreeItemPress} testID={`sidebar-folder-${folder.key}`} />
                  ))}
                </View>
              </View>
            ) : null}
            {nothingMatches && hasTree ? (
              <Text variant="body-regular" style={{ paddingLeft: 8, paddingRight: 8, color: palette.textTertiary }}>{noResultsLabel}</Text>
            ) : null}
          </SidebarScrollArea>
          {primaryAction ? <SidebarPrimaryAction action={primaryAction} collapsed={collapsed} testID={testID ? `${testID}-primary-action` : undefined} /> : null}
        </View>

        <View style={{ width: '100%', flexShrink: 0, gap: 12, paddingTop: hasTree ? 12 : 0 }}>
          {showThemeToggle ? (
            <Animated.View testID="sidebar-theme-morph" style={[{ position: 'relative', overflow: 'hidden' }, themeGeometry]}>
              <Animated.View pointerEvents={collapsed ? 'none' : 'auto'} aria-hidden={collapsed} accessibilityElementsHidden={collapsed} importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
                {...(IS_WEB && collapsed ? { inert: true } : {})}
                style={[{ position: 'absolute', left: 0, top: 0 }, themeExpandedStyle]}>
                <ThemeToggle variant="sidebar-segmented" style={plain ? { backgroundColor: palette.panel } : undefined} />
              </Animated.View>
              <Animated.View pointerEvents={collapsed ? 'auto' : 'none'} aria-hidden={!collapsed} accessibilityElementsHidden={!collapsed} importantForAccessibility={collapsed ? 'auto' : 'no-hide-descendants'}
                {...(IS_WEB && !collapsed ? { inert: true } : {})}
                style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, themeCollapsedStyle]}>
                <ThemeToggle collapsed style={{ alignSelf: 'center' }} />
              </Animated.View>
            </Animated.View>
          ) : null}
          {shownSecondary.length > 0 ? (
            <Animated.View role="navigation" style={[{ width: '100%', gap: 4 }, navInset]}>
              {shownSecondary.map(renderRow)}
            </Animated.View>
          ) : null}
          {plan ? (
            <SidebarPlanCard
              plan={plan}
              collapsed={collapsed}
              style={plain ? { backgroundColor: palette.panel } : undefined}
              testID="sidebar-plan"
            />
          ) : team ? (
            <SidebarTeamMenu
              team={team}
              collapsed={collapsed}
              style={plain ? { backgroundColor: palette.panel } : undefined}
              testID="sidebar-team"
            />
          ) : null}
        </View>
      </Animated.View>
    </CollapseProvider>
    </SidebarGeometryProvider>
    </SidebarSizeProvider>
  );
};

// Two component types, so switching `variant` remounts instead of changing the hook order.
const SidebarComponent: React.FC<SidebarProps> = ({ variant = 'panel', ...props }) =>
  variant === 'rail' ? <SidebarRail {...props} /> : <SidebarPanel {...props} />;

export const Sidebar = memo(SidebarComponent);
Sidebar.displayName = 'Sidebar';
