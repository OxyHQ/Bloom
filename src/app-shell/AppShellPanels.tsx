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
 * The divider is `AiChatResizeHandle`, the grip `ai-chat` already ships
 * (pointer capture on web, a `PanResponder` on native, arrow keys), anchored
 * on the resizable panel's end edge in the middle of the gap.
 */
import React, {
  Children,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
} from 'react';
import { ScrollView, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { AiChatResizeHandle } from '../ai-chat/AiChatResizeHandle';
import type { ContentPanelProps } from '../content-panel/types';
import { PanelErrorBoundary } from '../error-boundary/PanelErrorBoundary';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useAppShellRegion, type AppShellRegionValue } from '../layout/app-shell-region';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { useMessages } from '../locale/messages';
import { useOptionalSurfaceFill } from '../styles/surface-levels';
import { webViewportHeightMinus, type WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import { useTheme } from '../theme/use-theme';
import { breakpointPx } from './constants';
import { AppShellPanelContext } from './context';
import { APP_SHELL_MESSAGES } from './messages';
import type { AppShellPanelProps, AppShellPanelsProps } from './types';
import { useShellWidth } from './use-shell-width';

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
      revealed: false,
      maskColor: theme.colors.background,
    }
  );
}

/** Where a panel sits in its group — positions, never the siblings' props. */
interface PanelSlot {
  index: number;
  count: number;
  /** The group's measured width. */
  width: number;
  collapsed: boolean;
  show?: string;
  joined: boolean;
  /** The space between two panels: the gutter, or a hairline. */
  gap: number;
  /** The space is a hairline (joined, or full-bleed panels). */
  hairline: boolean;
}

const PanelSlotContext = createContext<PanelSlot | null>(null);
PanelSlotContext.displayName = 'BloomAppShellPanelSlotContext';

type ContentPanelComponent = React.ComponentType<ContentPanelProps>;
type ColorScopeComponent = React.ComponentType<
  Pick<BloomColorScopeProps, 'colorPreset' | 'asChild' | 'children'>
>;

