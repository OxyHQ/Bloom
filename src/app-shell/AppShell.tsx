import React, {
  cloneElement,
  isValidElement,
  useMemo,
  useState,
  useId,
  type ComponentType,
} from 'react';
import { Platform, View } from 'react-native';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useScreen } from '../screen/context';
import type { ScreenComponents } from '../screen/types';
import { SidebarSlot } from './SidebarSlot';
import { useAppShellSidebarMetrics } from './use-sidebar-metrics';
import { APP_SHELL_DEFAULTS } from './constants';
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
import type { PanelLayoutViewProps } from './AppShellPanelLayout';
import { panelEnvelope } from './panel-layout';
import { useShellWidth } from './use-shell-width';
import { useShellLayoutReady, useShellViewport } from './use-shell-viewport';
import { PanelCssContext, PanelCssLayoutContext, panelCssScope } from './panel-layout-css';
import type { WebCssStyle } from '../styles/web-view-style';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import { ShellColorClaimContext } from './context';
import { useColorClaims } from './use-color-claims';

export function resolveNavigationPlacement(
  width: number,
  placement: AppShellProps['navigationPlacement'] = 'auto',
) {
  return placement === 'auto'
    ? width < BREAKPOINTS.md
      ? 'bottom'
      : width < BREAKPOINTS.lg
        ? 'rail'
        : 'sidebar'
    : placement;
}

