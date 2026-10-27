/**
 * The moving parts of a docked region (`sidebar.dock`, `topBarDock`): the
 * HOST that carries the region's one mounted content between its place in the
 * layout and the floating peek, and the hover STRIP along the window's edge.
 *
 * The engine owns the SLOT, the region's room in the layout. The slot's extent
 * and the host's offset are two readings of ONE progress — a shared value on
 * native, a registered CSS custom property on the web — so the content's edge
 * and the region's far side can never drift apart mid-motion, and the web
 * runs the whole motion on the compositor with no JavaScript per frame.
 */
import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { IS_WEB } from '../styles/platform';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { motionCss, type MotionSpec } from '../motion/spec';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { PanelChrome } from '../styles/panel-chrome';
import type { WebCssStyle } from '../styles/web-view-style';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useSurfacePresenceContent } from '../surface/use-surface-presence';
import {
  dockExtent,
  dockOffset,
  peekFadeTarget,
  peekOffset,
  resolvePeekInsets,
  DOCK_DEFAULTS,
} from './dock';
import type { EdgeDock } from './use-edge-dock';

/**
 * The two VALUE-level crossings into web CSS: a length or a transform written
 * as a `calc()` of the progress property, which React Native's unions cannot
 * name. Native never reaches them.
 */
const cssLength = (css: string) => css as ViewStyle['width'];
const cssTransform = (css: string) => css as unknown as ViewStyle['transform'];

export type DockAxis = 'start' | 'top';

/** The registered progress properties, one pair per docked edge. */
export const DOCK_VARS = {
  start: { dock: '--bloom-nav-dock', peek: '--bloom-nav-peek', fade: '--bloom-nav-peek-fade' },
  top: { dock: '--bloom-top-dock', peek: '--bloom-top-peek', fade: '--bloom-top-peek-fade' },
} as const;

/**
 * Registered so the browser interpolates them: an unregistered custom property
 * changes at once, and everything reading it would jump.
 */
export const DOCK_PROPERTY_CSS = Object.values(DOCK_VARS)
  .flatMap(({ dock, peek, fade }) => [
    `@property ${dock}{syntax:'<number>';inherits:true;initial-value:1}`,
    `@property ${peek}{syntax:'<number>';inherits:true;initial-value:0}`,
    `@property ${fade}{syntax:'<number>';inherits:true;initial-value:1}`,
  ])
  .join('\n');

export function useDockProperties(active: boolean) {
  useEffect(() => {
    if (IS_WEB && active) adoptStyleSheet('bloom-edge-dock', DOCK_PROPERTY_CSS);
  }, [active]);
}

function transition(name: string, spec: MotionSpec, instant: boolean, reduced: boolean) {
  const css = motionCss(spec, reduced || instant);
  return { name, duration: css.duration, easing: css.easing };
}

/**
 * The dock progress for the web root: the value, and the transition that
 * carries it with the spec of the direction it is going. `merge` keeps
 * transitions the root already declares.
 */
export function dockRootStyle(
  docks: readonly { axis: DockAxis; dock: EdgeDock }[],
  merge?: WebCssStyle | null,
): WebCssStyle | null {
  if (!IS_WEB) return null;
  const active = docks.filter(({ dock }) => dock.resolved);
  if (!active.length) return null;
  const parts = active.map(({ axis, dock }) =>
    transition(
      DOCK_VARS[axis].dock,
      dock.hidden ? dock.resolved!.motion.hide : dock.resolved!.motion.show,
      dock.instant,
      dock.reducedMotion,
    ),
  );
  const style: WebCssStyle = {
    ...merge,
    transitionProperty: [merge?.transitionProperty, ...parts.map((p) => p.name)]
      .filter(Boolean)
      .join(', '),
    transitionDuration: [merge?.transitionDuration, ...parts.map((p) => p.duration)]
      .filter(Boolean)
      .join(', '),
    transitionTimingFunction: [merge?.transitionTimingFunction, ...parts.map((p) => p.easing)]
      .filter(Boolean)
      .join(', '),
  };
  for (const { axis, dock } of active) style[DOCK_VARS[axis].dock] = dock.hidden ? '0' : '1';
  return style;
}

/**
 * The slot's extent along its axis, from `hidden` (out of the layout) to
 * `shown`. Web reads the root's progress property; native a shared value.
 */
