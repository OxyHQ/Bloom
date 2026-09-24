import React, { cloneElement, isValidElement, useMemo, useState, type ComponentType } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../styles/breakpoints';
import { Screen, ScreenScrollView, useScreen } from '../screen';
import { Sidebar } from '../sidebar';
import { useTheme } from '../theme/use-theme';
import { PageHeader } from '../page-header';
import type { BottomBarProps } from '../bottom-bar/types';
import type { FabProps } from '../fab/types';
import { ResponsiveNavigation } from './ResponsiveNavigation';
import type { AppShellProps, AppShellEngineProps } from './types';
import { createAppShellEngine } from './AppShellEngine';
import { resolveScrollMode } from './layout';
import { AppShellMenuButton } from './AppShellMenuButton';
import { breakpointPx } from './constants';

export function resolveNavigationPlacement(width: number, placement: AppShellProps['navigationPlacement'] = 'auto') {
  return placement === 'auto' ? width < BREAKPOINTS.md ? 'bottom' : width < BREAKPOINTS.lg ? 'rail' : 'sidebar' : placement;
}

/** Platform factory keeps the shared shell free of native material peers. */
export function createAppShell(BottomBar: ComponentType<BottomBarProps>, Fab: ComponentType<FabProps>, ...panelComponents: Parameters<typeof createAppShellEngine>) {
  const AppShellEngine = createAppShellEngine(...panelComponents);
  function NavigationBottom({ navigation = [], value = '', onValueChange, primaryAction, navigationMaterial, bottomActionBehavior, testID }: AppShellProps) {
    const { collapseProgress } = useScreen();
    return <BottomBar actionBehavior={bottomActionBehavior} material={navigationMaterial} items={navigation.map(item => ({ name: item.value, label: item.label, icon: item.icon }))} value={value} onValueChange={onValueChange ?? (() => {})} minimizeProgress={collapseProgress} action={primaryAction ? <Fab {...primaryAction} /> : undefined} testID={testID ? `${testID}-navigation-bottom` : undefined} />;
  }
  function AppShell({ active = true, navigation, navigationPlacement = 'auto', value, onValueChange, sidebar, primaryAction, navigationMaterial, bottomActionBehavior, scroll = 'auto', title, breadcrumb, actions, header, children, contentMaxWidth = 1300, overlay, style, testID }: AppShellProps) {
    const { width: windowWidth } = useWindowDimensions();
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const width = containerWidth ?? windowWidth;
    const { colors } = useTheme();
    const placement = resolveNavigationPlacement(width, navigationPlacement);
    // One navigation model supplies every placement. Existing sidebar data is also accepted.
    const items = navigation ?? sidebar?.items?.map(item => ({ value: item.key, label: item.label, icon: <item.icon /> })) ?? [];
    const sidebarItems = useMemo(() => navigation?.map(item => ({
      key: item.value,
      label: item.label,
      onPress: () => onValueChange?.(item.value),
      icon: (props: { width?: number; height?: number; fill?: string }) =>
        isValidElement<{ width?: number; height?: number; fill?: string }>(item.icon)
          ? cloneElement(item.icon, props)
          : <>{item.icon}</>,
    })), [navigation, onValueChange]);
    const selected = value ?? sidebar?.selected;
    const docked = sidebar?.surface === 'docked';
    const select = (next: string) => {
      if (onValueChange) onValueChange(next);
      else {
        const item = sidebar?.items?.find(candidate => candidate.key === next);
        if (item?.onPress) item.onPress();
        else if (item && sidebar?.onNavigate) sidebar.onNavigate(item);
        else if (item?.href && typeof window !== 'undefined') window.location.assign(item.href);
      }
    };
    const shellProps = { navigation: items, value: selected, onValueChange: select, primaryAction, navigationMaterial, bottomActionBehavior, testID };
    const bottom = placement === 'bottom' && (items.length > 0 || primaryAction) ? <NavigationBottom {...shellProps} /> : undefined;
    return <View onLayout={event => setContainerWidth(event.nativeEvent.layout.width)} testID={testID} style={[{ flex: 1, minHeight: 0, flexDirection: 'row', backgroundColor: colors.background }, style]}>
      {placement !== 'bottom' && (sidebar || navigation) ? (
        <ResponsiveNavigation
          placement={placement}
          testID={testID ? `${testID}-navigation-${placement}` : undefined}
          style={{
            flexShrink: 0,
            minHeight: 0,
            paddingTop: docked ? 0 : 12,
            paddingBottom: docked ? 0 : 12,
            paddingLeft: docked ? 0 : 12,
            paddingRight: docked ? 0 : 12,
            gap: 12,
          }}
        >
          {shownPlacement => <Sidebar
            {...(navigation ? { showSearch: false, showThemeToggle: false } : {})}
            {...sidebar}
            variant={shownPlacement === 'rail' ? 'rail' : 'panel'}
            items={sidebarItems ?? sidebar?.items}
            selected={selected}
            onNavigate={item => onValueChange ? onValueChange(item.key) : sidebar?.onNavigate?.(item)}
            testID={testID ? `${testID}-sidebar` : sidebar?.testID}
            style={[{ flex: 1, minHeight: 0, height: undefined }, sidebar?.style]}
          />}
        </ResponsiveNavigation>
      ) : null}
      <Screen navigationScope="shared" active={active} documentScroll={scroll === 'external'} testID={testID ? `${testID}-screen` : undefined} style={{ minWidth: 0 }} header={header ?? (title ? <PageHeader title={title} subtitle={breadcrumb} actions={actions} sticky={false} /> : null)} bottomBar={bottom} primaryAction={placement !== 'bottom' && primaryAction ? <Fab {...primaryAction} /> : undefined}>
        {scroll === 'auto' ? <ScreenScrollView style={{ flex: 1 }}>
          <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', padding: 16, gap: 16 }}>{children}</View>
        </ScreenScrollView> : children}
        {overlay}
      </Screen>
    </View>;
  }
  /** Translate navigation convenience props into the one document/layout engine. */
  function EngineNavigationShell(props: AppShellProps) {
    const { navigation, navigationPlacement = 'auto', value, onValueChange, sidebar, primaryAction,
      navigationMaterial, bottomActionBehavior, active = true, scroll = 'document', testID } = props;
    const window = useWindowDimensions();
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
    const width = measuredWidth ?? window.width;
    const navFrom = props.navFrom ?? (navigationPlacement === 'bottom' ? Number.MAX_SAFE_INTEGER : navigationPlacement === 'auto' ? 'md' : 0);
    const navExpandedFrom = props.navExpandedFrom ?? (navigationPlacement === 'auto' ? 'lg' : undefined);
    const placement = width < breakpointPx(navFrom) ? 'bottom'
      : navExpandedFrom !== undefined ? width < breakpointPx(navExpandedFrom) ? 'rail' : 'sidebar'
        : navigationPlacement === 'rail' ? 'rail' : 'sidebar';
    const items = navigation ?? sidebar?.items?.map(item => ({ value: item.key, label: item.label, icon: <item.icon /> })) ?? [];
    const select = (next: string) => {
      if (onValueChange) onValueChange(next);
      else {
        const item = sidebar?.items?.find(candidate => candidate.key === next);
        if (item?.onPress) item.onPress();
        else if (item && sidebar?.onNavigate) sidebar.onNavigate(item);
        else if (item?.href && typeof globalThis.window !== 'undefined') globalThis.window.location.assign(item.href);
      }
    };
    const mappedItems = useMemo(() => navigation?.map(item => ({
      key: item.value, label: item.label, onPress: () => onValueChange?.(item.value),
      icon: (iconProps: { width?: number; height?: number; fill?: string }) =>
        isValidElement<{ width?: number; height?: number; fill?: string }>(item.icon)
          ? cloneElement(item.icon, iconProps) : <>{item.icon}</>,
    })), [navigation, onValueChange]);
    const hasNavigation = items.length > 0 && props.variant !== 'focus';
    const compact = placement === 'bottom';
    const engineScroll = scroll === 'auto' ? 'container' : scroll === 'external' ? 'fixed' : scroll;
    const document = resolveScrollMode(props.variant ?? 'dashboard', engineScroll) === 'document';
    const bottom = compact && hasNavigation ? <NavigationBottom navigation={items} value={value ?? sidebar?.selected}
      onValueChange={select} primaryAction={primaryAction} navigationMaterial={navigationMaterial}
      bottomActionBehavior={bottomActionBehavior} testID={testID} /> : undefined;
    const mappedSidebar = props.variant !== 'focus' && (sidebar || navigation) ? { ...(navigation ? { showSearch: false, showThemeToggle: false } : {}), ...sidebar, items: mappedItems ?? sidebar?.items,
      selected: value ?? sidebar?.selected,
      onNavigate: (item: NonNullable<NonNullable<AppShellProps['sidebar']>['items']>[number]) => select(item.key),
      variant: placement === 'rail' ? 'rail' as const : sidebar?.variant,
    } : undefined;
    return <Screen active={active} navigationScope="shared" documentScroll={document}
      testID={testID ? `${testID}-screen` : undefined}
      onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}>
      <AppShellEngine {...props as AppShellEngineProps} scroll={engineScroll}
        sidebar={mappedSidebar}
        navFrom={navFrom}
        navExpandedFrom={navExpandedFrom}
        header={props.header !== undefined ? props.header : props.title ? <PageHeader title={props.title}
          subtitle={props.breadcrumb} actions={props.actions} leading={<AppShellMenuButton accessibilityLabel={props.drawerOpenLabel} />} /> : undefined}
        bottomBar={props.bottomBar !== undefined ? props.bottomBar : bottom}
        bottomBarVisibility={props.bottomBarVisibility ?? 'compact'}
        floatingAction={props.floatingAction !== undefined ? props.floatingAction : (primaryAction && (!compact || !hasNavigation || props.bottomBar !== undefined) ? <Fab {...primaryAction} /> : undefined)}
      />
    </Screen>;
  }
  const AdaptiveAppShell = AppShell;
  function ComposedAppShell(props: AppShellProps) {
    const adaptive = props.navigation !== undefined || props.navigationPlacement !== undefined
      || props.primaryAction !== undefined || props.scroll === 'auto' || props.scroll === 'external';
    if (!adaptive) return <AppShellEngine {...props as AppShellEngineProps} />;
    const scroll = props.scroll ?? (Platform.OS === 'web' ? 'document' : 'auto');
    const usesLayout = props.panel !== undefined || props.panelColorPreset !== undefined || props.variant !== undefined || props.aside !== undefined || props.list !== undefined || props.info !== undefined
      || props.contentWidth !== undefined || props.navigationAlign !== undefined || props.navigationGap !== undefined || props.drawer !== undefined
      || props.navFrom !== undefined || props.navExpandedFrom !== undefined || props.topBar !== undefined
      || props.bottomBar !== undefined || props.floatingAction !== undefined;
    return (scroll === 'auto' || scroll === 'external') && !usesLayout
      ? <AdaptiveAppShell {...props} scroll={scroll} />
      : <EngineNavigationShell {...props} scroll={scroll} />;
  }
  ComposedAppShell.displayName = 'AppShell';
  return ComposedAppShell;
}
