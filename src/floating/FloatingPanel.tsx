/**
 * The anchored surface every WEB fork of `Popover`, `DropdownMenu`,
 * `ContextMenu`, `Menubar` and `Select` renders. WEB ONLY — imported by
 * `.web.tsx` files and nothing else, which is why it names `../portal/index.web`
 * outright rather than relying on a platform extension.
 *
 * What it encodes, once, instead of five times:
 *
 *  - The portal body sits inside `<OverlayRoot>`, and that `OverlayRoot` is
 *    inside the visibility guard — so the surface's rank in `overlay/stack.ts` is
 *    taken on MOUNT and a menu opened from inside a dialog paints above it. No
 *    surface here carries a `zIndex` of its own.
 *  - The dismiss layer is the shared `<Backdrop>` with its blur and dim turned
 *    off: an anchored surface is not modal, so it gets a transparent hit box
 *    rather than the wash a Dialog or a sheet uses. Routing it through
 *    `Backdrop` (instead of a bare full-screen `Pressable`) is what keeps the
 *    `pointer-events` opt-in correct — the web `Portal` root is
 *    `pointer-events: none` and the property inherits.
 *  - Placement goes through `overlay/dropdown-placement`, which fits, flips and
 *    clamps on the axis `side` names and aligns-then-clamps on the other one.
 *  - The chrome — radius, border, background, inset, elevation — is a class
 *    string (`PANEL_CLASS`), so a consumer can restyle a surface with utilities.
 *    Only what is COMPUTED stays inline: the resolved position, the caller's
 *    numeric `minWidth`/`maxWidth`, the transform origin and the motion.
 *
 * `alignOffset` is applied by SHIFTING THE ANCHOR before resolving, not by
 * nudging the result: the resolver's own clamp then still owns the align axis,
 * so an offset can never push the surface off the viewport edge. It shifts the
 * anchor on whichever axis `align` acts on — horizontal under a vertical `side`,
 * VERTICAL under `'left'`/`'right'`. Nudging the result, or hardcoding the
 * horizontal pair here, would silently move a submenu along the wrong axis.
 *
 * ── MOTION ───────────────────────────────────────────────────────────────────
 *
 * Fade + `zoom-95` + an 8px slide from the side it landed on, 200ms on
 * `--ease-out-quint`, scaling from the corner nearest the trigger — the target's
 * own enter, and the same shape reversed on the way out.
 *
 * Driven IMPERATIVELY from one shared value, which is the only mechanism
 * available here and is what both platform rules point at:
 *
 *  - A reanimated `entering` would have to be a PREDEFINED builder, and no
 *    predefined builder combines a fade with a scale and a slide. A custom
 *    `Keyframe` or custom builder additionally schedules a cleanup that PINS the
 *    element (`position: absolute` + a frozen box) at `duration × 5`.
 *  - A reanimated `exiting` is not available at all: it animates a CLONE
 *    appended to the element's parent, and this whole portal subtree unmounts
 *    together, so there is no surviving parent to hold one. `Dialog.web.tsx`
 *    reached the same conclusion from the other direction (`removeChild` throws
 *    on a concurrent unmount) and keeps its own node mounted through the exit,
 *    which is what the `phase` machine below does.
 *
 * `progress` is listed in `useAnimatedStyle`'s deps, and that is what makes it
 * tick: with no worklets babel plugin — the production reality for every Oxy
 * RN-Web app — a mapper subscribes to the shared values in its DEPS ARRAY rather
 * than to the ones it reads, so an omitted value runs the mapper once and
 * freezes it.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Backdrop, OverlayRoot } from '../overlay';
import {
  resolveDropdownPlacement,
  type DropdownPlacement,
} from '../overlay/dropdown-placement';
import { Portal } from '../portal/index.web';
import { StyledView } from '../styles/styled-primitives';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import {
  DEFAULT_ALIGN_OFFSET,
  DEFAULT_SIDE_OFFSET,
  PANEL_CLASS,
  PANEL_MOTION_DURATION,
  PANEL_MOTION_EASING,
  PANEL_MOTION_SCALE_FROM,
  PANEL_MOTION_SLIDE,
  VIEWPORT_GUTTER,
} from './constants';
import { cx } from './shared';
import type { FloatingPanelProps, FloatingSide } from './types';

/**
 * The one node: the panel's own chrome, the caller's classes, the computed
 * position and the motion transform all land on it. Built once at module scope,
 * because an element type constructed during render remounts its subtree every
 * time. Same pattern, and the same reason, as `button/Button.tsx`.
 */