export function useDockSlotStyle(
  axis: DockAxis,
  dock: EdgeDock,
  shown: number | null,
  hidden: number,
) {
  const progress = dock.state.progress;
  const enabled = dock.resolved != null && shown != null;
  const nativeStyle = useAnimatedStyle(() => {
    if (!enabled || !progress || shown == null) return {};
    const extent = dockExtent(shown, hidden, progress.value);
    return axis === 'start' ? { width: extent } : { height: extent };
  }, [enabled, progress, shown, hidden, axis]);
  if (!enabled || shown == null) return null;
  if (!IS_WEB) return nativeStyle;
  const extent = cssLength(
    `calc(${hidden}px + ${shown - hidden}px * var(${DOCK_VARS[axis].dock}, 1))`,
  );
  const style: WebCssStyle = axis === 'start' ? { width: extent } : { height: extent };
  return style;
}

const CONTENT_STYLE: ViewStyle = { flexGrow: 1, alignSelf: 'stretch' };

export interface DockHostProps {
  axis: DockAxis;
  dock: EdgeDock;
  /** The content's own size along the axis: a number, or a CSS length on the web. */
  size: number | string | null;
  /** Where the slot starts, from the window's edges, so the peek can sit `inset` from them. */
  origin: { start: number; top: number; bottom: number };
  chrome: PanelChrome;
  children: ReactNode;
  testID?: string;
}

/**
 * The region's content, absolutely placed in its slot: at the slot's start,
 * sliding back past the edge by its own size as the slot closes; or, while it
 * peeks, floating `inset` from the window's edges with its own backing.
 *
 * A fading peek (`peek.fade`) never fades the host: on the web its fade is a
 * third registered progress on the host that any material inside reads as its
 * `--bloom-surface-presence`, while the backing and the content fade piece by
 * piece over the same curve (`useSurfacePresenceContent`), so no material host
 * has a fading ancestor. Native has no backdrop filter: the host fades itself.
 */
