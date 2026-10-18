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
import { Screen } from '../screen/Screen';
import { AiChatResizeHandle } from '../ai-chat/AiChatResizeHandle';
import { PanelErrorBoundary } from '../error-boundary/PanelErrorBoundary';
import { animateMotion } from '../motion/recipes';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useTheme } from '../theme/use-theme';
import type { WebCssStyle } from '../styles/web-view-style';
import { webViewportHeightMinus, WEB_POSITION_STICKY } from '../styles/web-view-style';
import { useShellWidth } from './use-shell-width';
import { usePanelReveal } from './use-panel-reveal';
import { PanelCssContext, panelLayoutCss } from './panel-layout-css';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { AppShellPanelContext, PanelScrollContainerContext } from './context';
import { PanelNavigation, PanelScrollScope } from './PanelNavigation';
import {
  clampPanelWidth,
  resolvePanelAxis,
  panelForAxis,
  resolvePanelTracks,
  resizePanelPair,
  type ResolvedPanelTrack,
} from './panel-layout';
import type { AppShellPanelDefinition, AppShellPanelLayout } from './panel-layout-types';

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
) {
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
    document,
    joined,
    gap,
    onResize,
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
    hasNext: boolean;
    testID?: string;
  }) {
    const region = useAppShellRegion();
    const theme = useTheme();
    const rtl = useIsRtl();
    const { height: viewportHeight } = useWindowDimensions();
    const [stickyHeight, setStickyHeight] = useState(0);
    const sticky = !!panel.sticky && document && !vertical;
    const parent = React.useContext(ScreenContext);
    const active = track.visible && (parent?.active ?? true);
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
        headerActions: panel.headerActions,
        claimColorPreset,
        metrics,
      }),
      [active, document, metrics, panel.headerActions, claimColorPreset],
    );
    const mounted = useRef(false);
    if (track.visible || panel.keepMounted) mounted.current = true;
    const start = useRef(track.width);
    const reduced = useReducedMotion();
    const width = useSharedValue(track.width);
    const leading = useSharedValue(track.gap);
    const opacity = useSharedValue(track.visible ? 1 : 0);
    const lastHeight = useSharedValue(0);
    useEffect(() => {
      if (cssScope) return;
      animateMotion(width, track.width, 'expand', reduced);
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
    const renderContent = renderScreen;
    const body = (
      <PanelScrollScope id={panel.id} active={active}>
        <ScreenScope inheritBottomEdge={document}>
          <ScreenHostContext.Provider value={host}>
            <ScrollMetricsContext.Provider value={metrics}>
              <ScrollOffsetProvider value={scrollY}>
                {panel.navigation ? (
                  <PanelNavigation
                    id={panel.id}
                    active={active}
                    options={{
                      ...panel.navigation,
                      render: (entry, navigation) =>
                        renderContent(panel.navigation!.render(entry, navigation)),
                    }}
                  />
                ) : (
                  renderContent(panel.content)
                )}
              </ScrollOffsetProvider>
            </ScrollMetricsContext.Provider>
          </ScreenHostContext.Provider>
        </ScreenScope>
      </PanelScrollScope>
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
        {mounted.current ? (
          <AppShellPanelContext.Provider
            value={{ id: panel.id, alone, framed, visible: track.visible, active }}
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
            <AiChatResizeHandle
              orientation={vertical ? 'horizontal' : 'vertical'}
              label={panel.resizeLabel}
              testID={testID ? `${testID}-divider` : undefined}
              onResizeStart={() => {
                start.current = cssScope ? getSize() : track.width;
              }}
              onResize={(dx) => onResize(start.current + (!vertical && rtl ? -dx : dx))}
              onNudge={(dx) =>
                onResize((cssScope ? getSize() : track.width) + (!vertical && rtl ? -dx : dx))
              }
            />
          </View>
        ) : null}
      </AnimatedView>
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
    const panelNode = (id: string) => {
      const index = layout.panels.findIndex((panel) => panel.id === id);
      return (rootRef.current as unknown as HTMLElement | null)?.querySelector<HTMLElement>(
        `[data-bloom-panel-index="${index}"]`,
      );
    };
    const currentSize = (id: string) => {
      const bounds = panelNode(id)?.getBoundingClientRect();
      return bounds ? (vertical ? bounds.height : bounds.width) : 0;
    };
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
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
      observer?.observe(root);
      const shell = root.closest('[data-bloom-layout]');
      if (shell) observer?.observe(shell);
      return () => observer?.disconnect();
    }, [cssScope, cssRules, layout.panels]);
    const visible = tracks.filter((track) => track.visible);
    const resize = (panel: AppShellPanelDefinition, requested: number) => {
      const index = visible.findIndex((track) => track.id === panel.id);
      const track = visible[index]!;
      const next = visible[index + 1];
      const pair =
        !deck && !(vertical && document) && next
          ? resizePanelPair(
              panelForAxis(panel, vertical ? 'vertical' : 'horizontal'),
              panelForAxis(
                layout.panels.find((candidate) => candidate.id === next.id)!,
                vertical ? 'vertical' : 'horizontal',
              ),
              cssScope ? currentSize(track.id) : track.width,
              cssScope ? currentSize(next.id) : next.width,
              requested,
            )
          : {
              [panel.id]: clampPanelWidth(
                panelForAxis(panel, vertical ? 'vertical' : 'horizontal'),
                requested,
              ),
            };
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
            getSize={() => dimensions[panel.id] ?? currentSize(panel.id)}
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
            onResize={(value) => resize(panel, value)}
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
