import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useMessages } from '../locale/messages';
import { animateWithSpec, motionDurationMs, type MotionSpec } from '../motion/spec';
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { withAlpha } from '../theme/color-utils';
import { Text } from '../typography/Typography';
import { useIsRtl } from '../hooks/use-is-rtl';
import { IS_WEB } from '../styles/platform';
import { pointerEventsStyles } from '../styles/pointer-events';
import { APP_SHELL_MESSAGES } from './messages';
import {
  PANEL_DROP_EDGES,
  PANEL_DROP_MOTION,
  PANEL_DROP_PREVIEW,
  panelDropZoneEntry,
  panelDropZoneRect,
  physicalDropEdge,
  resolvePanelDropTarget,
  type PanelDropRect,
} from './panel-drop';
import type {
  AppShellPanelDrop,
  PanelDropEdge,
  PanelDropPoint,
  PanelDropStage,
  PanelDropTarget,
} from './panel-layout-types';

const ZONE_RADIUS = 20;
const DASH_INSET = 9.5;
const REST_DASH = 2;
const ACTIVE_DASH = 7 / 3;

interface PanelDropState {
  edges: readonly PanelDropEdge[];
  grown: boolean;
  target: PanelDropTarget | null;
  point: PanelDropPoint | null;
  rects: Readonly<Record<string, PanelDropRect>>;
  rtl: boolean;
  reducedMotion: boolean;
  labels: AppShellPanelDrop['labels'];
  appearance: NonNullable<AppShellPanelDrop['appearance']>;
  motion: { slide: MotionSpec; grow: MotionSpec };
  accepts: (id: string) => boolean;
  visible: (id: string) => boolean;
  register: (id: string, rect: PanelDropRect | null) => void;
}

const PanelDropContext = createContext<PanelDropState | null>(null);
export const PanelDropProvider = PanelDropContext.Provider;

const sameRect = (a: PanelDropRect | undefined, b: PanelDropRect) =>
  !!a && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
const sameTarget = (a: PanelDropTarget | null, b: PanelDropTarget | null) =>
  a === b || (!!a && !!b && a.panelId === b.panelId && a.edge === b.edge);

/**
 * Owns one drag's targets: which panels accept it, their measured window
 * boxes, when the targets have grown (after sliding in), and the resolved
 * target with its hysteresis. Pointer moves re-resolve; nothing else does.
 */
