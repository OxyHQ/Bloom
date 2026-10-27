import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  runOnJS,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useControllableState } from '../hooks/use-controllable-state';
import { IS_WEB } from '../styles/platform';
import { animateWithSpec, motionDurationMs } from '../motion/spec';
import { NO_DOCK, type AppShellDockState } from './context';
import { resolveDock, type PeekPhase, type ResolvedDock } from './dock';
import type { AppShellDock } from './types';

const LANDING_FALLBACK_MS = 250;

export interface EdgeDock {
  /** A dock is configured and its region is in flow. */
  enabled: boolean;
  resolved: ResolvedDock | null;
  /** Out of the layout (only while enabled). */
  hidden: boolean;
  phase: PeekPhase;
  /** Coming back from a peek docks in place: the next layout lands without motion. */
  instant: boolean;
  /** Hiding or showing is under way; the region does not peek until it lands. */
  moving: boolean;
  /** Hidden, and the motion that took it out of the layout has landed. */
  settledHidden: boolean;
  reducedMotion: boolean;
  /** Native: a fading peek's presence (0 gone, 1 there). The web reads `peekFadeTarget`. */
  fade: SharedValue<number>;
  state: AppShellDockState;
}

/**
 * One docked region's state: hidden or shown (controllable), and its peek —
 * `closed`, `open`, or `closing` while it slides out. Native motion runs on
 * the two shared values; the web reads the same state as CSS transitions.
 */
