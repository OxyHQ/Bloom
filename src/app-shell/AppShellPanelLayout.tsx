import React, {
  useEffect,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
  useMemo,
  useContext,
  useRef,
  useState,
  type ComponentType,
  type ComponentRef,
} from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { ContentPanelProps } from '../content-panel/types';
import type { DialogProps } from '../dialog/types';
import { useDialogControl, useDialogContext } from '../dialog/context';
import { CloseButton } from '../button/CloseButton';
import { useCommonMessages } from '../locale/common-messages';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import type { ScrollAreaProps, ScrollBarProps } from '../layout/types';
import type { useScrollRestoration as UseScrollRestoration } from '../scroll/use-scroll-restoration';
import { useAppShellRegion } from '../layout/app-shell-region';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { ScrollMetricsContext } from '../layout/scroll-metrics';
import { ScrollOffsetProvider } from '../layout/scroll-offset';
import { ScreenScope } from '../layout/screen-scope';
import { useOptionalScrollRestorationContext } from '../scroll/context';
import { ScreenContext } from '../screen/context';
import { ScreenReselectScope } from '../screen/reselect';
import { ScreenHostContext } from '../screen/context';
import type { ScreenProps } from '../screen/types';
import { ResizeHandle } from '../layout/ResizeHandle';
import { PanelErrorBoundary } from '../error-boundary/PanelErrorBoundary';
import { animatePanelLayout } from './panel-motion';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useTheme } from '../theme/use-theme';
import type { WebCssStyle } from '../styles/web-view-style';
import { webViewportHeightMinus, WEB_POSITION_STICKY } from '../styles/web-view-style';
import { useShellWidth } from './use-shell-width';
import { useShellLayoutReady, useShellViewport } from './use-shell-viewport';
import { Text } from '../typography/Typography';
import { PanelOrderBoundary } from './PanelOrderBoundary';
import type { PanelReorderHost, PanelReorderScroll } from './use-panel-reorder';
import { usePanelReorder } from './use-panel-reorder';
import { PanelReorderHandle } from './PanelReorderHandle';
import { usePanelReveal } from './use-panel-reveal';
import { usePanelResize, type PanelResizePreview } from './use-panel-resize';
import { PanelCssContext, panelLayoutCss } from './panel-layout-css';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import {
  AppShellPanelContext,
  PanelScrollContainerContext,
  ShellColorClaimContext,
  type ColorClaim,
} from './context';
import { useLatestClaim } from '../hooks/use-latest-claim';
import type { AppColorName } from '../theme/color-presets';
import { PlacementBoundaryContext } from '../overlay/placement-boundary';
import { PanelNavigation, PanelScrollScope } from './PanelNavigation';
import { resolvePanelAxis, resolvePanelTracks, type ResolvedPanelTrack } from './panel-layout';
import type {
  AppShellPanelDefinition,
  AppShellPanelLayout,
  PanelNavigationController,
} from './panel-layout-types';

const AnimatedView = Animated.createAnimatedComponent(View);
const FILL: ViewStyle = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  minHeight: 0,
  minWidth: 0,
};
export interface PanelLayoutViewProps {
  layout: AppShellPanelLayout;
  shellWidth: number;
  /** Explicit unrestricted reading envelope from the root AppShell. */
  fillWidth?: boolean;
  /** JSX compatibility groups resolve eligibility against their own box. */
  eligibilityFromGroup?: boolean;
  gap: number;
  testID?: string;
}

