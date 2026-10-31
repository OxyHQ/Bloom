/**
 * `panelLayout.retain`: panels whose content is never remounted, moved in the
 * tree or collapsed.
 *
 * Every panel's content is a child of ONE region, keyed by its id, in the
 * order the ids were first seen. Where a panel shows is geometry only: its box
 * is written as fractions of the region plus fixed offsets
 * (`retained-geometry.ts`), so reordering panels, moving one into or out of a
 * `stack`, or hiding and showing it changes styles and nothing else. A page
 * in an iframe keeps its browsing context, an editor keeps its selection, a
 * native view stays attached. A hidden panel keeps the region's full size
 * (not `display: none`): it stays laid out, invisible, inert and out of the
 * accessibility tree, so showing it again is one style change with no relayout
 * of its content.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useIsRtl } from '../hooks/use-is-rtl';
import { ResizeHandle } from '../layout/ResizeHandle';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { AppShellPanelContext } from './context';
import { PanelDropProvider, PanelDropZones, usePanelDropCoordinator } from './PanelDropZones';
import type { AppShellPanelDefinition, AppShellPanelLayout } from './panel-layout-types';
import { WINDOW_TOP_EDGE } from './panel-layout';
import { usePlatformWindow } from '../platform-surface/context';
import { useWindowChrome, WindowChromeProvider, type WindowChrome } from '../window/context';
import {
  resizeRetainedSpans,
  retainedGeometry,
  retainedOrder,
  type RetainedBoundary,
  type RetainedBox,
  type RetainedEdge,
} from './retained-geometry';

const RESIZE_HANDLE_PANE_REACH = 2;
const REGION: ViewStyle = {
  flexGrow: 1,
  flexShrink: 1,
  alignSelf: 'stretch',
  minHeight: 0,
  minWidth: 0,
};
const CONTENT: ViewStyle = { flexGrow: 1, alignSelf: 'stretch' };

const percent = (edge: RetainedEdge) => `${edge.fraction * 100}%` as `${number}%`;

function boxStyle(box: RetainedBox): WebCssStyle {
  return {
    position: 'absolute',
    insetInlineStart: percent(box.start),
    marginInlineStart: box.start.offset,
    insetInlineEnd: percent(box.end),
    marginInlineEnd: box.end.offset,
    top: percent(box.top),
    marginTop: box.top.offset,
    bottom: percent(box.bottom),
    marginBottom: box.bottom.offset,
  } as WebCssStyle;
}

const BEHIND: WebCssStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  insetInlineStart: 0,
  insetInlineEnd: 0,
  zIndex: 0,
} as WebCssStyle;
const HIDDEN: WebCssStyle = {
  ...BEHIND,
  ...(IS_WEB ? { visibility: 'hidden' } : { opacity: 0 }),
} as WebCssStyle;
const SHOWN: ViewStyle = { zIndex: 1 };

const atZero = (edge: RetainedEdge) => edge.fraction === 0 && edge.offset === 0;

/**
 * The window's chrome a retained panel holds: along the region's top edge its
 * header moves the window, and at the leading top corner it also keeps the
 * controls' room. Hidden, it holds none.
 */
function retainedWindowChrome(
  chrome: WindowChrome | null,
  box: RetainedBox | undefined,
): WindowChrome | null {
  if (chrome == null || box === undefined || !atZero(box.top)) return null;
  return atZero(box.start) ? chrome : WINDOW_TOP_EDGE;
}

function RetainedHost({
  panel,
  box,
  alone,
  windowed,
  windowChrome,
  testID,
}: {
  panel: AppShellPanelDefinition;
  box: RetainedBox | undefined;
  alone: boolean;
  /** The platform has windows: one tree whether or not this panel holds the chrome. */
  windowed: boolean;
  windowChrome: WindowChrome | null;
  testID?: string;
}) {
  const shown = box !== undefined;
  const value = useMemo(
    () => ({
      id: panel.id,
      alone,
      framed: true,
      visible: shown,
      active: shown,
      visibilityReady: true,
    }),
    [panel.id, alone, shown],
  );
  return (
    <View
      testID={testID ? `${testID}-retained-${panel.id}` : undefined}
      aria-hidden={shown ? undefined : true}
      {...(IS_WEB && !shown ? { inert: true } : null)}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      pointerEvents={shown ? 'auto' : 'none'}
      style={
        shown ? [boxStyle(box), SHOWN] : panel.hiddenPresentation === 'behind' ? BEHIND : HIDDEN
      }
    >
      <AppShellPanelContext.Provider value={value}>
        {windowed ? (
          <WindowChromeProvider value={windowChrome}>
            <View style={CONTENT}>{panel.content as ReactNode}</View>
          </WindowChromeProvider>
        ) : (
          <View style={CONTENT}>{panel.content as ReactNode}</View>
        )}
      </AppShellPanelContext.Provider>
      {shown ? (
        <PanelDropZones
          panelId={panel.id}
          fill={typeof panel.surfaceColor === 'string' ? panel.surfaceColor : undefined}
        />
      ) : null}
    </View>
  );
}