/** Platform factory keeps the shared shell free of native material peers. */
export function createAppShell(
  BottomBar: ComponentType<BottomBarProps>,
  Fab: ComponentType<FabProps>,
  { Screen, ScreenScrollView }: ScreenComponents,
  PanelLayoutView?: ComponentType<PanelLayoutViewProps>,
  ColorScope?: ComponentType<Pick<BloomColorScopeProps, 'colorPreset' | 'asChild' | 'children'>>,
) {
  const AppShellEngine = createAppShellEngine();
  function NavigationBottom({
    navigation = [],
    value = '',
    onValueChange,
    primaryAction,
    bottomActionBehavior,
    testID,
  }: AppShellProps) {
    const { collapseProgress } = useScreen();
    return (
      <BottomBar
        actionBehavior={bottomActionBehavior}
        items={navigation.map((item) => ({ name: item.value, label: item.label, icon: item.icon }))}
        value={value}
        onValueChange={onValueChange ?? (() => {})}
        minimizeProgress={collapseProgress}
        action={primaryAction ? <Fab {...primaryAction} /> : undefined}
        testID={testID ? `${testID}-navigation-bottom` : undefined}
      />
    );
  }
  function AppShell({
    active = true,
    navigation,
    navigationPlacement = 'auto',
    value,
    onValueChange,
    sidebar,
    primaryAction,
    bottomActionBehavior,
    scroll = 'auto',
    title,
    breadcrumb,
    actions,
    header,
    children,
    contentMaxWidth = 1300,
    overlay,
    style,
    testID,
  }: AppShellProps) {
    const { width: windowWidth } = useShellViewport();
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const width = containerWidth ?? windowWidth;
    const { colors } = useTheme();
    const placement = resolveNavigationPlacement(width, navigationPlacement);
    const sidebarMetrics = useAppShellSidebarMetrics(sidebar);
    const [userCollapsed, setUserCollapsed] = useState(sidebar?.defaultCollapsed ?? false);
    const navigationPadding = APP_SHELL_DEFAULTS.dashboardGutter;
    const contentPadding = APP_SHELL_DEFAULTS.gutter;
    const capacityCollapsed =
      width <
      sidebarMetrics.expanded +
        APP_SHELL_DEFAULTS.contentWidth +
        navigationPadding * 2 +
        contentPadding * 2;

    // One navigation model supplies every placement. Existing sidebar data is also accepted.
    const items =
      navigation ??
      sidebar?.items?.map((item) => ({
        value: item.key,
        label: item.label,
        icon: <item.icon />,
      })) ??
      [];
    const sidebarItems = useMemo(
      () =>
        navigation?.map((item) => ({
          key: item.value,
          label: item.label,
          onPress: () => onValueChange?.(item.value),
          icon: (props: { width?: number; height?: number; fill?: string }) =>
            isValidElement<{ width?: number; height?: number; fill?: string }>(item.icon) ? (
              cloneElement(item.icon, props)
            ) : (
              <>{item.icon}</>
            ),
        })),
      [navigation, onValueChange],
    );
    const selected = value ?? sidebar?.selected;
    const docked = sidebar?.surface === 'docked';
    const select = (next: string) => {
      if (onValueChange) onValueChange(next);
      else {
        const item = sidebar?.items?.find((candidate) => candidate.key === next);
        if (item?.onPress) item.onPress();
        else if (item && sidebar?.onNavigate) sidebar.onNavigate(item);
        else if (item?.href && typeof window !== 'undefined') window.location.assign(item.href);
      }
    };
    const shellProps = {
      navigation: items,
      value: selected,
      onValueChange: select,
      primaryAction,
      bottomActionBehavior,
      testID,
    };
    const bottom =
      placement === 'bottom' && (items.length > 0 || primaryAction) ? (
        <NavigationBottom {...shellProps} />
      ) : undefined;
    return (
      <View
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
        testID={testID}
        style={[
          { flex: 1, minHeight: 0, flexDirection: 'row', backgroundColor: colors.background },
          style,
        ]}
      >
        {placement !== 'bottom' && (sidebar || navigation) ? (
          <ResponsiveNavigation
            placement={placement}
            testID={testID ? `${testID}-navigation-${placement}` : undefined}
            style={{
              flexShrink: 0,
              minHeight: 0,
              paddingTop: docked ? 0 : 12,
              paddingBottom: docked ? 0 : 12,
              paddingLeft: docked ? 0 : navigationPadding,
              paddingRight: docked ? 0 : navigationPadding,
              gap: 12,
            }}
          >
            {(shownPlacement) => (
              <SidebarSlot
                {...(navigation ? { showSearch: false, showThemeToggle: false } : {})}
                {...sidebar}
                variant={shownPlacement === 'rail' ? 'rail' : 'panel'}
                collapsed={sidebar?.collapsed ?? (capacityCollapsed || userCollapsed)}
                collapseDisabled={
                  sidebar?.collapseDisabled ??
                  (sidebar?.collapsed === undefined && capacityCollapsed)
                }
                onCollapsedChange={(collapsed) => {
                  setUserCollapsed(collapsed);
                  sidebar?.onCollapsedChange?.(collapsed);
                }}
                items={sidebarItems ?? sidebar?.items}
                selected={selected}
                onNavigate={(item) =>
                  onValueChange ? onValueChange(item.key) : sidebar?.onNavigate?.(item)
                }
                testID={testID ? `${testID}-sidebar` : sidebar?.testID}
                style={[{ flex: 1, minHeight: 0, height: undefined }, sidebar?.style]}
              />
            )}
          </ResponsiveNavigation>
        ) : null}
        <Screen
          navigationScope="shared"
          active={active}
          documentScroll={scroll === 'external'}
          testID={testID ? `${testID}-screen` : undefined}
          style={{ minWidth: 0 }}
          header={
            header ??
            (title ? (
              <PageHeader title={title} subtitle={breadcrumb} actions={actions} sticky={false} />
            ) : null)
          }
          bottomBar={bottom}
          primaryAction={
            placement !== 'bottom' && primaryAction ? <Fab {...primaryAction} /> : undefined
          }
        >
          {scroll === 'auto' ? (
            <ScreenScrollView style={{ flex: 1 }}>
              <View
                testID={testID ? `${testID}-content` : undefined}
                style={{
                  width: '100%',
                  maxWidth: contentMaxWidth === 'none' ? undefined : contentMaxWidth,
                  alignSelf: 'center',
                  padding: contentPadding,
                  gap: 16,
                }}
              >
                {children}
              </View>
            </ScreenScrollView>
          ) : (
            children
          )}
          {overlay}
        </Screen>
      </View>
    );
  }
  /** Translate navigation convenience props into the one document/layout engine. */
  function EngineNavigationShell(props: AppShellProps) {
    const {
      navigation,
      navigationPlacement = 'auto',
      value,
      onValueChange,
      sidebar,
      primaryAction,
      bottomActionBehavior,
      active = true,
      scroll = 'document',
      testID,
    } = props;
    const window = useShellViewport();
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
    const width = measuredWidth ?? window.width;
    const navFrom =
      props.navFrom ??
      (navigationPlacement === 'bottom'
        ? Number.MAX_SAFE_INTEGER
        : navigationPlacement === 'auto'
          ? 'md'
          : 0);
    const navExpandedFrom =
      props.navExpandedFrom ?? (navigationPlacement === 'auto' ? 'lg' : undefined);
    const placement =
      width < breakpointPx(navFrom)
        ? 'bottom'
        : navExpandedFrom !== undefined
          ? width < breakpointPx(navExpandedFrom)
            ? 'rail'
            : 'sidebar'
          : navigationPlacement === 'rail'
            ? 'rail'
            : 'sidebar';
    const items =
      navigation ??
      sidebar?.items?.map((item) => ({
        value: item.key,
        label: item.label,
        icon: <item.icon />,
      })) ??
      [];
    const select = (next: string) => {
      if (onValueChange) onValueChange(next);
      else {
        const item = sidebar?.items?.find((candidate) => candidate.key === next);
        if (item?.onPress) item.onPress();
        else if (item && sidebar?.onNavigate) sidebar.onNavigate(item);
        else if (item?.href && typeof globalThis.window !== 'undefined')
          globalThis.window.location.assign(item.href);
      }
    };
    const mappedItems = useMemo(
      () =>
        navigation?.map((item) => ({
          key: item.value,
          label: item.label,
          onPress: () => onValueChange?.(item.value),
          icon: (iconProps: { width?: number; height?: number; fill?: string }) =>
            isValidElement<{ width?: number; height?: number; fill?: string }>(item.icon) ? (
              cloneElement(item.icon, iconProps)
            ) : (
              <>{item.icon}</>
            ),
        })),
      [navigation, onValueChange],
    );
    const hasNavigation = items.length > 0 && props.variant !== 'focus';
    const compact = placement === 'bottom';
    const engineScroll = scroll === 'auto' ? 'container' : scroll === 'external' ? 'fixed' : scroll;
    const document = resolveScrollMode(props.variant ?? 'dashboard', engineScroll) === 'document';
    const bottom =
      compact && hasNavigation ? (
        <NavigationBottom
          navigation={items}
          value={value ?? sidebar?.selected}
          onValueChange={select}
          primaryAction={primaryAction}
          bottomActionBehavior={bottomActionBehavior}
          testID={testID}
        />
      ) : undefined;
    const mappedSidebar =
      props.variant !== 'focus' && (sidebar || navigation)
        ? {
            ...(navigation ? { showSearch: false, showThemeToggle: false } : {}),
            ...sidebar,
            items: mappedItems ?? sidebar?.items,
            selected: value ?? sidebar?.selected,
            onNavigate: (
              item: NonNullable<NonNullable<AppShellProps['sidebar']>['items']>[number],
            ) => select(item.key),
            variant: placement === 'rail' ? ('rail' as const) : sidebar?.variant,
          }
        : undefined;
    return (
      <Screen
        active={active}
        navigationScope="shared"
        documentScroll={document}
        testID={testID ? `${testID}-screen` : undefined}
        onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      >
        <AppShellEngine
          {...(props as AppShellEngineProps)}
          scroll={engineScroll}
          sidebar={mappedSidebar}
          navFrom={navFrom}
          navExpandedFrom={navExpandedFrom}
          header={
            props.header !== undefined ? (
              props.header
            ) : props.title ? (
              <PageHeader
                title={props.title}
                subtitle={props.breadcrumb}
                actions={props.actions}
                leading={<AppShellMenuButton accessibilityLabel={props.drawerOpenLabel} />}
              />
            ) : undefined
          }
          bottomBar={props.bottomBar !== undefined ? props.bottomBar : bottom}
          bottomBarVisibility={props.bottomBarVisibility ?? 'compact'}
          floatingAction={
            props.floatingAction !== undefined ? (
              props.floatingAction
            ) : primaryAction && (!compact || !hasNavigation || props.bottomBar !== undefined) ? (
              <Fab {...primaryAction} />
            ) : undefined
          }
        />
      </Screen>
    );
  }
  const AdaptiveAppShell = AppShell;
  function ModularAppShell(props: AppShellProps) {
    const { width, onLayout } = useShellWidth();
    const scope = panelCssScope(useId());
    const layoutReady = useShellLayoutReady();
    const cssLayout =
      layoutReady &&
      Platform.OS === 'web' &&
      typeof CSS !== 'undefined' &&
      CSS.supports?.('container-type', 'inline-size');
    const layout = props.panelLayout!;
    const gap =
      layout.gap ??
      (layout.appearance === 'joined' ? 1 : (props.gutter ?? APP_SHELL_DEFAULTS.gutter));
    const envelope = panelEnvelope(layout, cssLayout ? Number.MAX_SAFE_INTEGER : width, gap);
    const document = layout.flow === 'document' && layout.mode !== 'deck' && Platform.OS === 'web';
    const deck = layout.mode === 'deck';
    const [shellPreset, claimShellPreset] = useColorClaims();
    const normalized: AppShellProps = {
      ...props,
      panelLayout: undefined,
      panels: true,
      variant: props.variant ?? 'feed',
      scroll: document ? 'document' : 'fixed',
      aside: undefined,
      contentSpan: undefined,
      contentWidth: deck || props.contentMaxWidth === 'none' ? undefined : envelope,
      contentMaxWidth: deck ? 'none' : props.contentMaxWidth,
      children: PanelLayoutView ? (
        <PanelLayoutView
          layout={layout}
          fillWidth={props.contentMaxWidth === 'none'}
          shellWidth={width}
          gap={gap}
          testID={props.testID ? `${props.testID}-panels` : undefined}
        />
      ) : (
        props.children
      ),
    };
    const shell = (
      <View
        onLayout={cssLayout ? undefined : onLayout}
        {...(cssLayout ? { dataSet: { bloomLayout: scope } } : {})}
        style={
          {
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 'auto',
            minWidth: 0,
            minHeight: 0,
            // Percentages follow the document's usable viewport, excluding a
            // classic horizontal scrollbar; viewport units include that bar.
            ...(cssLayout && !document ? { height: '100%' } : {}),
            ...(cssLayout ? { containerType: 'inline-size', containerName: scope } : {}),
          } as WebCssStyle
        }
      >
        <PanelCssContext.Provider value={cssLayout ? scope : null}>
          <PanelCssLayoutContext.Provider value={{ layout, gap }}>
            <ShellColorClaimContext.Provider value={deck ? null : claimShellPreset}>
              <ComposedAppShell {...normalized} />
            </ShellColorClaimContext.Provider>
          </PanelCssLayoutContext.Provider>
        </PanelCssContext.Provider>
      </View>
    );
    // One scope above the whole shell: a claimed preset themes the sidebar and
    // bottom bar too, not just the panel whose screen claimed it.
    return ColorScope ? (
      <ColorScope colorPreset={deck ? undefined : shellPreset} asChild>
        {shell}
      </ColorScope>
    ) : (
      shell
    );
  }
  function ComposedAppShell(props: AppShellProps) {
    if (props.panelLayout) return <ModularAppShell {...props} />;
    const adaptive =
      props.navigation !== undefined ||
      props.navigationPlacement !== undefined ||
      props.primaryAction !== undefined ||
      props.scroll === 'auto' ||
      props.scroll === 'external';
    if (!adaptive) return <AppShellEngine {...(props as AppShellEngineProps)} />;
    const scroll = props.scroll ?? (Platform.OS === 'web' ? 'document' : 'auto');
    const usesLayout =
      props.safeArea !== undefined ||
      props.panels !== undefined ||
      props.variant !== undefined ||
      props.aside !== undefined ||
      props.contentWidth !== undefined ||
      props.contentSpan !== undefined ||
      props.navigationAlign !== undefined ||
      props.navigationGap !== undefined ||
      props.drawer !== undefined ||
      props.navFrom !== undefined ||
      props.navExpandedFrom !== undefined ||
      props.topBar !== undefined ||
      props.bottomBar !== undefined ||
      props.floatingAction !== undefined;
    return (scroll === 'auto' || scroll === 'external') && !usesLayout ? (
      <AdaptiveAppShell {...props} scroll={scroll} />
    ) : (
      <EngineNavigationShell {...props} scroll={scroll} />
    );
  }
  ComposedAppShell.displayName = 'AppShell';
  return ComposedAppShell;
}