/** Shared implementation for native and web; only material and scrollbar implementations differ. */
export function createPanelLayoutView(
  ContentPanel: ComponentType<ContentPanelProps>,
  ColorScope: ComponentType<Pick<BloomColorScopeProps, 'colorPreset' | 'asChild' | 'children'>>,
  ScrollArea: ComponentType<ScrollAreaProps>,
  ScrollBar: ComponentType<ScrollBarProps>,
  useScrollRestoration: typeof UseScrollRestoration,
  Dialog: ComponentType<DialogProps>,
  Screen: ComponentType<ScreenProps>,
) {
  function PanelDismissAction() {
    const surface = useDialogContext();
    const messages = useCommonMessages();
    return (
      <CloseButton size="md" accessibilityLabel={messages.close} onPress={() => surface.close()} />
    );
  }
  function PanelFloatingSurface({
    panel,
    open,
    children,
    testID,
  }: {
    panel: AppShellPanelDefinition;
    open: boolean;
    children: React.ReactNode;
    testID?: string;
  }) {
    const control = useDialogControl();
    const intent = useRef(open);
    intent.current = open;
    useEffect(() => {
      if (open) control.open();
      else control.close();
    }, [control, open]);
    return (
      <Dialog
        control={control}
        label={panel.floating!.label}
        placement="end"
        width={panel.floating!.width ?? panel.width ?? 410}
        inset={{ top: 12, bottom: 12, left: 12, right: 12 }}
        scrollable={false}
        contentPadding={0}
        testID={testID ? `${testID}-floating` : undefined}
        onClose={() => {
          // An explicit state close already belongs to the host. Only surface
          // dismissal reports a new intent, after Dialog's exit completes.
          if (intent.current) panel.floating!.onOpenChange(false);
        }}
      >
        {children}
      </Dialog>
    );
  }
  function DocumentRestoration({ enabled }: { enabled: boolean }) {
    useScrollRestoration('window', { enabled });
    return null;
  }
  function Viewport({
    children,
    horizontal = false,
    enabled,
    document = false,
    testID,
    scrollRef,
    onScroll,
    bottomInset,
  }: {
    children: React.ReactNode;
    horizontal?: boolean;
    enabled: boolean;
    document?: boolean;
    testID?: string;
    scrollRef?: React.MutableRefObject<unknown>;
    onScroll?: ScrollAreaProps['onScroll'];
    /** Bottom clearance for the scrolled content: the bar it scrolls under. */
    bottomInset?: number;
  }) {
    const own = useRef<unknown>(null);
    const node = scrollRef ?? own;
    const handle = useRef({ getScrollableNode: () => node.current as HTMLElement });
    if (Platform.OS === 'web')
      return (
        <View style={document ? { minWidth: 0 } : FILL} testID={testID}>
          <View
            ref={(value) => {
              node.current = value;
            }}
            style={[
              document ? { minWidth: 0 } : FILL,
              {
                overflowX: enabled ? (horizontal ? 'auto' : 'hidden') : 'visible',
                overflowY: enabled ? (horizontal ? 'hidden' : 'auto') : 'visible',
                paddingBottom: bottomInset,
              } as WebCssStyle,
            ]}
          >
            {children}
          </View>
          {enabled ? <ScrollBar target={handle} horizontal={horizontal} /> : null}
        </View>
      );
    return (
      <ScrollArea
        ref={(value) => {
          node.current = value;
        }}
        horizontal={horizontal}
        scrollEnabled={enabled}
        testID={testID}
        onScroll={onScroll}
        style={FILL}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'stretch', paddingBottom: bottomInset }}
      >
        {children}
      </ScrollArea>
    );
  }
  function PanelScroller({
    children,
    active,
    document,
    testID,
  }: {
    children: React.ReactNode;
    active: boolean;
    document: boolean;
    testID?: string;
  }) {
    const ref = useRef<unknown>(null);
    const binding = useScrollRestoration(document ? 'window' : ref, { enabled: active });
    const bottomEdge = useBottomEdgeInset();
    const region = useAppShellRegion();
    const underBar = !document && !!region?.underBottomBar;
    return (
      <Viewport
        enabled={active && !document}
        document={document}
        scrollRef={ref}
        onScroll={binding.onScroll}
        bottomInset={underBar ? bottomEdge : undefined}
        testID={testID}
      >
        <PanelScrollContainerContext.Provider value={document ? null : ref}>
          {children}
        </PanelScrollContainerContext.Provider>
      </Viewport>
    );
  }
  function PanelHost({
    panel,
    reorderHandle,
    registerReorder,
    transition,
    cssScope,
    cssFraming,
    index,
    getSize,
    vertical,
    naturalHeight,
    track,
    alone,
    document: documentFlow,
    joined,
    gap,
    onResize,
    onResizeStart,
    onResizeEnd,
    onNudge,
    registerResizePreview,
    hasNext,
    testID,
  }: {
    panel: AppShellPanelDefinition;
    reorderHandle?: React.ReactNode;
    registerReorder: (id: string, host: PanelReorderHost) => () => void;
    transition: AppShellPanelLayout['transition'];
    cssScope: string | null;
    cssFraming: boolean;
    index: number;
    getSize: () => number;
    vertical: boolean;
    naturalHeight: boolean;
    track: ResolvedPanelTrack;
    alone: boolean;
    document: boolean;
    joined: boolean;
    gap: number;
    onResize: (width: number) => void;
    onResizeStart: () => void;
    onResizeEnd: () => void;
    onNudge: (delta: number) => void;
    registerResizePreview: (preview: PanelResizePreview) => () => void;
    hasNext: boolean;
    testID?: string;
  }) {
    const layoutReady = useShellLayoutReady();
    const panelRef = useRef<ComponentRef<typeof View>>(null);
    const dragOffset = useSharedValue(0);
    const dragLayer = useSharedValue(0);
    useEffect(
      () =>
        registerReorder(panel.id, {
          motion: { offset: dragOffset, layer: dragLayer },
          measure: () =>
            new Promise((resolve) => {
              if (!panelRef.current) {
                resolve(null);
                return;
              }
              panelRef.current.measureInWindow((x, y, width, height) =>
                resolve({ x, y, width, height }),
              );
            }),
          preview: (delta, dragged, reduced) => {
            dragOffset.value = dragged || reduced ? delta : withTiming(delta, { duration: 150 });
            dragLayer.value = dragged ? 3 : 1;
          },
          settle: (delta, reduced) => {
            if (reduced) {
              dragOffset.value = delta;
              return Promise.resolve(true);
            }
            return new Promise<boolean>((resolve) => {
              dragOffset.value = withTiming(delta, { duration: 150 }, (finished) => {
                runOnJS(resolve)(!!finished);
              });
            });
          },
          reset: () => {
            dragOffset.value = 0;
            dragLayer.value = 0;
          },
        }),
      [registerReorder, panel.id, dragOffset, dragLayer],
    );
    const reorderStyle = useAnimatedStyle(
      () =>
        dragLayer.value
          ? {
              transform: vertical
                ? [{ translateY: dragOffset.value }]
                : [{ translateX: dragOffset.value }],
              zIndex: dragLayer.value,
            }
          : {},
      [dragLayer, dragOffset, vertical],
    );
    const region = useAppShellRegion();
    const theme = useTheme();
    const rtl = useIsRtl();
    const { height: viewportHeight } = useShellViewport();
    const [stickyHeight, setStickyHeight] = useState(0);
    const document = documentFlow && !track.floating;
    const floatingOpen = !!track.floating && !!panel.floating?.open && panel.visible !== false;
    const sticky = !!panel.sticky && document && !vertical;
    const parent = React.useContext(ScreenContext);
    const active =
      panel.visible !== false && (track.visible || floatingOpen) && (parent?.active ?? true);
    const screenRef = useRef<unknown>(null);
    const scrollY = useSharedValue(0);
    const contentHeight = useSharedValue(-1);
    const scrollViewportHeight = useSharedValue(0);
    const metrics = useMemo(
      () => ({ scrollY, contentHeight, viewportHeight: scrollViewportHeight }),
      [scrollY, contentHeight, scrollViewportHeight],
    );
    const [screenPreset, claimPanelPreset] = useLatestClaim<AppColorName>();
    const claimShellPreset = useContext(ShellColorClaimContext);
    const claimColorPreset = useCallback<ColorClaim>(
      (preset) => {
        const releasePanel = claimPanelPreset(preset);
        const releaseShell = claimShellPreset?.(preset);
        return () => {
          releasePanel();
          releaseShell?.();
        };
      },
      [claimPanelPreset, claimShellPreset],
    );
    // The app's route Back passes through the panel; a panel `navigation`
    // history takes precedence over it where it can go back.
    const { back } = useContext(ScreenHostContext);
    const host = useMemo(
      () => ({
        active,
        back,
        restoresDocument: document,
        kind: (Platform.OS !== 'web' ? 'native' : document ? 'document' : 'element') as
          | 'native'
          | 'document'
          | 'element',
        scrollRef: screenRef,
        bottomBar: panel.bottomBar,
        headerActions:
          reorderHandle || track.floating ? (
            <>
              {reorderHandle}
              {panel.headerActions}
              {track.floating ? <PanelDismissAction /> : null}
            </>
          ) : (
            panel.headerActions
          ),
        claimColorPreset,
        metrics,
      }),
      [
        active,
        back,
        document,
        metrics,
        panel.headerActions,
        reorderHandle,
        panel.bottomBar,
        claimColorPreset,
        track.floating,
      ],
    );
    const mounted = useRef(false);
    if (track.visible || floatingOpen || panel.keepMounted) mounted.current = true;
    const start = useRef(track.width);
    const reduced = useReducedMotion();
    const width = useSharedValue(track.width);
    useEffect(
      () =>
        registerResizePreview({
          read: () => width.value,
          update: (size) => {
            width.value = size;
          },
        }),
      [registerResizePreview, width],
    );
    const leading = useSharedValue(track.gap);
    const opacity = useSharedValue(track.visible ? 1 : 0);
    const panelScale = useSharedValue(1);
    const lastHeight = useSharedValue(0);
    useEffect(() => {
      if (cssScope) return;
      animatePanelLayout(
        { width, gap: leading, opacity, scale: panelScale },
        { width: track.width, gap: track.gap, visible: track.visible },
        transition === 'exit-before-enter',
        reduced,
      );
    }, [
      track.width,
      track.gap,
      track.visible,
      width,
      leading,
      opacity,
      panelScale,
      transition,
      reduced,
      cssScope,
    ]);
    const sizing = useAnimatedStyle(
      () =>
        cssScope
          ? {}
          : {
              width: vertical || (!layoutReady && track.visible) ? ('100%' as const) : width.value,
              height: vertical
                ? !layoutReady && track.visible && !naturalHeight
                  ? ('100%' as const)
                  : naturalHeight && track.visible
                    ? ('auto' as const)
                    : width.value
                : !track.visible && document
                  ? opacity.value > 0.001
                    ? lastHeight.value
                    : 0
                  : undefined,
              marginInlineStart: vertical ? 0 : leading.value,
              marginTop: vertical ? leading.value : 0,
              opacity: opacity.value,
              transform: [{ scale: panelScale.value }],
              maxHeight: !track.visible && opacity.value <= 0.001 ? 0 : undefined,
            },
      [
        width,
        leading,
        opacity,
        panelScale,
        lastHeight,
        vertical,
        naturalHeight,
        layoutReady,
        track.visible,
        document,
        cssScope,
      ],
    );
    // Legacy panel chrome/scroll props adapt to Screen; declarative routes own
    // their Screen directly, so the host never inserts an empty screen scope.
    const renderScreen = (content: React.ReactNode) =>
      panel.scroll === 'panel' || panel.header ? (
        <Screen
          active={active}
          header={panel.header}
          scroll={Platform.OS === 'web' && panel.scroll === 'panel' ? 'auto' : 'content'}
          documentScroll={document}
          navigationScope="shared"
          contentClearance={0}
          testID={testID ? `${testID}-scroll` : undefined}
        >
          {Platform.OS !== 'web' && panel.scroll === 'panel' ? (
            <PanelScroller
              active={active}
              document={document}
              testID={testID ? `${testID}-scroll` : undefined}
            >
              {content}
            </PanelScroller>
          ) : (
            content
          )}
        </Screen>
      ) : (
        <View style={FILL}>{content}</View>
      );
    const renderPanel = (content: React.ReactNode, navigation?: PanelNavigationController) => {
      // Under the bottom bar a side-by-side panel reaches it: its content clears
      // the bar and drives it (the shell's navigation motion); a stacked one sits
      // above the group viewport's own clearance.
      const underBar = !document && !vertical && !!region?.underBottomBar;
      const body = (
        <ScreenScope inheritBottomEdge={document || underBar} inheritNavigation={underBar}>
          <ScreenHostContext.Provider value={navigation ? { ...host, navigation } : host}>
            <ScrollMetricsContext.Provider value={metrics}>
              <ScrollOffsetProvider value={scrollY}>{content}</ScrollOffsetProvider>
            </ScrollMetricsContext.Provider>
          </ScreenHostContext.Provider>
        </ScreenScope>
      );
      const framed = region?.framed ?? true;
      const surface = joined ? (
        <View style={FILL}>
          {panel.errorBoundary ? (
            <PanelErrorBoundary {...(panel.errorBoundary === true ? {} : panel.errorBoundary)}>
              {body}
            </PanelErrorBoundary>
          ) : (
            body
          )}
        </View>
      ) : (
        <ContentPanel
          appearance={panel.appearance}
          chrome={panel.chrome}
          surfaceClassName={panel.surfaceClassName}
          surfaceColor={panel.surfaceColor}
          framed={cssScope && cssFraming ? true : framed}
          maskColor={region?.maskColor}
          errorBoundary={panel.errorBoundary}
          fill={!document}
          scrollable={false}
          overlaySizing={document && !vertical ? 'viewport' : 'panel'}
          overlayInset={document && !vertical ? region?.viewportInset : undefined}
          surfaceStyle={[
            FILL,
            document && !vertical && !sticky && region
              ? {
                  minHeight: webViewportHeightMinus(
                    region.viewportInset.top + region.viewportInset.bottom + region.bottomReserve,
                  ),
                }
              : undefined,
          ]}
          contentStyle={FILL}
        >
          {body}
        </ContentPanel>
      );
      const resizable = panel.resizable && hasNext && track.visible && !alone;
      return (
        <>
          <AnimatedView
            ref={panelRef}
            {...(cssScope
              ? { dataSet: { bloomPanelIndex: String(index), bloomPanelOwner: cssScope } }
              : {})}
            testID={testID}
            style={[
              {
                flexShrink: 0,
                minWidth: 0,
                minHeight: vertical && naturalHeight ? (panel.minHeight ?? 0) : 0,
                alignSelf: 'stretch',
              },
              sizing,
              sticky
                ? {
                    position: WEB_POSITION_STICKY,
                    alignSelf: 'flex-start',
                    top: Math.min(
                      region?.viewportInset.top ?? 0,
                      viewportHeight -
                        stickyHeight -
                        (region?.viewportInset.bottom ?? 0) -
                        (region?.bottomReserve ?? 0),
                    ),
                  }
                : undefined,
              !track.visible ? { overflow: 'hidden' } : undefined,
              resizable ? { zIndex: 1 } : undefined,
              Platform.OS !== 'web' ? reorderStyle : undefined,
            ]}
            onLayout={(event) => {
              if (track.visible) {
                lastHeight.value = event.nativeEvent.layout.height;
                if (sticky) setStickyHeight(event.nativeEvent.layout.height);
              }
            }}
            aria-hidden={!active ? true : undefined}
            {...(Platform.OS === 'web' && !active ? { inert: true } : null)}
            importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!active}
            pointerEvents={active ? 'auto' : 'none'}
          >
            {mounted.current && !track.floating ? (
              <AppShellPanelContext.Provider
                value={{
                  id: panel.id,
                  alone,
                  framed,
                  cssVisibility: !!cssScope,
                  visible: panel.visible !== false && track.visible,
                  active,
                }}
              >
                {/* Menus and popovers opened in here stay inside this panel while
                they fit in it (`overlay/placement-boundary`). */}
                <PlacementBoundaryContext.Provider value={panelRef}>
                  {/* A viewport mask may bleed past its own surface by a pixel. Bound
                that paint to this track so zero-gap neighbors keep their border.
                clip/visible preserves the document's vertical sticky scroll root. */}
                  <ColorScope colorPreset={screenPreset ?? panel.colorPreset} asChild>
                    <View
                      testID={testID ? `${testID}-surface-bounds` : undefined}
                      style={[
                        FILL,
                        Platform.OS === 'web'
                          ? ((joined || document
                              ? { overflowX: 'clip', overflowY: 'visible' }
                              : {
                                  // Separated panels have the gap to themselves, and
                                  // their shadow falls into it. Chrome honours a clip
                                  // margin only when both axes clip; `clip` makes no
                                  // scroll container, so sticky content is unaffected.
                                  overflow: 'clip',
                                  overflowClipMargin: gap,
                                }) as unknown as WebCssStyle)
                          : undefined,
                      ]}
                    >
                      {surface}
                    </View>
                  </ColorScope>
                </PlacementBoundaryContext.Provider>
              </AppShellPanelContext.Provider>
            ) : null}
            {(joined || !framed) && track.gap > 0 ? (
              <View
                pointerEvents="none"
                style={
                  {
                    position: 'absolute',
                    ...(vertical
                      ? { left: 0, right: 0, top: -track.gap, height: track.gap }
                      : { top: 0, bottom: 0, insetInlineStart: -track.gap, width: track.gap }),
                    backgroundColor: theme.colors.border,
                  } as WebCssStyle
                }
              />
            ) : null}
            {resizable ? (
              <View
                testID={testID ? `${testID}-resize-anchor` : undefined}
                pointerEvents="box-none"
                style={
                  {
                    position: 'absolute',
                    ...(vertical
                      ? { left: 0, right: 0, bottom: -gap / 2, height: 0 }
                      : { top: 0, bottom: 0, insetInlineEnd: -gap / 2, width: 0 }),
                  } as WebCssStyle
                }
              >
                <ResizeHandle
                  orientation={vertical ? 'horizontal' : 'vertical'}
                  label={panel.resizeLabel}
                  testID={testID ? `${testID}-divider` : undefined}
                  onResizeStart={() => {
                    onResizeStart();
                    start.current = getSize();
                  }}
                  onResize={(dx) => onResize(start.current + (!vertical && rtl ? -dx : dx))}
                  onResizeEnd={onResizeEnd}
                  onNudge={(dx) => onNudge(!vertical && rtl ? -dx : dx)}
                />
              </View>
            ) : null}
          </AnimatedView>
          {track.floating && panel.floating ? (
            <PanelFloatingSurface panel={panel} open={floatingOpen} testID={testID}>
              <AppShellPanelContext.Provider
                value={{
                  id: panel.id,
                  alone: true,
                  framed: true,
                  visible: floatingOpen,
                  active,
                  presentation: 'floating',
                }}
              >
                <ColorScope colorPreset={screenPreset ?? panel.colorPreset} asChild>
                  <View style={FILL}>
                    {panel.errorBoundary ? (
                      <PanelErrorBoundary
                        {...(panel.errorBoundary === true ? {} : panel.errorBoundary)}
                      >
                        {body}
                      </PanelErrorBoundary>
                    ) : (
                      body
                    )}
                  </View>
                </ColorScope>
              </AppShellPanelContext.Provider>
            </PanelFloatingSurface>
          ) : null}
        </>
      );
    };
    // Navigation and restoration belong to the persistent descriptor, above
    // the inline/portal presentation boundary. Closing or docking a surface
    // does not recreate its history or scroll store.
    return (
      <PanelScrollScope id={panel.id} active={active}>
        {panel.navigation ? (
          // A panel with navigation of its own is a stack of screens of its own:
          // its reselect answers for its screens, not the main one's.
          <ScreenReselectScope>
            <PanelNavigation
              id={panel.id}
              active={active}
              options={{
                ...panel.navigation,
                render: (entry, navigation) =>
                  renderPanel(
                    renderScreen(panel.navigation!.render(entry, navigation)),
                    navigation,
                  ),
              }}
            />
          </ScreenReselectScope>
        ) : (
          renderPanel(renderScreen(panel.content))
        )}
      </PanelScrollScope>
    );
  }
  function PanelLayoutTracks({
    layout,
    surfaceOwned = false,
    shellWidth,
    eligibilityFromGroup = false,
    fillWidth = false,
    gap,
    testID,
  }: PanelLayoutViewProps & { surfaceOwned?: boolean }) {
    const layoutReady = useShellLayoutReady();
    const region = useAppShellRegion();
    const restoration = useOptionalScrollRestorationContext();
    const ancestorHost = useContext(ScreenHostContext);
    const cssScope = useContext(PanelCssContext);
    const rootRef = useRef<ComponentRef<typeof View>>(null);
    const reorderScrollRef = useRef<unknown>(null);
    const reorderScrollOffset = useRef({ x: 0, y: 0 });
    const nativeReorderScroll = useMemo<PanelReorderScroll>(
      () => ({
        measure: () =>
          new Promise((resolve) => {
            const node = reorderScrollRef.current as ComponentRef<typeof View> | null;
            if (!node?.measureInWindow) {
              resolve(null);
              return;
            }
            node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
          }),
        offset: () => reorderScrollOffset.current,
        scrollBy: (delta) => {
          const offset = reorderScrollOffset.current;
          (
            reorderScrollRef.current as {
              scrollTo?: (options: { x: number; y: number; animated: boolean }) => void;
            } | null
          )?.scrollTo?.({ x: offset.x + delta.x, y: offset.y + delta.y, animated: false });
        },
      }),
      [],
    );
    const [cssState, setCssState] = useState<{ vertical: boolean; tracks: ResolvedPanelTrack[] }>({
      vertical: false,
      tracks: layout.panels.map((panel) => ({
        id: panel.id,
        width: 0,
        visible: !!cssScope && panel.visible !== false,
        gap: 0,
      })),
    });
    const bottomEdge = useBottomEdgeInset();
    const { width, onLayout } = useShellWidth();
    const window = useShellViewport();
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
    const vertical = cssScope
      ? cssState.vertical
      : resolvePanelAxis(layout, shellWidth) === 'vertical';
    const [ownWidths, setOwnWidths] = useState<Readonly<Record<string, number>>>({});
    const [ownHeights, setOwnHeights] = useState<Readonly<Record<string, number>>>({});
    const dimensions = vertical ? (layout.heights ?? ownHeights) : (layout.widths ?? ownWidths);
    const joined = layout.appearance === 'joined' || layout.appearance === 'plain';
    const actualGap = layout.gap ?? (joined ? 1 : gap);
    const document = layout.flow === 'document' && layout.mode !== 'deck' && Platform.OS === 'web';
    const deck = layout.mode === 'deck';
    const documentHorizontal =
      !!cssScope && deck && !vertical && layout.horizontalScroll !== 'contained';
    const reducedMotion = useReducedMotion();
    const room = vertical
      ? Math.max(0, (measuredHeight ?? window.height) - (document ? 0 : bottomEdge))
      : width;
    const tracks = cssScope
      ? cssState.tracks
      : resolvePanelTracks(
          {
            ...layout,
            flow: document ? 'document' : 'bounded',
            // No viewport exists on the server. Render one readable, fluid
            // panel, then let the measured compositor take over after hydration.
            ...(!layoutReady
              ? { mode: 'split' as const, collapseBelow: Number.MAX_SAFE_INTEGER }
              : {}),
          },
          room,
          eligibilityFromGroup ? width : shellWidth,
          actualGap,
          dimensions,
        );
    usePanelReveal({
      rootRef,
      request: layout.revealPanel,
      enabled: documentHorizontal,
      scope: cssScope,
      panels: layout.panels,
      tracks,
      reducedMotion,
    });
    const cssRules = cssScope
      ? panelLayoutCss(
          cssScope,
          layout,
          actualGap,
          layout.widths ?? ownWidths,
          layout.heights ?? ownHeights,
          fillWidth,
        )
      : '';
    useLayoutEffect(() => {
      if (!cssScope || !rootRef.current || typeof getComputedStyle !== 'function') return;
      const root = rootRef.current as unknown as HTMLElement;
      const read = () => {
        const row = root.querySelector<HTMLElement>('[data-bloom-panel-row]');
        if (!row) return;
        const axis = getComputedStyle(row).getPropertyValue('--bloom-panel-axis').trim();
        const next = layout.panels.map((panel, index) => {
          const node = root.querySelector<HTMLElement>(
            `[data-bloom-panel-owner="${cssScope}"][data-bloom-panel-index="${index}"]`,
          );
          const style = node ? getComputedStyle(node) : null;
          return {
            id: panel.id,
            width: 0,
            gap: 0,
            visible: style?.getPropertyValue('--bloom-panel-visible').trim() === '1',
            floating: style?.getPropertyValue('--bloom-panel-floating').trim() === '1',
          };
        });
        // Commit the first CSS geometry while transitions are disabled. Merely
        // reading custom properties does not establish used dimensions: enabling
        // motion then can animate SSR/hidden zero widths into the workspace.
        // Resolve layout before enabling later interactions, all before paint.
        if (!root.hasAttribute('data-bloom-panel-ready')) {
          root.getBoundingClientRect();
          root.setAttribute('data-bloom-panel-ready', 'true');
        }
        setCssState((previous) =>
          previous.vertical === (axis === 'vertical') &&
          JSON.stringify(previous.tracks) === JSON.stringify(next)
            ? previous
            : { vertical: axis === 'vertical', tracks: next },
        );
      };
      read();
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(() => {
              if (!root.hasAttribute('data-bloom-panel-resizing')) read();
            });
      observer?.observe(root);
      const shell = root.closest('[data-bloom-layout]');
      if (shell) observer?.observe(shell);
      return () => observer?.disconnect();
    }, [cssScope, cssRules, layout.panels]);
    const visible = tracks.filter((track) => track.visible);
    const commitResize = (pair: Readonly<Record<string, number>>) => {
      const updated = { ...dimensions, ...pair };
      if (vertical) {
        if (layout.heights === undefined) setOwnHeights(updated);
        layout.onHeightsChange?.(updated);
      } else {
        if (layout.widths === undefined) setOwnWidths(updated);
        layout.onWidthsChange?.(updated);
      }
      Object.entries(pair).forEach(([id, value]) => {
        const changed = layout.panels.find((candidate) => candidate.id === id);
        if (vertical) changed?.onHeightChange?.(value);
        else changed?.onWidthChange?.(value);
      });
    };
    const resize = usePanelResize({
      layout,
      tracks,
      vertical,
      document,
      scope: cssScope,
      rootRef,
      onCommit: commitResize,
    });
    const reorder = usePanelReorder({
      layout,
      tracks,
      vertical,
      documentHorizontal,
      scope: cssScope,
      rootRef,
      nativeScroll: nativeReorderScroll,
    });
    const readViewportOffset = () => {
      if (Platform.OS !== 'web') return reorderScrollOffset.current;
      if (documentHorizontal) return { x: globalThis.window.scrollX, y: globalThis.window.scrollY };
      const node = reorderScrollRef.current as HTMLElement | null;
      return { x: node?.scrollLeft ?? 0, y: node?.scrollTop ?? 0 };
    };
    const measureViewport = async () => {
      if (Platform.OS !== 'web') return nativeReorderScroll.measure();
      if (documentHorizontal)
        return {
          x: 0,
          y: 0,
          width: globalThis.window.innerWidth,
          height: globalThis.window.innerHeight,
        };
      const rect = (reorderScrollRef.current as HTMLElement | null)?.getBoundingClientRect();
      return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
    };
    const scrollViewport = ({ x = 0, y = 0 }: { x?: number; y?: number }) => {
      if (Platform.OS !== 'web') {
        nativeReorderScroll.scrollBy({ x, y });
        return;
      }
      const node = documentHorizontal
        ? globalThis.window
        : (reorderScrollRef.current as HTMLElement | null);
      node?.scrollBy({ left: x, top: y, behavior: 'instant' });
    };
    useImperativeHandle(layout.viewportRef, () => ({
      getOffset: readViewportOffset,
      measure: measureViewport,
      scrollBy: scrollViewport,
      reveal: (id) => {
        if (!layout.panels.some((panel, index) => panel.id === id && tracks[index]?.visible))
          return;
        void Promise.all([reorder.measure(id), measureViewport()]).then(([panel, viewport]) => {
          if (!panel || !viewport) return;
          const delta = vertical
            ? panel.y < viewport.y
              ? panel.y - viewport.y
              : Math.max(0, panel.y + panel.height - viewport.y - viewport.height)
            : panel.x < viewport.x
              ? panel.x - viewport.x
              : Math.max(0, panel.x + panel.width - viewport.x - viewport.width);
          scrollViewport(vertical ? { y: delta } : { x: delta });
        });
      },
    }));
    const onViewportScroll = useRef(layout.onViewportScroll);
    onViewportScroll.current = layout.onViewportScroll;
    const hasViewportScrollObserver = !!layout.onViewportScroll;
    useEffect(() => {
      if (Platform.OS !== 'web' || !hasViewportScrollObserver) return;
      const node = documentHorizontal
        ? globalThis.window
        : (reorderScrollRef.current as HTMLElement | null);
      const report = () => onViewportScroll.current?.(readViewportOffset());
      node?.addEventListener('scroll', report, { passive: true });
      return () => node?.removeEventListener('scroll', report);
    }, [documentHorizontal, hasViewportScrollObserver]);
    const row = (
      <View
        {...(cssScope ? { dataSet: { bloomPanelRow: cssScope } } : {})}
        style={{
          flexDirection: vertical ? 'column' : 'row',
          alignItems: 'stretch',
          flexGrow: 1,
          flexShrink: document ? 0 : 1,
          flexBasis: document ? 'auto' : 0,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {layout.panels.map((panel, index) => (
          <PanelHost
            key={panel.id}
            panel={panel}
            registerReorder={reorder.register}
            transition={layout.transition}
            reorderHandle={
              reorder.canReorder(panel.id) ? (
                <PanelReorderHandle
                  id={panel.id}
                  label={panel.reorderLabel ?? panel.id}
                  onMove={(delta) => reorder.move(panel.id, delta)}
                  onStart={reorder.start}
                  onUpdate={reorder.update}
                  pointer={reorder.pointer}
                  onFinish={reorder.finish}
                  testID={`${panel.testID ?? (testID ? `${testID}-${panel.id}` : panel.id)}-reorder`}
                />
              ) : undefined
            }
            cssScope={cssScope}
            cssFraming={!eligibilityFromGroup}
            index={index}
            getSize={() => resize.size(panel.id)}
            vertical={vertical}
            naturalHeight={
              vertical &&
              document &&
              panel.height === undefined &&
              dimensions[panel.id] === undefined
            }
            track={tracks[index] ?? { id: panel.id, width: 0, visible: false, gap: 0 }}
            alone={visible.length === 1}
            document={document}
            joined={joined}
            gap={actualGap}
            hasNext={visible[visible.length - 1]?.id !== panel.id}
            onResizeStart={() => resize.start(panel)}
            onResize={(value) => resize.resize(panel, value)}
            onResizeEnd={resize.end}
            onNudge={(delta) => resize.nudge(panel, delta)}
            registerResizePreview={(preview) => resize.register(panel.id, preview)}
            testID={panel.testID ?? (testID ? `${testID}-${panel.id}` : undefined)}
          />
        ))}
      </View>
    );
    const content = (
      <Viewport
        horizontal={!vertical}
        scrollRef={reorderScrollRef}
        onScroll={(event) => {
          reorderScrollOffset.current = event.nativeEvent.contentOffset;
          layout.onViewportScroll?.(event.nativeEvent.contentOffset);
        }}
        enabled={deck && !documentHorizontal}
        document={document}
        bottomInset={vertical && !document && region?.underBottomBar ? bottomEdge : undefined}
        testID={testID ? `${testID}-scroll` : undefined}
      >
        {row}
      </Viewport>
    );
    return (
      <PanelOrderBoundary ids={layout.panels.map((panel) => panel.id)} rootRef={rootRef}>
        <ServerStyleSheet id={cssScope ?? ''} css={cssRules} />
        <View
          ref={rootRef}
          {...(cssScope
            ? {
                dataSet: {
                  bloomPanelGroup: cssScope,
                  bloomPanelOrdering: reorder.ordering ? 'true' : undefined,
                },
              }
            : {})}
          testID={testID}
          onLayout={
            cssScope
              ? undefined
              : (event) => {
                  onLayout(event);
                  setMeasuredHeight(event.nativeEvent.layout.height);
                }
          }
          style={[
            {
              minWidth: 0,
              alignSelf: 'stretch',
              // A bounded group reserves the bottom bar, or — when the app keeps
              // the bar over its content — fills under it and what scrolls clears
              // it (`useBottomEdgeInset`, the panel scroller, the vertical deck).
              paddingBottom: document
                ? (region?.bottomReserve ?? 0)
                : region?.underBottomBar
                  ? 0
                  : bottomEdge,
              ...(cssScope
                ? {
                    containerType: document ? 'inline-size' : 'size',
                    containerName: `${cssScope}-group`,
                  }
                : {}),
            } as WebCssStyle,
            document ? {} : FILL,
          ]}
        >
          {Platform.OS === 'web' && restoration && !ancestorHost.restoresDocument ? (
            <DocumentRestoration enabled={document} />
          ) : null}
          {joined && !surfaceOwned ? (
            <ContentPanel
              appearance={layout.appearance === 'plain' ? 'plain' : undefined}
              framed={cssScope && !eligibilityFromGroup ? true : (region?.framed ?? true)}
              fill={!document}
              scrollable={false}
              overlaySizing={document ? 'viewport' : 'panel'}
              overlayInset={document ? region?.viewportInset : undefined}
              surfaceStyle={FILL}
              contentStyle={FILL}
            >
              {content}
            </ContentPanel>
          ) : (
            content
          )}
          {layout.onPanelOrderChange ? (
            <Text
              accessibilityLiveRegion="polite"
              aria-live="polite"
              style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
            >
              {reorder.announcement}
            </Text>
          ) : null}
          {documentHorizontal ? (
            <ScrollBar target="document" horizontal offset={bottomEdge} />
          ) : null}
          {documentHorizontal && layout.trailingAction ? (
            <View
              {...{ dataSet: { bloomDeckTrailing: cssScope ?? undefined } }}
              testID={testID ? `${testID}-trailing-action` : undefined}
            >
              {layout.trailingAction}
            </View>
          ) : null}
        </View>
      </PanelOrderBoundary>
    );
  }
  function PanelLayoutView(props: PanelLayoutViewProps) {
    const region = useAppShellRegion();
    const cssScope = useContext(PanelCssContext);
    if (props.layout.header === undefined) return <PanelLayoutTracks {...props} />;
    const document =
      props.layout.flow === 'document' && props.layout.mode !== 'deck' && Platform.OS === 'web';
    const joined = props.layout.appearance === 'joined' || props.layout.appearance === 'plain';
    const workspace = (
      <Screen
        scroll="none"
        documentScroll={document}
        header={props.layout.header}
        testID={props.testID ? `${props.testID}-workspace` : undefined}
      >
        <PanelLayoutTracks {...props} surfaceOwned={joined} />
      </Screen>
    );
    return joined ? (
      <ContentPanel
        appearance={props.layout.appearance === 'plain' ? 'plain' : undefined}
        framed={cssScope && !props.eligibilityFromGroup ? true : (region?.framed ?? true)}
        fill={!document}
        scrollable={false}
        overlaySizing={document ? 'viewport' : 'panel'}
        overlayInset={document ? region?.viewportInset : undefined}
        surfaceStyle={FILL}
        contentStyle={FILL}
      >
        {workspace}
      </ContentPanel>
    ) : (
      workspace
    );
  }
  return PanelLayoutView;
}