export function RetainedPanelLayout({
  layout,
  gap,
  testID,
}: {
  layout: AppShellPanelLayout;
  gap: number;
  testID?: string;
}) {
  const rtl = useIsRtl();
  const reduced = useReducedMotion();
  const windowed = usePlatformWindow() != null;
  const handedWindowChrome = useWindowChrome();
  const axis =
    typeof layout.axis === 'object'
      ? (layout.axis.base ?? 'horizontal')
      : (layout.axis ?? 'horizontal');
  const horizontal = axis === 'horizontal';
  const order = useRef<string[]>([]);
  order.current = retainedOrder(
    order.current,
    layout.panels.map((panel) => panel.id),
  );
  const byId = useMemo(
    () => new Map(layout.panels.map((panel) => [panel.id, panel])),
    [layout.panels],
  );
  const shown = useMemo(
    () => layout.panels.filter((panel) => panel.visible !== false),
    [layout.panels],
  );
  const [ownSpans, setOwnSpans] = useState<Readonly<Record<string, number>>>({});
  const declared = layout.spans ?? ownSpans;
  const geometry = useMemo(
    () => retainedGeometry(shown, { axis, gap, spans: declared }),
    [shown, axis, gap, declared],
  );
  const spans = useMemo(() => {
    const out: Record<string, number> = { ...declared };
    for (const slot of geometry.slots) {
      const lead = byId.get(slot.ids[0]!);
      if (!(out[slot.key]! > 0)) out[slot.key] = lead?.span ?? 1;
      for (const id of slot.ids) if (!(out[id]! > 0)) out[id] = byId.get(id)?.span ?? 1;
    }
    return out;
  }, [declared, geometry.slots, byId]);
  const latest = useRef(spans);
  latest.current = spans;
  const onSpansChange = layout.onSpansChange;
  const controlled = layout.spans !== undefined;
  const commit = useCallback(
    (next: Record<string, number>) => {
      if (!controlled) setOwnSpans(next);
      onSpansChange?.(next);
    },
    [controlled, onSpansChange],
  );
  const size = useRef({ width: 0, height: 0 });
  const dragStart = useRef<Record<string, Readonly<Record<string, number>>>>({});
  const visibleIds = useMemo(() => shown.map((panel) => panel.id), [shown]);
  const drop = usePanelDropCoordinator(layout.drop, visibleIds, rtl, reduced);

  const boundaryHandle = (boundary: RetainedBoundary) => {
    const alongMain = boundary.level === 'main';
    const beforeIds = alongMain
      ? (geometry.slots.find((s) => s.key === boundary.before)?.ids ?? [])
      : [boundary.before];
    const lead = beforeIds.map((id) => byId.get(id)).find((panel) => panel?.resizable);
    if (!lead) return null;
    const vertical = alongMain ? !horizontal : horizontal;
    const slot = geometry.slots.find((s) => s.key === boundary.slot);
    const keys = alongMain ? geometry.slots.map((s) => s.key) : (slot?.ids ?? []);
    const free = () =>
      (vertical ? size.current.height : size.current.width) - gap * (keys.length - 1);
    const minimum = (key: string) => {
      const ids = alongMain ? (geometry.slots.find((s) => s.key === key)?.ids ?? [key]) : [key];
      return Math.max(
        0,
        ...ids.map((id) => (vertical ? byId.get(id)?.minHeight : byId.get(id)?.minWidth) ?? 0),
      );
    };
    const flip = !vertical && rtl ? -1 : 1;
    const key = `${boundary.before}|${boundary.after}`;
    const apply = (base: Readonly<Record<string, number>>, delta: number) =>
      commit(
        resizeRetainedSpans(base, keys, boundary.before, boundary.after, delta * flip, free(), {
          before: minimum(boundary.before),
          after: minimum(boundary.after),
        }),
      );
    const anchor: WebCssStyle = vertical
      ? ({
          position: 'absolute',
          top: percent(boundary.at),
          marginTop: boundary.at.offset,
          height: 0,
          insetInlineStart: percent(boundary.across.from),
          marginInlineStart: boundary.across.from.offset,
          insetInlineEnd: percent(boundary.across.to),
          marginInlineEnd: boundary.across.to.offset,
        } as WebCssStyle)
      : ({
          position: 'absolute',
          insetInlineStart: percent(boundary.at),
          marginInlineStart: boundary.at.offset,
          width: 0,
          top: percent(boundary.across.from),
          marginTop: boundary.across.from.offset,
          bottom: percent(boundary.across.to),
          marginBottom: boundary.across.to.offset,
        } as WebCssStyle);
    return (
      <View
        key={key}
        testID={testID ? `${testID}-retained-divider-${boundary.before}` : undefined}
        pointerEvents="box-none"
        style={[anchor, { zIndex: 1 }]}
      >
        <ResizeHandle
          orientation={vertical ? 'horizontal' : 'vertical'}
          variant={layout.resizeHandle}
          thickness={
            layout.resizeHandle === 'pill' ? gap + 2 * RESIZE_HANDLE_PANE_REACH : undefined
          }
          label={lead.resizeLabel}
          onResizeStart={() => {
            dragStart.current[key] = latest.current;
          }}
          onResize={(delta) => apply(dragStart.current[key] ?? latest.current, delta)}
          onResizeEnd={() => {
            delete dragStart.current[key];
          }}
          onNudge={(delta) => apply(latest.current, delta)}
        />
      </View>
    );
  };

  return (
    <PanelDropProvider value={drop}>
      <View
        testID={testID ? `${testID}-retained` : undefined}
        onLayout={(event: LayoutChangeEvent) => {
          size.current = event.nativeEvent.layout;
        }}
        style={REGION}
      >
        {order.current.map((id) => (
          <RetainedHost
            key={id}
            panel={byId.get(id)!}
            box={geometry.boxes[id]}
            alone={shown.length === 1}
            windowed={windowed}
            windowChrome={retainedWindowChrome(handedWindowChrome, geometry.boxes[id])}
            testID={testID}
          />
        ))}
        {geometry.boundaries.map(boundaryHandle)}
      </View>
    </PanelDropProvider>
  );
}
