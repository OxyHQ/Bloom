import { type ComponentRef, useCallback, useMemo, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { CaptureAvatarSnapshot } from '../agent-avatar/context';
import { measureAvatar } from './geometry';
import type { ActiveAvatarFlight, AvatarFlightLayerState, AvatarFlightSpec } from './types';

export interface AvatarFlights {
  /**
   * A ref for an avatar's box, under a key of the caller's choosing. Hand it to `avatarRef` of
   * `AgentReplyIdentity` / `AgentProfile`, or to the `ref` of any `View` wrapping an avatar. Stable
   * per key.
   */
  anchor: (key: string) => (node: ComponentRef<typeof View> | null) => void;
  /**
   * Hand this to `AvatarSnapshotObserver.Provider` around the avatar at `key` and the flight leaves
   * as the picture the avatar had at that moment, not a second 3D render.
   */
  snapshot: (key: string) => (capture: CaptureAvatarSnapshot | null) => void;
  /**
   * Start the flights. Resolves once their sources are measured and captured and the flights are
   * registered, so a caller that changes its own state right after sees `isLanding` already true on
   * the first frame of the target. A flight whose source cannot be measured is dropped; with reduced
   * motion nothing flies and nothing is hidden. Resolves `true` when something is flying, `false`
   * when nothing is (no specs, reduced motion, nothing measurable, or the launch was superseded).
   */
  launch: (specs: readonly AvatarFlightSpec[]) => Promise<boolean>;
  /** Stop every flight, and any `launch` still capturing. */
  cancel: () => void;
  /** The anchor is the source of a flight still under way: hide it, the layer draws the avatar. */
  isLeaving: (key: string) => boolean;
  /** The anchor is the target of a flight still under way: hide it until the avatar arrives. */
  isLanding: (key: string) => boolean;
  /** For `AvatarFlightLayer`. */
  layer: AvatarFlightLayerState;
}

/**
 * The controller of a screen's avatar flights: where avatars are, which of them are in the air.
 * Render one `AvatarFlightLayer` with it; see `docs/avatar-flight.mdx`.
 */
export function useAvatarFlights(): AvatarFlights {
  const reduced = useReducedMotion();
  const nodes = useRef(new Map<string, ComponentRef<typeof View>>());
  const captures = useRef(new Map<string, CaptureAvatarSnapshot>());
  const anchors = useRef(new Map<string, (node: ComponentRef<typeof View> | null) => void>());
  const observers = useRef(new Map<string, (capture: CaptureAvatarSnapshot | null) => void>());
  const generation = useRef(0);
  const [state, setState] = useState<{
    flights: ActiveAvatarFlight[];
    arrived: string[];
  } | null>(null);

  const anchor = useCallback((key: string) => {
    let ref = anchors.current.get(key);
    if (!ref) {
      ref = (node: ComponentRef<typeof View> | null) => {
        if (node) nodes.current.set(key, node);
        else nodes.current.delete(key);
      };
      anchors.current.set(key, ref);
    }
    return ref;
  }, []);

  const snapshot = useCallback((key: string) => {
    let observer = observers.current.get(key);
    if (!observer) {
      observer = (capture: CaptureAvatarSnapshot | null) => {
        if (capture) captures.current.set(key, capture);
        else captures.current.delete(key);
      };
      observers.current.set(key, observer);
    }
    return observer;
  }, []);

  const launch = useCallback(
    async (specs: readonly AvatarFlightSpec[]): Promise<boolean> => {
      const run = ++generation.current;
      if (reduced || specs.length === 0) {
        setState(null);
        return false;
      }
      const flights = (
        await Promise.all(
          specs.map(async (spec): Promise<ActiveAvatarFlight | null> => {
            const capture = captures.current.get(spec.from);
            const [from, picture] = await Promise.all([
              measureAvatar(nodes.current.get(spec.from)),
              capture
                ? Promise.resolve()
                    .then(capture)
                    .catch(() => null)
                : null,
            ]);
            return from
              ? { spec, from, ...(picture ? { snapshot: Object.freeze({ ...picture }) } : {}) }
              : null;
          }),
        )
      ).filter((flight): flight is ActiveAvatarFlight => flight !== null);
      if (run !== generation.current) return false;
      setState(flights.length ? { flights, arrived: [] } : null);
      return flights.length > 0;
    },
    [reduced],
  );

  const cancel = useCallback(() => {
    generation.current++;
    setState(null);
  }, []);

  const arrive = useCallback((key: string) => {
    setState((current) => {
      if (!current || current.arrived.includes(key)) return current;
      const arrived = [...current.arrived, key];
      return arrived.length === current.flights.length ? null : { ...current, arrived };
    });
  }, []);

  const node = useCallback((key: string) => nodes.current.get(key), []);

  return useMemo<AvatarFlights>(() => {
    const pending = (match: (flight: ActiveAvatarFlight) => boolean) =>
      state?.flights.some((flight) => !state.arrived.includes(flight.spec.key) && match(flight)) ??
      false;
    return {
      anchor,
      snapshot,
      launch,
      cancel,
      isLeaving: (key) => pending((flight) => flight.spec.from === key),
      isLanding: (key) => pending((flight) => flight.spec.to === key),
      layer: {
        flights: state?.flights ?? [],
        arrived: state?.arrived ?? [],
        node,
        arrive,
        finish: cancel,
      },
    };
  }, [state, anchor, snapshot, launch, cancel, arrive, node]);
}