export function usePanelDropCoordinator(
  drop: AppShellPanelDrop | undefined,
  visibleIds: readonly string[],
  rtl: boolean,
  reducedMotion: boolean,
): PanelDropState | null {
  const active = !!drop?.active;
  const [rects, setRects] = useState<Readonly<Record<string, PanelDropRect>>>({});
  const [grown, setGrown] = useState(false);
  const [current, setCurrent] = useState<PanelDropTarget | null>(null);
  // Specs are data: an inline object each render must not restart the motion.
  const motionKey = JSON.stringify([drop?.motion?.slide, drop?.motion?.grow]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by value, not identity
  const motion = useMemo(
    () => ({
      slide: drop?.motion?.slide ?? PANEL_DROP_MOTION.slide,
      grow: drop?.motion?.grow ?? PANEL_DROP_MOTION.grow,
    }),
    [motionKey],
  );
  const slideMs = motionDurationMs(motion.slide);
  useEffect(() => {
    setGrown(active && reducedMotion);
    setCurrent(null);
    if (!active || reducedMotion) return;
    const timer = setTimeout(() => setGrown(true), slideMs);
    return () => clearTimeout(timer);
  }, [active, reducedMotion, slideMs]);
  const accepted = useMemo(() => {
    const allowed = drop?.panels ? new Set(drop.panels) : null;
    return new Set(visibleIds.filter((id) => !allowed || allowed.has(id)));
  }, [visibleIds, drop?.panels]);
  const accepts = useCallback((id: string) => accepted.has(id), [accepted]);
  const shown = useMemo(() => new Set(visibleIds), [visibleIds]);
  const visible = useCallback((id: string) => shown.has(id), [shown]);
  const register = useCallback((id: string, rect: PanelDropRect | null) => {
    setRects((previous) => {
      if (!rect) {
        if (!(id in previous)) return previous;
        const { [id]: _, ...rest } = previous;
        return rest;
      }
      return sameRect(previous[id], rect) ? previous : { ...previous, [id]: rect };
    });
  }, []);
  const edges = drop?.edges ?? PANEL_DROP_EDGES;
  const point = drop?.point ?? null;
  const preview = drop?.preview ?? PANEL_DROP_PREVIEW;
  const acceptingRects = useMemo(() => {
    const out: Record<string, PanelDropRect> = {};
    for (const [id, rect] of Object.entries(rects))
      if (accepted.has(id) && shown.has(id)) out[id] = rect;
    return out;
  }, [rects, accepted, shown]);
  const target =
    active && grown
      ? resolvePanelDropTarget({
          panels: acceptingRects,
          over: rects,
          point,
          current,
          edges,
          preview,
          rtl,
        })
      : null;
  if (!sameTarget(target, current)) setCurrent(target);
  const onTargetChange = useRef(drop?.onTargetChange);
  onTargetChange.current = drop?.onTargetChange;
  const reported = useRef<PanelDropTarget | null>(null);
  useEffect(() => {
    if (sameTarget(reported.current, current)) return;
    reported.current = current;
    onTargetChange.current?.(current);
  }, [current]);
  const labels = drop?.labels;
  const appearance = drop?.appearance ?? 'surface';
  return useMemo(
    () =>
      active
        ? {
            edges,
            grown,
            target: current,
            point,
            rects: acceptingRects,
            rtl,
            reducedMotion,
            labels,
            appearance,
            motion,
            accepts,
            visible,
            register,
          }
        : null,
    [
      active,
      edges,
      grown,
      current,
      point,
      acceptingRects,
      rtl,
      reducedMotion,
      labels,
      appearance,
      motion,
      accepts,
      visible,
      register,
    ],
  );
}

type Box = PanelDropRect;

function DropGlyph({ edge, color }: { edge: 'left' | 'right' | 'top' | 'bottom'; color: string }) {
  const horizontal = edge === 'left' || edge === 'right';
  return (
    <View
      style={{
        width: 20,
        height: 16,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: color,
        overflow: 'hidden',
        flexDirection: horizontal ? 'row' : 'column',
        justifyContent: edge === 'right' || edge === 'bottom' ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={
          horizontal
            ? { width: '50%', height: '100%', backgroundColor: color }
            : { height: '50%', width: '100%', backgroundColor: color }
        }
      />
    </View>
  );
}

function DropZone({
  panel,
  edge,
  stage,
  pointer,
  parentFill,
  state,
}: {
  parentFill?: string;
  panel: Box;
  edge: PanelDropEdge;
  stage: PanelDropStage;
  pointer: PanelDropPoint | null;
  state: PanelDropState;
}) {
  const theme = useTheme();
  const { messages } = useMessages(APP_SHELL_MESSAGES);
  const parent = parentFill ?? theme.colors.card;
  const side = physicalDropEdge(edge, state.rtl);
  const goal = panelDropZoneRect(panel, edge, stage, pointer, state.rtl);
  const entry = panelDropZoneEntry(panel, edge, state.rtl);
  const start = state.reducedMotion ? goal : entry;
  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const width = useSharedValue(start.width);
  const height = useSharedValue(start.height);
  const arrived = useRef(false);
  useEffect(() => {
    const spec = arrived.current ? state.motion.grow : state.motion.slide;
    arrived.current = true;
    animateWithSpec(x, goal.x, spec, state.reducedMotion);
    animateWithSpec(y, goal.y, spec, state.reducedMotion);
    animateWithSpec(width, goal.width, spec, state.reducedMotion);
    animateWithSpec(height, goal.height, spec, state.reducedMotion);
  }, [
    goal.x,
    goal.y,
    goal.width,
    goal.height,
    state.motion,
    state.reducedMotion,
    x,
    y,
    width,
    height,
  ]);
  // Window coordinates are physical; the overlay is laid out left-to-right, so
  // a translation from its top-left corner places the box in either direction.
  const box = useAnimatedStyle(
    () => ({
      width: width.value,
      height: height.value,
      transform: [{ translateX: x.value }, { translateY: y.value }],
    }),
    [x, y, width, height],
  );
  const active = stage === 'active';
  const accent = resolveAccentColors(theme.colors, 'primary', 'subtle');
  const fill = surfaceFillOn(theme, parent);
  const quiet = surfaceTextOn(theme, fill);
  const translucentInk = theme.isDark ? '#ffffff' : '#000000';
  const paint =
    state.appearance === 'translucent'
      ? active
        ? {
            fill: withAlpha(theme.colors.primary, theme.isDark ? 0.16 : 0.12),
            edge: withAlpha(translucentInk, 0.08),
            dash: theme.colors.primary,
            ink: theme.colors.primary,
          }
        : {
            fill: theme.isDark ? 'rgba(255, 236, 214, 0.04)' : withAlpha('#ffffff', 0.45),
            edge: withAlpha(translucentInk, 0.08),
            dash: withAlpha(translucentInk, 0.1),
            ink: withAlpha(translucentInk, theme.isDark ? 0.6 : 0.55),
          }
      : active
        ? {
            fill: accent.background,
            edge: accent.foreground,
            dash: accent.foreground,
            ink: accent.foreground,
          }
        : {
            fill,
            edge: hairlineOn(theme, parent),
            dash: quiet.textGraphical,
            ink: quiet.textSecondary,
          };
  const label =
    state.labels?.[edge] ??
    (side === 'left'
      ? messages.addSplitLeft
      : side === 'right'
        ? messages.addSplitRight
        : side === 'top'
          ? messages.addSplitTop
          : messages.addSplitBottom);
  return (
    <Animated.View
      testID={`bloom-panel-drop-${edge}`}
      {...{ dataSet: { bloomPanelDrop: edge, bloomPanelDropStage: stage } }}
      style={[
        {
          position: 'absolute',
          borderRadius: ZONE_RADIUS,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: paint.edge,
          backgroundColor: paint.fill,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          overflow: 'hidden',
        },
        box,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: DASH_INSET,
          bottom: DASH_INSET,
          left: DASH_INSET,
          right: DASH_INSET,
          borderRadius: ZONE_RADIUS - DASH_INSET,
          borderStyle: 'dashed',
          borderWidth: active ? ACTIVE_DASH : REST_DASH,
          borderColor: paint.dash,
        }}
      />
      <DropGlyph edge={side} color={paint.ink} />
      <Text
        variant="body-2-semibold"
        numberOfLines={2}
        style={{ color: paint.ink, textAlign: 'center', paddingHorizontal: DASH_INSET + 4 }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

/**
 * The targets on one panel while a drag is active: an overlay over the panel
 * that never takes the pointer, measures the panel's window box for the
 * resolver, and draws each edge's target at its stage.
 */
export function PanelDropZones({ panelId, fill }: { panelId: string; fill?: string }) {
  const state = useContext(PanelDropContext);
  // Targets are placed in physical window coordinates, whatever the reading
  // direction: the overlay pins its own direction rather than mirroring them.
  const rtl = useIsRtl();
  // Every visible panel is measured (the pointer may be over the dragged item's
  // own panel); only an accepting one draws targets.
  const measured = !!state?.visible(panelId);
  const accepting = !!state?.accepts(panelId);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const register = state?.register;
  const measure = useCallback(() => {
    if (!register) return;
    ref.current?.measureInWindow?.((x, y, width, height) =>
      register(panelId, { x, y, width, height }),
    );
  }, [register, panelId]);
  useEffect(() => {
    if (!measured || !register) return;
    measure();
    return () => register(panelId, null);
  }, [measured, register, measure, panelId]);
  if (!state || !measured) return null;
  const rect = state.rects[panelId];
  const local = size ? { x: 0, y: 0, width: size.width, height: size.height } : null;
  const pointer =
    rect && state.point ? { x: state.point.x - rect.x, y: state.point.y - rect.y } : null;
  return (
    <View
      ref={ref}
      testID={`bloom-panel-drop-zones-${panelId}`}
      {...(rtl && IS_WEB ? { dir: 'ltr' } : null)}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((previous) =>
          previous && previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
        measure();
      }}
      style={[
        StyleSheet.absoluteFill,
        pointerEventsStyles.none,
        {
          overflow: 'hidden',
          zIndex: 2,
          direction: 'ltr',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        },
      ]}
    >
      {local && accepting
        ? state.edges.map((edge) => {
            const hit = state.target?.panelId === panelId && state.target.edge === edge;
            return (
              <DropZone
                key={edge}
                panel={local}
                edge={edge}
                stage={!state.grown ? 'rest' : hit ? 'active' : 'grown'}
                pointer={hit ? pointer : null}
                parentFill={fill}
                state={state}
              />
            );
          })
        : null}
    </View>
  );
}
