import type { MotionSpec } from '../motion/spec';
import type { AppShellDock, AppShellDockMotion, AppShellDockPeek } from './types';

const PEEK_SHADOW_ROOM = 12;

/**
 * A docked region's measured defaults. The motion is a desktop browser's
 * sidebar, traced on a 240 fps recording: hiding and showing are one spring
 * (90% of the travel in 100 ms, a 1–2 pt overshoot at ~0.15 s, at rest by
 * ~0.27 s); the peek slides in on a slightly quicker spring (93% in 66 ms) and
 * leaves on a 150 ms ease-in-out. A fading peek fades on the slide's own
 * motion unless given its own.
 */
export const DOCK_DEFAULTS = {
  motion: {
    show: { response: 0.215, dampingRatio: 0.79 },
    hide: { response: 0.215, dampingRatio: 0.79 },
    peekIn: { response: 0.185, dampingRatio: 0.77 },
    peekOut: { duration: 150, easing: [0.645, 0.045, 0.355, 1] },
    peekFadeIn: { response: 0.185, dampingRatio: 0.77 },
    peekFadeOut: { duration: 150, easing: [0.645, 0.045, 0.355, 1] },
  } satisfies Required<AppShellDockMotion>,
  peek: {
    trigger: 'hover',
    edge: 8,
    inset: 5,
    radius: 12,
    hideDelay: 120,
    appearance: 'surface',
    fade: false,
  } satisfies Required<AppShellDockPeek>,
  /** Past the window's edge by this much more than its own size, so its shadow leaves too. */
  shadowRoom: PEEK_SHADOW_ROOM,
} as const;

export interface ResolvedDock {
  motion: Required<{ [K in keyof AppShellDockMotion]: MotionSpec }>;
  peek: Required<AppShellDockPeek> | null;
}

const finite = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback;

export function resolveDock(dock: AppShellDock | undefined): ResolvedDock | null {
  if (!dock) return null;
  const motion = dock.motion ?? {};
  const peek = dock.peek === true ? {} : dock.peek || null;
  const defaults = DOCK_DEFAULTS.peek;
  const peekIn = motion.peekIn ?? DOCK_DEFAULTS.motion.peekIn;
  const peekOut = motion.peekOut ?? DOCK_DEFAULTS.motion.peekOut;
  return {
    motion: {
      show: motion.show ?? DOCK_DEFAULTS.motion.show,
      hide: motion.hide ?? motion.show ?? DOCK_DEFAULTS.motion.hide,
      peekIn,
      peekOut,
      peekFadeIn: motion.peekFadeIn ?? peekIn,
      peekFadeOut: motion.peekFadeOut ?? peekOut,
    },
    peek: peek
      ? {
          trigger: peek.trigger ?? defaults.trigger,
          edge: finite(peek.edge, defaults.edge),
          inset: finite(peek.inset, defaults.inset),
          radius: finite(peek.radius, defaults.radius),
          hideDelay: finite(peek.hideDelay, defaults.hideDelay),
          appearance: peek.appearance ?? defaults.appearance,
          fade: peek.fade ?? defaults.fade,
        }
      : null,
  };
}

/**
 * The room a docked region takes in the layout at `progress` (0 hidden, 1
 * shown): from `hidden` (a flush region leaves the frame's own inset behind)
 * to `shown`, so the content's edge travels with the region.
 */
export function dockExtent(shown: number, hidden: number, progress: number): number {
  'worklet';
  return hidden + (shown - hidden) * progress;
}

/**
 * How far the region's content sits back past its edge at `progress`: its
 * whole size hidden, none shown. Multiply by the edge's sign (−1 toward the
 * start edge in LTR or the top; +1 toward the start edge in RTL).
 */
export function dockOffset(size: number, progress: number): number {
  'worklet';
  return -size * (1 - progress);
}

/**
 * The floating peek's offset from its resting place (`inset` from the edge) at
 * `progress` (0 out, 1 in). Out, its far side is `shadowRoom − inset` past the
 * window's edge, so its shadow leaves too.
 */
export function peekOffset(size: number, progress: number): number {
  'worklet';
  return -(size + PEEK_SHADOW_ROOM) * (1 - progress);
}

export type PeekPhase = 'closed' | 'open' | 'closing';

/**
 * How present a fading peek is meant to be (0 gone, 1 there), and the motion
 * that takes it there; `null` motion lands at once. Only the peek's own
 * opening and closing fade: hiding, showing and docking from a peek keep the
 * region whole, and a region that has finished hiding waits at 0 so its next
 * peek fades in from nothing.
 */
export function peekFadeTarget(
  dock: ResolvedDock | null,
  state: { hidden: boolean; phase: PeekPhase; settledHidden: boolean },
): { presence: number; motion: MotionSpec | null } {
  if (!dock?.peek?.fade || !state.hidden) return { presence: 1, motion: null };
  if (state.phase === 'open') return { presence: 1, motion: dock.motion.peekFadeIn };
  if (state.phase === 'closing') return { presence: 0, motion: dock.motion.peekFadeOut };
  return { presence: state.settledHidden ? 0 : 1, motion: null };
}