export function useEdgeDock(
  dock: AppShellDock | undefined,
  available: boolean,
  /** Web: the registered property whose `transitionend` on the shell's root lands the motion. */
  property?: string,
): EdgeDock {
  const declared = JSON.stringify(dock ?? null, (key, value) =>
    typeof value === 'function' || key === 'hidden' || key === 'defaultHidden' ? undefined : value,
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: Track the declared values rather than an inline config object identity, so a rerender never restarts the motion.
  const resolved = useMemo(() => resolveDock(dock), [declared]);
  const reducedMotion = useReducedMotion();
  const [storedHidden, setStoredHidden] = useControllableState<boolean>({
    value: dock?.hidden,
    defaultValue: dock?.defaultHidden ?? false,
    onChange: dock?.onHiddenChange,
  });
  const enabled = resolved != null && available;
  const hidden = enabled && storedHidden;
  const [phase, setPhase] = useState<PeekPhase>('closed');
  const [instant, setInstant] = useState(false);
  const [moving, setMoving] = useState(false);
  const [settledHidden, setSettledHidden] = useState(hidden);
  const goingHidden = useRef(hidden);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(hidden ? 0 : 1);
  const peekProgress = useSharedValue(0);
  const fade = useSharedValue(0);
  const fades = resolved?.peek?.fade === true;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPeekChange = useRef(dock?.onPeekChange);
  onPeekChange.current = dock?.onPeekChange;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const clearTimers = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    hideTimer.current = null;
    settleTimer.current = null;
  };
  useEffect(
    () => () => {
      clearTimers();
      if (moveTimer.current) clearTimeout(moveTimer.current);
    },
    [],
  );
  const movingRef = useRef(moving);
  movingRef.current = moving;
  const landed = useCallback(() => {
    moveTimer.current = null;
    movingRef.current = false;
    setMoving(false);
    setSettledHidden(goingHidden.current);
  }, []);

  const settle = useCallback(() => {
    if (phaseRef.current !== 'closing') return;
    setPhase('closed');
    onPeekChange.current?.(false);
  }, []);

  const slideOut = useCallback(() => {
    hideTimer.current = null;
    if (phaseRef.current !== 'open' || !resolved) return;
    phaseRef.current = 'closing';
    setPhase('closing');
    const spec = resolved.motion.peekOut;
    if (fades && !IS_WEB) animateWithSpec(fade, 0, resolved.motion.peekFadeOut, reducedMotion);
    if (IS_WEB) {
      peekProgress.value = 0;
      const ms = reducedMotion ? 0 : motionDurationMs(spec);
      if (ms === 0) settle();
      else settleTimer.current = setTimeout(settle, ms);
      return;
    }
    animateWithSpec(peekProgress, 0, spec, reducedMotion, (finished) => {
      'worklet';
      if (finished) runOnJS(settle)();
    });
  }, [resolved, reducedMotion, peekProgress, settle, fades, fade]);

  const peek = useCallback(
    (open: boolean) => {
      if (!resolved?.peek || !hidden || (open && movingRef.current)) return;
      if (!open) {
        if (phaseRef.current === 'open' && !hideTimer.current)
          hideTimer.current = setTimeout(slideOut, resolved.peek.hideDelay);
        return;
      }
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = null;
      if (phaseRef.current === 'open') return;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = null;
      const wasClosed = phaseRef.current === 'closed';
      phaseRef.current = 'open';
      setPhase('open');
      if (IS_WEB) peekProgress.value = 1;
      else animateWithSpec(peekProgress, 1, resolved.motion.peekIn, reducedMotion);
      if (fades && !IS_WEB) animateWithSpec(fade, 1, resolved.motion.peekFadeIn, reducedMotion);
      if (wasClosed) onPeekChange.current?.(true);
    },
    [resolved, hidden, reducedMotion, peekProgress, slideOut, fades, fade],
  );

  const setHidden = useCallback(
    (next: boolean) => {
      if (!resolved) return;
      // Docking from a peek lands in place; every other change moves. The flag
      // stays with the state it came with, so the style that lands it carries it.
      setInstant(!next && phaseRef.current !== 'closed');
      if (!next && phaseRef.current !== 'closed') {
        // The floating region becomes the docked one where it is.
        clearTimers();
        phaseRef.current = 'closed';
        setPhase('closed');
        peekProgress.value = 0;
        fade.value = 0;
        onPeekChange.current?.(false);
      }
      setStoredHidden(next);
    },
    [resolved, setStoredHidden, peekProgress, fade],
  );

  const target = hidden ? 0 : 1;
  const landedTarget = useRef(target);
  useEffect(() => {
    const changed = landedTarget.current !== target;
    landedTarget.current = target;
    goingHidden.current = target === 0;
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = null;
    const spec = resolved ? (target ? resolved.motion.show : resolved.motion.hide) : null;
    const animated = changed && !instant && !reducedMotion && spec != null;
    if (animated) {
      movingRef.current = true;
      setMoving(true);
    } else if (movingRef.current) landed();
    else setSettledHidden(target === 0);
    if (IS_WEB || !animated || !spec) {
      progress.value = target;
      // The web lands on the property's own `transitionend` (below); this only
      // covers a browser that cannot interpolate it, where nothing moved.
      if (animated && spec)
        moveTimer.current = setTimeout(landed, motionDurationMs(spec) + LANDING_FALLBACK_MS);
      return;
    }
    animateWithSpec(progress, target, spec, false, (finished) => {
      'worklet';
      if (finished) runOnJS(landed)();
    });
  }, [target, resolved, reducedMotion, progress, instant, landed]);

  useEffect(() => {
    if (hidden || phaseRef.current === 'closed') return;
    clearTimers();
    phaseRef.current = 'closed';
    setPhase('closed');
    peekProgress.value = 0;
    fade.value = 0;
    onPeekChange.current?.(false);
  }, [hidden, peekProgress, fade]);

  useEffect(() => {
    if (!IS_WEB || !moving || !property || typeof document === 'undefined') return;
    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName === property) landed();
    };
    document.addEventListener('transitionend', onEnd);
    return () => document.removeEventListener('transitionend', onEnd);
  }, [moving, property, landed]);

  const state = useMemo<AppShellDockState>(
    () =>
      resolved
        ? {
            available: enabled,
            hidden,
            moving,
            setHidden,
            toggleHidden: () => setHidden(!storedHidden),
            peeking: phase !== 'closed',
            peek,
            progress,
            peekProgress,
          }
        : NO_DOCK,
    [
      resolved,
      enabled,
      hidden,
      moving,
      setHidden,
      storedHidden,
      phase,
      peek,
      progress,
      peekProgress,
    ],
  );

  return {
    enabled,
    resolved,
    hidden,
    phase,
    instant,
    moving,
    settledHidden: hidden && settledHidden,
    reducedMotion,
    fade,
    state,
  };
}