const AnimatedPanel = Animated.createAnimatedComponent(StyledView);

/** `cubic-bezier(0.22, 1, 0.36, 1)`, the target's `--ease-out-quint`. */
const EASING = Easing.bezier(...PANEL_MOTION_EASING);

/**
 * `closed` renders nothing; `closing` keeps the panel mounted and frozen in
 * place while it animates out, then falls back to `closed`.
 */
type Phase = 'closed' | 'open' | 'closing';

/**
 * Which side of the anchor the surface ACTUALLY landed on, read back from the
 * resolved position rather than from the requested `side` — the resolver flips
 * when the preferred side does not fit, and the slide and the transform origin
 * both have to describe where the panel is, not where it asked to be.
 */
function resolvedSide(
  requested: FloatingSide,
  placement: DropdownPlacement,
  anchorStart: number,
): FloatingSide {
  const horizontal = requested === 'left' || requested === 'right';
  if (horizontal) return placement.left >= anchorStart ? 'right' : 'left';
  return placement.top >= anchorStart ? 'bottom' : 'top';
}

/** The corner the panel grows from: the one nearest its trigger. */
function transformOriginFor(side: FloatingSide, align: string): string {
  const cross =
    align === 'end' ? 'end' : align === 'center' ? 'center' : 'start';
  if (side === 'bottom' || side === 'top') {
    const y = side === 'bottom' ? 'top' : 'bottom';
    const x = cross === 'end' ? 'right' : cross === 'center' ? 'center' : 'left';
    return `${x} ${y}`;
  }
  const x = side === 'right' ? 'left' : 'right';
  const y = cross === 'end' ? 'bottom' : cross === 'center' ? 'center' : 'top';
  return `${x} ${y}`;
}