export function createAppShellPanels(
  ContentPanel: ContentPanelComponent,
  BloomColorScope: ColorScopeComponent,
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
        <ScrollView style={GROW} contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomEdge }}>
          {children}
        </ScrollView>
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
      <AppShellPanelContext.Provider value={{ id, alone: true, framed: region.framed }}>
        <BloomColorScope colorPreset={colorPreset} asChild>
          <ContentPanel
            appearance={appearance}
            errorBoundary={errorBoundary}
            maskColor={region.maskColor}
            framed={region.framed || region.revealed}
            chrome={region.revealed ? 'none' : chrome}
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
  function GroupPanel({
    slot,
    alone,
    id,
    header,
    scroll = 'content',
    width,
    minWidth,
    maxWidth,
    resizable = false,
    onWidthChange,
    resizeLabel: resizeLabelProp,
    appearance,
    chrome,
    colorPreset,
    errorBoundary = false,
    children,
    testID,
  }: AppShellPanelProps & { slot: PanelSlot; alone: boolean }) {
    const region = useRegion();
    const theme = useTheme();
    const rtl = useIsRtl();
    const { messages } = useMessages(APP_SHELL_MESSAGES);
    const [size, setSize] = useState(width);
    // The width the panel is DRAWN at, which a narrow group can make smaller
    // than `size`; a drag starts from what the person sees. Written by the
    // layout event, read by the drag handlers — never rendered.
    const drawn = useRef(width ?? 0);
    const dragStart = useRef(0);

    const clamp = (next: number) =>
      Math.min(maxWidth ?? Number.POSITIVE_INFINITY, Math.max(minWidth ?? 0, next));
    const commit = (next: number) => {
      const settled = clamp(next);
      setSize(settled);
      onWidthChange?.(settled);
    };
    // A drag toward the end edge widens a panel whose handle is on its end.
    const toward = (dx: number) => (rtl ? -dx : dx);

    const sizing: ViewStyle = alone
      ? FILL_ROW
      : size !== undefined
        ? { flexGrow: 0, flexShrink: 1, flexBasis: size, minWidth: minWidth ?? 0, maxWidth }
        : { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: minWidth ?? 0, maxWidth };
    const handle = resizable && size !== undefined && !alone && slot.index < slot.count - 1;

    const body = (
      <View style={GROW}>
        {header}
        {/* A group is always bounded: its panels' content owns the bottom edge. */}
        <PanelBody scroll={scroll} bottomReserve={null}>
          {children}
        </PanelBody>
      </View>
    );
    const surface = slot.joined ? (
      // One shared surface: the panel is a plain column inside it.
      <View style={GROW}>
        {errorBoundary === false ? (
          body
        ) : (
          <PanelErrorBoundary {...(errorBoundary === true ? {} : errorBoundary)}>
            {body}
          </PanelErrorBoundary>
        )}
      </View>
    ) : (
      <ContentPanel
        appearance={appearance}
        errorBoundary={errorBoundary}
        maskColor={region.maskColor}
        framed={region.framed || region.revealed}
        chrome={region.revealed ? 'none' : chrome}
        fill
        overlaySizing="panel"
        surfaceStyle={GROW}
        contentStyle={GROW}
      >
        {body}
        {region.revealed ? <RevealVeil /> : null}
      </ContentPanel>
    );

    return (
      <>
        {slot.index > 0 && !alone ? (
          <View
            testID={testID ? `${testID}-gap` : undefined}
            style={{
              width: slot.gap,
              flexShrink: 0,
              alignSelf: 'stretch',
              backgroundColor: slot.hairline ? theme.colors.border : 'transparent',
            }}
          />
        ) : null}
        <View
          testID={testID}
          onLayout={(event: LayoutChangeEvent) => {
            drawn.current = event.nativeEvent.layout.width;
          }}
          // The handle reaches into the gap and the next panel; RN-web makes
          // every View a stacking context, so the panel carrying it ranks
          // above its later sibling or the next panel paints over the grip.
          style={[
            { alignSelf: 'stretch', minHeight: 0 },
            sizing,
            handle ? { zIndex: Z_INDEX.floating } : null,
          ]}
        >
          <AppShellPanelContext.Provider value={{ id, alone, framed: region.framed }}>
            <BloomColorScope colorPreset={colorPreset} asChild>
              {surface}
            </BloomColorScope>
          </AppShellPanelContext.Provider>
          {handle ? (
            <View
              pointerEvents="box-none"
              testID={testID ? `${testID}-resize-anchor` : undefined}
              style={
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  insetInlineEnd: -slot.gap / 2,
                  width: 0,
                } as WebCssStyle
              }
            >
              <AiChatResizeHandle
                label={resizeLabelProp ?? messages.resizePanes}
                onResizeStart={() => {
                  dragStart.current = drawn.current;
                }}
                onResize={(dx) => commit(dragStart.current + toward(dx))}
                onNudge={(dx) => commit(drawn.current + toward(dx))}
                testID={testID ? `${testID}-divider` : undefined}
              />
            </View>
          ) : null}
        </View>
      </>
    );
  }

  /**
   * One panel. Alone in a `panels` shell it is the whole region (a reading
   * page); inside `AppShellPanels` it is one of the group, drawn only when the
   * group's width and `show` say so.
   */
  function AppShellPanel(props: AppShellPanelProps) {
    const slot = useContext(PanelSlotContext);
    if (!slot) return <SolePanel {...props} />;
    const shown = slot.collapsed
      ? slot.show !== undefined
        ? props.id === slot.show
        : slot.index === 0
      : props.hideBelow === undefined || slot.width >= breakpointPx(props.hideBelow);
    if (!shown) return null;
    return <GroupPanel {...props} slot={slot} alone={slot.collapsed || slot.count === 1} />;
  }
  AppShellPanel.displayName = 'AppShellPanel';

  /**
   * Several panels side by side. Always a bounded box: it fills a bounded
   * region, and in a document region it is one viewport tall less the shell's
   * insets — so the document has nothing to scroll and each panel owns its own.
   */
  function AppShellPanels({
    children,
    appearance = 'separated',
    collapseBelow,
    show,
    testID,
  }: AppShellPanelsProps) {
    const region = useRegion();
    // The group's OWN box: a sidebar or an aside beside it counts.
    const { width, onLayout } = useShellWidth();
    const panels = Children.toArray(children).filter(isValidElement);
    const joined = appearance === 'joined';
    const hairline = joined || !region.framed;
    const slotBase = {
      count: panels.length,
      width,
      collapsed: collapseBelow !== undefined && width < breakpointPx(collapseBelow),
      show,
      joined,
      gap: hairline ? 1 : region.gutter,
      hairline,
    };
    const { top, bottom } = region.viewportInset;
    const box: ViewStyle =
      region.flow === 'document'
        ? { height: webViewportHeightMinus(top + bottom), flexShrink: 0 }
        : GROW;

    const row = (
      <View
        testID={testID}
        onLayout={onLayout}
        style={[{ flexDirection: 'row', alignSelf: 'stretch', minWidth: 0 }, joined ? GROW : box]}
      >
        {panels.map((panel, index) => (
          <PanelSlotContext.Provider key={panel.key ?? index} value={{ ...slotBase, index }}>
            {panel}
          </PanelSlotContext.Provider>
        ))}
      </View>
    );
    if (!joined) return row;
    return (
      <ContentPanel
        maskColor={region.maskColor}
        framed={region.framed || region.revealed}
        chrome={region.revealed ? 'none' : undefined}
        fill
        overlaySizing="panel"
        surfaceStyle={[box, { alignSelf: 'stretch' }]}
        contentStyle={GROW}
      >
        {row}
        {region.revealed ? <RevealVeil /> : null}
      </ContentPanel>
    );
  }
  AppShellPanels.displayName = 'AppShellPanels';

  return { AppShellPanel, AppShellPanels };
}
