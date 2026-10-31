import type { ScrollAreaProps } from '../layout/types';
/**
 * `AppShellPanel` and `AppShellPanels` — the surfaces a `panels` shell frames.
 *
 * THE MODEL. The shell owns the frame: its gutter on all four sides, whether
 * panels are framed (rounded, the gutter around and between them) or compact
 * (full-bleed, no gutter), the viewport geometry, the bottom-bar reserve. It
 * publishes that once, down, as `AppShellRegion` (`layout/app-shell-region.ts`).
 * A panel draws a surface and nothing else; a group lays several out side by
 * side. Neither tells the shell anything, so a route that renders one panel,
 * two, or one in some states and two in others is laid out by the same rules,
 * and the shell never re-renders around a route.
 *
 * WHAT A GROUP KNOWS ABOUT ITS PANELS: their POSITION, never their props. Each
 * direct child is handed `{ index, count }` (`Children.toArray` drops the
 * `false` of a conditional panel), which is all the layout needs — the first
 * panel is the one a collapsed group shows by default, a panel after the first
 * draws the divider before itself, a group of one is `alone`. Everything else
 * a panel decides for itself from that and the group's measured width.
 *
 * SIZES WITHOUT ARITHMETIC. A panel with a `width` is `flexBasis: width` and
 * shrinkable down to its `minWidth`; a panel without one is `flexBasis: 0`,
 * growing, with its own `minWidth`. Flexbox (CSS and Yoga alike) sums the
 * min-clamped bases first, so a narrow group shrinks the SIZED panel before
 * the flexible one goes below its minimum — a map beside a results list stays
 * a map — with no "room" subtraction anywhere.
 *
 * Resizable dividers are owned by `AppShellPanelLayout`, which reuses
 * `ResizeHandle` for pointer capture, native gestures and arrow keys.
 * This legacy surface delegates modular layout to that shared owner.
 */
import type React from 'react';
import { Children, isValidElement, useContext, useId } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