export function DockHost({ axis, dock, size, origin, chrome, children, testID }: DockHostProps) {
  const rtl = useIsRtl();
  const peek = dock.resolved?.peek ?? null;
  const floating = dock.phase !== 'closed' && peek != null;
  const away = dock.hidden && !floating;
  // Offsets are negative toward the edge; the start edge is on the right in RTL.
  const flip = axis === 'start' && rtl ? -1 : 1;
  const { progress, peekProgress } = dock.state;
  const fadeProgress = dock.fade;
  const fades = floating && dock.resolved?.peek?.fade === true;
  const numericSize = typeof size === 'number' ? size : 0;
  const measured = typeof size === 'number' || IS_WEB;
  const fadeTarget = peekFadeTarget(dock.resolved, dock);
  const fadeCss = fadeTarget.motion
    ? motionCss(fadeTarget.motion, dock.reducedMotion)
    : { duration: '0ms', easing: 'linear' };
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  useSurfacePresenceContent(contentRef, {
    presence: fadeTarget.presence,
    duration: Number.parseFloat(fadeCss.duration),
    easing: fadeCss.easing,
  });
  const nativeStyle = useAnimatedStyle(() => {
    if (!progress || !peekProgress) return {};
    // Always written: Reanimated keeps a key's last value once a style drops it.
    const opacity = { opacity: fades ? fadeProgress.value : 1 };
    if (!measured) {
      // Not measured yet: hidden sits wholly past its edge, shown in place.
      const away = progress.value < 1 && !floating;
      return axis === 'start'
        ? { ...opacity, transform: [{ translateX: away ? `${-100 * flip}%` : 0 }] }
        : { ...opacity, transform: [{ translateY: away ? '-100%' : 0 }] };
    }
    const offset =
      flip *
      (floating
        ? peekOffset(numericSize, peekProgress.value)
        : dockOffset(numericSize, progress.value));
    return axis === 'start'
      ? { ...opacity, transform: [{ translateX: offset }] }
      : { ...opacity, transform: [{ translateY: offset }] };
  }, [floating, numericSize, measured, progress, peekProgress, flip, axis, fades, fadeProgress]);

  const inset = peek?.inset ?? resolvePeekInsets(DOCK_DEFAULTS.peek.inset);
  const radius = peek?.radius ?? DOCK_DEFAULTS.peek.radius;
  const placement: WebCssStyle =
    axis === 'start'
      ? floating
        ? {
            position: 'absolute',
            top: inset.top - origin.top,
            bottom: inset.bottom - origin.bottom,
            insetInlineStart: inset.start - origin.start,
            width: typeof size === 'number' ? size : cssLength(size ?? '0px'),
          }
        : {
            position: 'absolute',
            top: 0,
            bottom: 0,
            insetInlineStart: 0,
            width: typeof size === 'number' ? size : cssLength(size ?? '0px'),
          }
      : floating
        ? {
            position: 'absolute',
            top: inset.top,
            insetInlineStart: inset.start,
            insetInlineEnd: inset.end,
          }
        : size == null && !dock.hidden
          ? // Shown before its first measurement: in flow, so the slot takes its height.
            { position: 'relative' }
          : { position: 'absolute', top: 0, insetInlineStart: 0, insetInlineEnd: 0 };
  const hover = peek?.trigger !== 'manual';
  const backing = peek?.chrome ?? {};

  let motion: WebCssStyle | null = null;
  if (IS_WEB && dock.resolved) {
    const vars = DOCK_VARS[axis];
    // Its own box: the browser resolves a percentage translate against it.
    const length = '100%';
    const translate = axis === 'start' ? 'translateX' : 'translateY';
    const towardEdge = flip === 1 ? '-1' : '1';
    const opening = dock.phase === 'open';
    const peekTransition = transition(
      vars.peek,
      opening ? dock.resolved.motion.peekIn : dock.resolved.motion.peekOut,
      !dock.hidden,
      dock.reducedMotion,
    );
    const offset = floating
      ? `${translate}(calc(${towardEdge} * (${length} + ${DOCK_DEFAULTS.shadowRoom}px) * (1 - var(${vars.peek}))))`
      : `${translate}(calc(${towardEdge} * ${length} * (1 - var(${vars.dock}, 1))))`;
    motion = {
      transitionProperty: vars.peek,
      transitionDuration: peekTransition.duration,
      transitionTimingFunction: peekTransition.easing,
      transform: cssTransform(offset),
    };
    motion[vars.peek] = opening ? '1' : '0';
    if (dock.resolved.peek?.fade && dock.hidden) {
      motion.transitionProperty = `${vars.peek}, ${vars.fade}`;
      motion.transitionDuration = `${peekTransition.duration}, ${fadeCss.duration}`;
      motion.transitionTimingFunction = `${peekTransition.easing}, ${fadeCss.easing}`;
      motion[vars.fade] = String(fadeTarget.presence);
      motion['--bloom-surface-presence'] = `var(${vars.fade})`;
      motion['--bloom-surface-presence-ms'] = '0ms';
    }
  }

  return (
    <Animated.View
      testID={testID}
      aria-hidden={away || undefined}
      accessibilityElementsHidden={away}
      importantForAccessibility={away ? 'no-hide-descendants' : 'auto'}
      {...(IS_WEB && away ? { inert: true } : {})}
      pointerEvents={away ? 'none' : 'auto'}
      onPointerEnter={floating && hover ? () => dock.state.peek(true) : undefined}
      onPointerLeave={floating && hover ? () => dock.state.peek(false) : undefined}
      style={[
        placement,
        floating ? { borderRadius: radius } : null,
        motion,
        IS_WEB ? null : nativeStyle,
      ]}
    >
      <View
        ref={contentRef}
        testID={testID ? `${testID}-content` : undefined}
        style={CONTENT_STYLE}
      >
        {floating && peek?.appearance === 'surface' ? (
          <View
            pointerEvents="none"
            style={
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                insetInlineStart: 0,
                insetInlineEnd: 0,
                borderRadius: radius,
                backgroundColor: backing.surface ?? chrome.surface,
                borderWidth: backing.borderWidth ?? 1,
                borderColor: backing.border ?? chrome.border,
                boxShadow: backing.shadow ?? chrome.shadow,
              } as WebCssStyle
            }
          />
        ) : null}
        <View
          testID={testID ? `${testID}-clip` : undefined}
          style={[CONTENT_STYLE, floating ? { borderRadius: radius, overflow: 'hidden' } : null]}
        >
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * The hover strip along the hidden region's edge that opens its peek. Not a
 * control: the region's own toggle (and `useAppShell()`) stays the accessible
 * way back, so the strip is out of focus order and the accessibility tree.
 */
export function DockEdgeStrip({
  axis,
  dock,
  testID,
}: {
  axis: DockAxis;
  dock: EdgeDock;
  testID?: string;
}) {
  const peek = dock.resolved?.peek;
  if (!peek || peek.trigger !== 'hover' || !dock.hidden || dock.moving) return null;
  const stripStyle: WebCssStyle =
    axis === 'start'
      ? { position: 'absolute', top: 0, bottom: 0, insetInlineStart: 0, width: peek.edge }
      : { position: 'absolute', top: 0, insetInlineStart: 0, insetInlineEnd: 0, height: peek.edge };
  return (
    <Pressable
      testID={testID}
      accessible={false}
      focusable={false}
      tabIndex={-1}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      onHoverIn={() => dock.state.peek(true)}
      onHoverOut={() => dock.state.peek(false)}
      style={stripStyle}
    />
  );
}