export function FloatingPanel({
  open,
  anchor,
  side = 'bottom',
  align = 'start',
  sideOffset = DEFAULT_SIDE_OFFSET,
  alignOffset = DEFAULT_ALIGN_OFFSET,
  dismissible = true,
  modal = true,
  onDismiss,
  label,
  role,
  minWidth,
  maxWidth,
  className,
  style,
  testID,
  children,
}: FloatingPanelProps) {
  // The mounted panel as STATE, not a bare ref: placement has to measure it,
  // and `Portal` renders null on its first pass (it resolves its host in its own
  // layout effect), so the node lands one render after the panel mounts. An
  // effect keyed only on `open` would measure nothing.
  const [panelNode, setPanelNode] = useState<View | null>(null);
  const [placement, setPlacement] = useState<DropdownPlacement | null>(null);
  const [phase, setPhase] = useState<Phase>(open ? 'open' : 'closed');
  const [lastOpen, setLastOpen] = useState(open);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const attach = useCallback((node: View | null) => {
    setPanelNode(node);
  }, []);

  // `open` drives the phase; a close goes through `closing` so the exit has time
  // to run before the subtree leaves the tree.
  //
  // Adjusted DURING RENDER rather than in an effect, and that is load-bearing.
  // `useAnchorRect` clears the anchor from a LAYOUT effect, which schedules its
  // re-render before any passive effect runs — so an effect-driven phase would
  // leave one committed render where `phase` is still `'open'` and `anchor` is
  // already `null`. That render resolves the placement to nothing and returns
  // null, which unmounts the panel and takes the exit animation with it.
  if (open !== lastOpen) {
    setLastOpen(open);
    // A surface that was never open has nothing to animate out — going through
    // `closing` there would mount an invisible panel for the exit's duration.
    setPhase(open ? 'open' : phase === 'open' ? 'closing' : 'closed');
  }

  useEffect(() => {
    if (phase !== 'closing') return;
    // Deliberately the SAME constant the exit animates over, so the unmount can
    // never land before the animation finishes or long after it.
    const timer = setTimeout(
      () => setPhase('closed'),
      reducedMotion ? 0 : PANEL_MOTION_DURATION,
    );
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);

  useLayoutEffect(() => {
    // While closing, the panel holds the position it was last placed at: the
    // anchor is already gone (`useAnchorRect` clears it on close) and a
    // re-resolve would snap the surface somewhere else mid-exit.
    if (phase === 'closing') return;
    // react-native-web resolves a `View` ref to the DOM element itself. Read
    // through the one method needed rather than asserting the whole
    // `HTMLElement` interface, and capture it as a local so the narrowing holds
    // inside `update` — a property check does not survive into a closure.
    const element = panelNode as unknown as {
      getBoundingClientRect?: () => DOMRect;
      offsetWidth?: number;
      offsetHeight?: number;
    } | null;
    const measure = element?.getBoundingClientRect;
    if (
      phase !== 'open' ||
      !anchor ||
      typeof window === 'undefined' ||
      typeof measure !== 'function'
    ) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const box = measure.call(element);
      // The LAYOUT box, not the visual one. `getBoundingClientRect` reports the
      // TRANSFORMED rectangle, and this panel is measured while its own enter is
      // still at `scale(0.95)` — so the rect is 5% small. `far` placements never
      // read the extent and looked perfect; the FLIPPED and `align="end"` ones
      // do, and were out by 5% of the surface. Measured: a 256px sub-panel read
      // as 243.2 and flipped 12.8px over its parent. `offsetWidth`/`offsetHeight`
      // are the untransformed border box, integer-rounded, which is the right
      // precision for a fit/flip decision. The rect is still the fallback for a
      // non-DOM node (a jsdom stub has neither).
      const layoutWidth = element?.offsetWidth ?? box.width;
      const layoutHeight = element?.offsetHeight ?? box.height;
      // Measured BEFORE `minWidth` is applied, so the laid-out surface can only
      // be wider than the box read here — and a wider surface wraps less, so the
      // measured height is an upper bound. Erring that way flips early in a tie,
      // never late. The panel's own `min-w-*` CLASS is already in the box, since
      // a stylesheet rule applies before a layout effect can read the node.
      const width = Math.max(layoutWidth, minWidth ?? 0);
      // The align axis is the one `side` does not name.
      const alignsVertically = side === 'left' || side === 'right';
      const shiftY = alignsVertically ? alignOffset : 0;
      const shiftX = alignsVertically ? 0 : alignOffset;
      setPlacement(
        resolveDropdownPlacement({
          anchor: {
            top: anchor.top + shiftY,
            bottom: anchor.bottom + shiftY,
            left: anchor.left + shiftX,
            right: anchor.right + shiftX,
          },
          size: { width, height: layoutHeight },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          offset: sideOffset,
          gutter: VIEWPORT_GUTTER,
          align,
          side,
        }),
      );
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [phase, anchor, panelNode, side, align, sideOffset, alignOffset, minWidth]);

  // Where the panel ended up, which is what both the slide and the origin
  // describe. Held across the exit with the placement itself.
  const landed = useMemo(() => {
    if (!placement || !anchor) return null;
    const horizontal = side === 'left' || side === 'right';
    const resolved = resolvedSide(
      side,
      placement,
      horizontal ? anchor.right : anchor.bottom,
    );
    return { side: resolved, origin: transformOriginFor(resolved, align) };
  }, [placement, anchor, side, align]);

  const [held, setHeld] = useState(landed);
  if (landed && landed !== held) setHeld(landed);
  const geometry = landed ?? held;

  const slideX =
    geometry?.side === 'right'
      ? -PANEL_MOTION_SLIDE
      : geometry?.side === 'left'
        ? PANEL_MOTION_SLIDE
        : 0;
  const slideY =
    geometry?.side === 'bottom'
      ? -PANEL_MOTION_SLIDE
      : geometry?.side === 'top'
        ? PANEL_MOTION_SLIDE
        : 0;

  // The one imperative drive. It only starts once a placement exists, so the
  // panel never paints a frame at the wrong position — before that `progress` is
  // 0, which is also fully transparent.
  useEffect(() => {
    if (phase === 'open') {
      if (!placement) return;
      progress.value = reducedMotion
        ? 1
        : withTiming(1, { duration: PANEL_MOTION_DURATION, easing: EASING });
      return;
    }
    if (phase === 'closing') {
      progress.value = reducedMotion
        ? 0
        : withTiming(0, { duration: PANEL_MOTION_DURATION, easing: EASING });
      return;
    }
    progress.value = 0;
  }, [phase, placement, reducedMotion, progress]);

  // `progress`, `slideX` and `slideY` are ALL in the deps: the shared value
  // because that is what subscribes the mapper to it without the worklets babel
  // plugin, and the two numbers because the mapper closes over them.
  const motionStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [
        { translateX: slideX * (1 - progress.value) },
        { translateY: slideY * (1 - progress.value) },
        {
          scale:
            PANEL_MOTION_SCALE_FROM + (1 - PANEL_MOTION_SCALE_FROM) * progress.value,
        },
      ],
    }),
    [progress, slideX, slideY],
  );

  useEffect(() => {
    if (phase !== 'open' || !dismissible || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Stop the key reaching a Dialog underneath: the innermost open surface is
      // the one Escape dismisses.
      event.stopPropagation();
      onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [phase, dismissible, onDismiss]);

  // The NON-modal outside press. Deliberately `pointerdown` in the CAPTURE
  // phase and never `preventDefault`: the surface has to be gone before the
  // click resolves, and the click itself has to carry on to whatever is under
  // it. The anchor is excluded by GEOMETRY rather than by node, because a
  // context menu's anchor is a bare point with no element behind it — and
  // excluding it is what lets a trigger keep toggling its own surface closed
  // instead of reopening it after this handler shut it.
  useEffect(() => {
    if (phase !== 'open' || !dismissible || modal || typeof document === 'undefined') return;
    const onPointerDown = (event: PointerEvent) => {
      const node = panelNode as unknown as Node | null;
      const target = event.target as Node | null;
      if (node && target && node.contains(target)) return;
      if (
        anchor &&
        event.clientX >= anchor.left &&
        event.clientX <= anchor.right &&
        event.clientY >= anchor.top &&
        event.clientY <= anchor.bottom
      ) {
        return;
      }
      onDismiss();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [phase, dismissible, modal, onDismiss, panelNode, anchor]);

  if (phase === 'closed') return null;
  if (phase === 'open' && !anchor) return null;

  return (
    <Portal>
      <OverlayRoot>
        {dismissible && modal && phase === 'open' ? (
          <Backdrop
            style={styles.backdrop}
            onPress={onDismiss}
            // An anchored surface dims nothing: this layer exists only to catch
            // the outside press. `Backdrop` still owns the pointer-events
            // contract, which is the whole reason it is not a bare Pressable.
            blurIntensity={0}
            dimOpacity={0}
            accessibilityLabel="Dismiss"
          />
        ) : null}
        <AnimatedPanel
          ref={attach}
          role={role}
          aria-label={label}
          testID={testID}
          className={cx(PANEL_CLASS, className)}
          style={[
            styles.panel,
            {
              // Before the first measurement the panel sits at the anchor, on
              // the side it will end up on — so the box it is measured in is
              // already the shape it will be laid out at. It is invisible until
              // then because `progress` is still 0.
              left:
                placement?.left ??
                (anchor
                  ? side === 'right'
                    ? anchor.right + sideOffset
                    : side === 'left'
                      ? anchor.left - sideOffset
                      : anchor.left
                  : 0),
              top:
                placement?.top ??
                (anchor
                  ? side === 'left' || side === 'right'
                    ? anchor.top
                    : anchor.bottom + sideOffset
                  : 0),
              minWidth,
              maxWidth,
              transformOrigin: geometry?.origin,
              // A closing panel is inert: the row under the pointer must not be
              // pressable while it fades, and the press has to reach the app.
              pointerEvents: phase === 'open' ? 'auto' : 'none',
            },
            motionStyle,
            style,
          ]}>
          {children}
        </AnimatedPanel>
      </OverlayRoot>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
  // Only what a class cannot say: `position: fixed` has no Tailwind counterpart
  // react-native-web would honour on a `View`, and it belongs with the `left` /
  // `top` the resolver computes anyway.
  panel: {
    position: WEB_POSITION_FIXED,
  },
});
