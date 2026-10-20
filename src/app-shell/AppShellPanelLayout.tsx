import React, {
  useEffect,
  useCallback,
  useInsertionEffect,
  useMemo,
  useContext,
  useRef,
  useState,
  type ComponentType,
  type ComponentRef,
} from 'react';
import { Platform, View, useWindowDimensions, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
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
import { ScreenHostContext } from '../screen/context';
import type { ScreenProps } from '../screen/types';
import { ResizeHandle } from '../layout/ResizeHandle';
import { PanelErrorBoundary } from '../error-boundary/PanelErrorBoundary';
import { animateMotion } from '../motion/recipes';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useTheme } from '../theme/use-theme';
import type { WebCssStyle } from '../styles/web-view-style';
import { webViewportHeightMinus, WEB_POSITION_STICKY } from '../styles/web-view-style';
import { useShellWidth } from './use-shell-width';
import { usePanelReveal } from './use-panel-reveal';
import { usePanelResize, type PanelResizePreview } from './use-panel-resize';
import { PanelCssContext, panelLayoutCss } from './panel-layout-css';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { AppShellPanelContext, PanelScrollContainerContext } from './context';
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
  }: {
    children: React.ReactNode;
    horizontal?: boolean;
    enabled: boolean;
    document?: boolean;
    testID?: string;
    scrollRef?: React.MutableRefObject<unknown>;
    onScroll?: ScrollAreaProps['onScroll'];
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
        contentContainerStyle={{ flexGrow: 1, alignItems: 'stretch' }}
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
    return (
      <Viewport
        enabled={active && !document}
        document={document}
        scrollRef={ref}
        onScroll={binding.onScroll}
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
    const region = useAppShellRegion();
    const theme = useTheme();
    const rtl = useIsRtl();
    const { height: viewportHeight } = useWindowDimensions();
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
    const [screenPreset, setScreenPreset] = useState<BloomColorScopeProps['colorPreset']>();
    const colorClaims = useRef(new Map<symbol, NonNullable<BloomColorScopeProps['colorPreset']>>());
    const claimColorPreset = useCallback(
      (preset: NonNullable<BloomColorScopeProps['colorPreset']>) => {
        const key = Symbol('screen-color');
        colorClaims.current.set(key, preset);
        setScreenPreset(preset);
        return () => {
          colorClaims.current.delete(key);
          const remaining = [...colorClaims.current.values()];
          setScreenPreset(remaining[remaining.length - 1]);
        };
      },
      [],
    );
    const host = useMemo(
      () => ({
        active,
        restoresDocument: document,
        kind: (Platform.OS !== 'web' ? 'native' : document ? 'document' : 'element') as
          | 'native'
          | 'document'
          | 'element',
        scrollRef: screenRef,
        bottomBar: panel.bottomBar,
        headerActions: track.floating ? (
          <>
            {panel.headerActions}
            <PanelDismissAction />
          </>
        ) : (
          panel.headerActions
        ),
        claimColorPreset,
        metrics,
      }),
      [
        active,
        document,
        metrics,
        panel.headerActions,
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
    const lastHeight = useSharedValue(0);
    useEffect(() => {
      if (cssScope) return;
      if (width.value !== track.width) animateMotion(width, track.width, 'expand', reduced);
      animateMotion(leading, track.gap, 'expand', reduced);
      animateMotion(opacity, track.visible ? 1 : 0, 'expand', reduced);
    }, [track.width, track.gap, track.visible, width, leading, opacity, reduced, cssScope]);
    const sizing = useAnimatedStyle(
      () =>
        cssScope
          ? {}
          : {
              width: vertical ? ('100%' as const) : width.value,
              height: vertical
                ? naturalHeight && track.visible
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
              maxHeight: !track.visible && opacity.value <= 0.001 ? 0 : undefined,
            },
      [
        width,
        leading,
        opacity,
        lastHeight,
        vertical,
        naturalHeight,
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
      const body = (
        <ScreenScope inheritBottomEdge={document}>
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
                  visible: panel.visible !== false && track.visible,
                  active,
                }}
              >
                {/* A viewport mask may bleed past its own surface by a pixel. Bound
                that paint to this track so zero-gap neighbors keep their border.
                clip/visible preserves the document's vertical sticky scroll root. */}
                <ColorScope colorPreset={screenPreset ?? panel.colorPreset} asChild>
                  <View
                    testID={testID ? `${testID}-surface-bounds` : undefined}
                    style={[
                      FILL,
                      Platform.OS === 'web'
                        ? ({ overflowX: 'clip', overflowY: 'visible' } as WebCssStyle)
                        : undefined,
                    ]}
                  >
                    {surface}
                  </View>
                </ColorScope>
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
          <PanelNavigation
            id={panel.id}
            active={active}
            options={{
              ...panel.navigation,
              render: (entry, navigation) =>
                renderPanel(renderScreen(panel.navigation!.render(entry, navigation)), navigation),
            }}
          />
        ) : (
          renderPanel(renderScreen(panel.content))
        )}
      </PanelScrollScope>
    );
  }
  function PanelLayoutView({
    layout,
    shellWidth,
    eligibilityFromGroup = false,
    gap,
    testID,
  }: PanelLayoutViewProps) {
    const region = useAppShellRegion();
    const restoration = useOptionalScrollRestorationContext();
    const ancestorHost = useContext(ScreenHostContext);
    const cssScope = useContext(PanelCssContext);
    const rootRef = useRef<ComponentRef<typeof View>>(null);
    const [cssState, setCssState] = useState<{ vertical: boolean; tracks: ResolvedPanelTrack[] }>({
      vertical: false,
      tracks: layout.panels.map((panel) => ({ id: panel.id, width: 0, visible: false, gap: 0 })),
    });
    const bottomEdge = useBottomEdgeInset();
    const { width, onLayout } = useShellWidth();
    const window = useWindowDimensions();
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
    const vertical = cssScope
      ? cssState.vertical
      : resolvePanelAxis(layout, shellWidth) === 'vertical';
    const [ownWidths, setOwnWidths] = useState<Readonly<Record<string, number>>>({});
    const [ownHeights, setOwnHeights] = useState<Readonly<Record<string, number>>>({});
    const dimensions = vertical ? (layout.heights ?? ownHeights) : (layout.widths ?? ownWidths);
    const joined = layout.appearance === 'joined';
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
          { ...layout, flow: document ? 'document' : 'bounded' },
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
        )
      : '';
    useInsertionEffect(() => {
      if (cssScope) adoptStyleSheet(cssScope, cssRules);
    }, [cssScope, cssRules]);
    useEffect(() => {
      if (!cssScope || !rootRef.current || typeof getComputedStyle !== 'function') return;
      const root = rootRef.current as unknown as HTMLElement;
      const read = () => {
        const row = root.querySelector<HTMLElement>('[data-bloom-panel-row]');
        if (!row) return;
        const axis = getComputedStyle(row).getPropertyValue('--bloom-panel-axis').trim();
        const next = layout.panels.map((panel, index) => {
          const node = root.querySelector<HTMLElement>(`[data-bloom-panel-index="${index}"]`);
          const style = node ? getComputedStyle(node) : null;
          return {
            id: panel.id,
            width: 0,
            gap: 0,
            visible: style?.getPropertyValue('--bloom-panel-visible').trim() === '1',
            floating: style?.getPropertyValue('--bloom-panel-floating').trim() === '1',
          };
        });
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
        enabled={deck && !documentHorizontal}
        document={document}
        testID={testID ? `${testID}-scroll` : undefined}
      >
        {row}
      </Viewport>
    );
    return (
      <View
        ref={rootRef}
        {...(cssScope ? { dataSet: { bloomPanelGroup: cssScope } } : {})}
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
            paddingBottom: document ? (region?.bottomReserve ?? 0) : bottomEdge,
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
        {joined ? (
          <ContentPanel
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
        {documentHorizontal ? <ScrollBar target="document" horizontal offset={bottomEdge} /> : null}
        {documentHorizontal && layout.trailingAction ? (
          <View
            {...{ dataSet: { bloomDeckTrailing: cssScope ?? undefined } }}
            testID={testID ? `${testID}-trailing-action` : undefined}
          >
            {layout.trailingAction}
          </View>
        ) : null}
      </View>
    );
  }
  return PanelLayoutView;
}