import type { ContentPanelProps } from '../content-panel/types';
import { ContentPanelNestingContext } from '../content-panel/context';
import {
  AppShellRegionContext,
  useAppShellRegion,
  type AppShellRegionValue,
} from '../layout/app-shell-region';
import { BottomEdgeProvider, useBottomEdgeInset } from '../layout/bottom-edge';
import { useOptionalSurfaceFill } from '../styles/surface-levels';
import { webViewportHeightMinus, type WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import { useTheme } from '../theme/use-theme';
import { AppShellPanelContext } from './context';
import type { AppShellPanelProps, AppShellPanelsProps } from './types';
import { useMessages } from '../locale/messages';
import { APP_SHELL_MESSAGES } from './messages';
import { useShellCssLayout } from './use-shell-viewport';
import { useShellWidth } from './use-shell-width';
import { PanelCssContext, panelCssScope } from './panel-layout-css';
import type { PanelLayoutViewProps } from './AppShellPanelLayout';

/** The gap a panel shell uses outside one (a group composed on its own). */
const STANDALONE_GUTTER = 12;

/**
 * Take the rest of the column, spelled in LONGHANDS: these nodes keep their DOM
 * node across a `scroll` switch, and a `flex` shorthand cleared by React DOM's
 * style diff takes the longhands beside it with it (see `flexFill` in
 * `./layout.ts`).
 */
const GROW: ViewStyle = { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minHeight: 0 };
const FILL_ROW: ViewStyle = { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 };

/** The region a panel lays itself out in: the shell's, or a bounded stand-in outside one. */
function useRegion(): AppShellRegionValue {
  const region = useAppShellRegion();
  const theme = useTheme();
  return (
    region ?? {
      flow: 'bounded',
      framed: true,
      gutter: STANDALONE_GUTTER,
      viewportInset: { top: 0, bottom: 0 },
      bottomReserve: 0,
      underBottomBar: false,
      revealed: false,
      maskColor: theme.colors.background,
    }
  );
}

/** Where a panel sits in its group — positions, never the siblings' props. */
type ContentPanelComponent = React.ComponentType<ContentPanelProps>;
type ColorScopeComponent = React.ComponentType<
  Pick<BloomColorScopeProps, 'colorPreset' | 'asChild' | 'children'>
>;

export function createAppShellPanels(
  ContentPanel: ContentPanelComponent,
  BloomColorScope: ColorScopeComponent,
  PanelLayoutView: React.ComponentType<PanelLayoutViewProps>,
  ScrollArea: React.ComponentType<ScrollAreaProps>,
) {
  /** The page veil while the reveal drawer is open — pressing it is the shell's job. */
  function RevealVeil() {
    const theme = useTheme();
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: Z_INDEX.floating,
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
        }}
      />
    );
  }

  /**
   * The panel's content box. `content` scroll: a plain growing column — the
   * content scrolls itself, or (growing region) the page does, and the bottom
   * chrome is reserved under it. `panel` scroll in a bounded region: Bloom's
   * own `ScrollView`, clearing the occupied bottom edge.
   */
  function PanelBody({
    scroll,
    bottomReserve,
    children,
  }: {
    scroll: 'content' | 'panel';
    /** What a GROWING panel reserves under its content; `null` for a bounded one. */
    bottomReserve: number | null;
    children: React.ReactNode;
  }) {
    const bottomEdge = useBottomEdgeInset();
    const fill = useOptionalSurfaceFill();
    if (scroll === 'panel' && bottomReserve === null) {
      return (
        <ScrollArea style={GROW} contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomEdge }}>
          {children}
        </ScrollArea>
      );
    }
    return (
      <View style={GROW}>
        {children}
        {bottomReserve ? (
          // The bottom chrome's clearance, painted in the fill the panel
          // publishes — the colour a `Screen` page paints — rather than left as
          // padding over the panel's material: a framed panel's sheen darkens
          // toward its foot, and padding showed it as a band under every short
          // page once the page stopped overflowing the panel.
          <View
            testID="app-shell-panel-reserve"
            style={{ height: bottomReserve, flexShrink: 0, backgroundColor: fill }}
          />
        ) : null}
      </View>
    );
  }

  /** A panel that is the whole region: grows with a document, fills a bounded one. */
  function SolePanel({
    id,
    header,
    scroll = 'content',
    appearance,
    chrome,
    surfaceClassName,
    surfaceColor,
    colorPreset,
    errorBoundary = false,
    children,
    testID,
  }: AppShellPanelProps) {
    const region = useRegion();
    const document = region.flow === 'document';
    const growing = region.flow !== 'bounded';
    const { top, bottom } = region.viewportInset;
    return (
      <AppShellPanelContext.Provider
        value={{ id, alone: true, framed: region.framed, visibilityReady: true }}
      >
        <BloomColorScope colorPreset={colorPreset} asChild>
          <ContentPanel
            appearance={appearance}
            errorBoundary={errorBoundary}
            maskColor={region.maskColor}
            framed={region.framed || region.revealed}
            chrome={region.revealed ? 'none' : chrome}
            surfaceClassName={surfaceClassName}
            surfaceColor={surfaceColor}
            fill={!growing}
            // A growing panel's frame is a screen-tall sticky rectangle pinned
            // where the panel starts; a bounded panel's box IS the visible area.
            overlaySizing={growing ? 'viewport' : 'panel'}
            overlayInset={growing ? { top, bottom } : undefined}
            surfaceStyle={{
              ...GROW,
              // A short page still paints one screen of surface; a long one grows.
              ...(document ? { minHeight: webViewportHeightMinus(top + bottom) } : null),
            }}
            contentStyle={GROW}
          >
            <View testID={testID} style={GROW}>
              {header}
              <PanelBody scroll={scroll} bottomReserve={growing ? region.bottomReserve : null}>
                {children}
              </PanelBody>
            </View>
            {region.revealed ? <RevealVeil /> : null}
          </ContentPanel>
        </BloomColorScope>
      </AppShellPanelContext.Provider>
    );
  }

  /** A panel inside a group, once it is known to be drawn. */
  /** Compatibility singleton; groups below delegate to the shared panel renderer. */
  function AppShellPanel(props: AppShellPanelProps) {
    return <SolePanel {...props} />;
  }
  AppShellPanel.displayName = 'AppShellPanel';

  /** The JSX family is an adapter: one renderer owns group geometry, chrome and scroll. */
  function AppShellPanels({
    scope: compositionScope = 'region',
    layout,
    children,
    appearance = 'separated',
    collapseBelow,
    show,
    widths,
    onWidthsChange,
    spans,
    onSpansChange,
    testID,
  }: AppShellPanelsProps) {
    const inheritedRegion = useRegion();
    const nested = useContext(ContentPanelNestingContext);
    const parentFill = useOptionalSurfaceFill();
    const local = compositionScope === 'local';
    const region: AppShellRegionValue = local
      ? {
          ...inheritedRegion,
          flow: 'bounded',
          viewportInset: { top: 0, bottom: 0 },
          bottomReserve: 0,
          underBottomBar: false,
          maskColor: parentFill ?? inheritedRegion.maskColor,
        }
      : inheritedRegion;
    const { width, onLayout } = useShellWidth();
    const scope = panelCssScope(useId());
    const { messages } = useMessages(APP_SHELL_MESSAGES);
    const css = useShellCssLayout();
    const panels = Children.toArray(children)
      .filter(isValidElement)
      .map((child, index) => {
        const { children: content, id, ...props } = child.props as AppShellPanelProps;
        return {
          ...props,
          resizeLabel: props.resizeLabel ?? messages.resizePanes,
          id: id ?? String(child.key ?? `panel-${index}`),
          content,
        };
      });
    const gap =
      layout?.gap ??
      ((layout?.appearance ?? appearance) === 'joined' ||
      (layout?.appearance ?? appearance) === 'plain' ||
      !region.framed
        ? 1
        : region.gutter);
    const box =
      region.flow === 'document'
        ? {
            height: webViewportHeightMinus(region.viewportInset.top + region.viewportInset.bottom),
            flexShrink: 0,
          }
        : GROW;
    return (
      <View
        testID={testID ? `${testID}-frame` : undefined}
        onLayout={css ? undefined : onLayout}
        {...(css ? { dataSet: { bloomLayout: scope } } : {})}
        style={[
          box,
          { minWidth: 0, alignSelf: 'stretch' },
          css ? ({ containerType: 'inline-size', containerName: scope } as WebCssStyle) : null,
        ]}
      >
        <PanelCssContext.Provider value={css ? scope : null}>
          <BottomEdgeProvider inherit={!local}>
            <ContentPanelNestingContext.Provider value={local ? false : nested}>
              <AppShellRegionContext.Provider value={{ ...region, flow: 'bounded' }}>
                <PanelLayoutView
                  eligibilityFromGroup
                  layout={{
                    panels,
                    appearance,
                    collapseBelow,
                    activePanel: show,
                    widths,
                    onWidthsChange,
                    spans,
                    onSpansChange,
                    flow: 'bounded',
                    horizontalScroll: 'contained',
                    gap,
                    ...layout,
                  }}
                  shellWidth={width}
                  gap={gap}
                  testID={testID}
                />
              </AppShellRegionContext.Provider>
            </ContentPanelNestingContext.Provider>
          </BottomEdgeProvider>
        </PanelCssContext.Provider>
      </View>
    );
  }
  AppShellPanels.displayName = 'AppShellPanels';

  return { AppShellPanel, AppShellPanels };
}
