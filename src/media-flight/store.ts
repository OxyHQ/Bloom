/**
 * The media-flight registry: anchors, live surfaces, and the animation that
 * moves them.
 *
 * ## Why the animation lives HERE and not in the layer
 *
 * A flight is started by an imperative call (`flyTo`) from a screen that may be
 * about to unmount. If the layer drove the animation from an effect keyed on the
 * flight record, the first frame would be one commit late — and on web, where
 * the origin route is genuinely gone by the next commit, that frame is the one
 * the user sees. Driving the shared value at the call site makes the leg start
 * exactly when the caller says it does and leaves the layer a pure painter.
 *
 * The shared values are created with `makeMutable` rather than `useSharedValue`
 * for the same reason: they belong to a flight, not to a component, and the
 * component that paints a flight is not the one that starts it.
 *
 * ## Why the registry is anchored on `globalThis`
 *
 * Same reason as the portal group and the overlay stack: `exports` ships a
 * `react-native` → `src` condition beside the `lib/module` and `lib/commonjs`
 * forks, and a bundler can resolve `@oxyhq/bloom/media-flight` through different
 * conditions from different call sites. Two physical copies of this module would
 * each keep their own registry, and the `<MediaFlightLayer>` mounted at the app
 * root would never see the flight a screen started.
 */
import { Platform } from 'react-native';
import {
  Easing,
  makeMutable,
  runOnJS,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { RADIUS } from '../design-tokens';
import {
  CLOSE_DURATION_WEB,
  CLOSE_SPRING,
  OPEN_DURATION_WEB,
  OPEN_SPRING,
} from '../zoomable-media-gallery/constants';
import type {
  MediaFlight,
  MediaFlightAnchorNode,
  MediaFlightOptions,
  MediaSurfaceContent,
  MeasuredRect,
} from './types';

/**
 * Default corner radius of a flying box — Bloom's `radius-12`, the same value
 * the media gallery fits its media at, so a flight that lands in the gallery
 * lands on an identical shape.
 */
export const DEFAULT_FLIGHT_CORNER_RADIUS = RADIUS['radius-12'];

interface Registry {
  anchors: Map<string, MediaFlightAnchorNode>;
  flights: Map<string, MediaFlight>;
  listeners: Set<() => void>;
  /**
   * The array handed to `useSyncExternalStore`. Cached because that hook
   * compares snapshots by IDENTITY: rebuilding it per call renders the layer
   * forever (and React throws "getSnapshot should be cached" in development).
   */
  snapshot: readonly MediaFlight[];
  progress: SharedValue<number>;
}

declare global {
  // eslint-disable-next-line no-var
  var __oxyhq_bloom_media_flight__: Registry | undefined;
}

function emptyRegistry(): Registry {
  return {
    anchors: new Map(),
    flights: new Map(),
    listeners: new Set(),
    snapshot: [],
    progress: makeMutable(0),
  };
}

function registry(): Registry {
  globalThis.__oxyhq_bloom_media_flight__ ??= emptyRegistry();
  return globalThis.__oxyhq_bloom_media_flight__;
}

function publish(reg: Registry): void {
  reg.snapshot = [...reg.flights.values()];
  for (const listener of reg.listeners) listener();
}

/** Subscribe to the live-surface set. The layer's `useSyncExternalStore` half. */
export function subscribeToFlights(listener: () => void): () => void {
  const reg = registry();
  reg.listeners.add(listener);
  return () => {
    reg.listeners.delete(listener);
  };
}

/** The live surfaces, oldest first. Stable identity between changes. */
export function getFlights(): readonly MediaFlight[] {
  return registry().snapshot;
}

/** The shared progress value of the most recent leg. */
export function flightProgress(): SharedValue<number> {
  return registry().progress;
}

/**
 * Register (or clear) the node that anchors `id`.
 *
 * A `Map` re-insertion moves the key to the end, which is what makes "the most
 * recently registered node is the anchor" true even when an origin screen's
 * callback ref fires again after the destination has registered.
 */
export function registerAnchor(id: string, node: MediaFlightAnchorNode | null): void {
  const reg = registry();
  reg.anchors.delete(id);
  if (node !== null) reg.anchors.set(id, node);
}

export function measureAnchor(id: string): Promise<MeasuredRect | null> {
  const node = registry().anchors.get(id);
  if (!node) return Promise.resolve(null);
  return new Promise<MeasuredRect | null>((resolve) => {
    node.measureInWindow((x, y, width, height) => {
      // A zero-area measurement is what a node reports while it is laid out but
      // not yet on screen. Flying to it would collapse the surface to a point,
      // so it reads as "no anchor" and the caller skips the transition.
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

/** Whether a surface is currently live for `id`. */
export function hasFlight(id: string): boolean {
  return registry().flights.has(id);
}

/**
 * Take the surface for `id` live (if it is not already) and move it to `rect`.
 *
 * Retargeting mid-flight keeps the SAME `MediaFlight` record — and therefore the
 * same mounted `VideoView` — which is the whole point. A second record would be
 * a second surface for one id, and swapping between them is exactly the remount
 * that restarts playback.
 */
export function flyTo(
  id: string,
  rect: MeasuredRect,
  content: MediaSurfaceContent,
  options?: MediaFlightOptions,
): void {
  const reg = registry();
  const existing = reg.flights.get(id);

  if (existing) {
    // A retarget REPLACES the record rather than mutating it. Identity is what
    // tells React (and the React Compiler) that the leg changed: a mutated
    // record has the same identity, so a memoized read of `flight.from` would
    // keep returning the previous leg's origin forever — the exact
    // external-mutable-state stale read the compiler is documented to produce.
    // The shared value is carried over untouched, so the surface resumes rather
    // than restarting.
    const next: MediaFlight = {
      ...existing,
      // The leg that was running is abandoned where it stands: `from` becomes
      // the rect the surface is CURRENTLY at, so a retarget never snaps.
      from: interpolateRect(existing.from, existing.to, existing.progress.value),
      to: rect,
      content,
      cornerRadius: options?.cornerRadius ?? existing.cornerRadius,
      contentFit: options?.contentFit ?? existing.contentFit,
      landing: false,
      generation: existing.generation + 1,
    };
    reg.flights.set(id, next);
    animate(next, false);
    publish(reg);
    return;
  }

  // Nothing live yet. `from` is the origin rect the caller measured; without one
  // the surface simply appears at `rect` rather than flying in from a corner.
  const flight: MediaFlight = {
    id,
    content,
    from: options?.from ?? rect,
    to: rect,
    cornerRadius: options?.cornerRadius ?? DEFAULT_FLIGHT_CORNER_RADIUS,
    contentFit: options?.contentFit ?? 'cover',
    progress: makeMutable(0),
    landing: false,
    generation: 0,
  };
  reg.flights.set(id, flight);
  animate(flight, false);
  publish(reg);
}

/**
 * Aim the live surface at its anchor and release it once it lands.
 *
 * With no measurable anchor there is nothing to fly to, so the surface is
 * released immediately — whoever owns the media renders its own copy again at
 * that point, and holding a flying copy over it would double the video.
 */
export function flyBack(id: string): void {
  const flight = registry().flights.get(id);
  if (!flight) return;

  void measureAnchor(id).then((rect) => {
    // Re-read: the flight may have been released or retargeted while the
    // measurement was outstanding (`measureInWindow` is asynchronous on both
    // platforms), and landing a stale record would fly the wrong surface.
    const reg = registry();
    if (reg.flights.get(id) !== flight) return;
    if (rect === null) {
      releaseFlight(id);
      return;
    }
    const landing: MediaFlight = {
      ...flight,
      from: interpolateRect(flight.from, flight.to, flight.progress.value),
      to: rect,
      landing: true,
      generation: flight.generation + 1,
    };
    reg.flights.set(id, landing);
    animate(landing, true);
    publish(reg);
  });
}

/** Drop the surface for `id`. Called when a landing leg settles, and on teardown. */
export function releaseFlight(id: string): void {
  const reg = registry();
  if (!reg.flights.delete(id)) return;
  publish(reg);
}

/** Test seam — drops every anchor and surface. */
export function resetMediaFlight(): void {
  globalThis.__oxyhq_bloom_media_flight__ = emptyRegistry();
}

/** Rect at `t` along `from` → `to`, so a retarget resumes rather than snapping. */
function interpolateRect(from: MeasuredRect, to: MeasuredRect, t: number): MeasuredRect {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return {
    x: from.x + (to.x - from.x) * clamped,
    y: from.y + (to.y - from.y) * clamped,
    width: from.width + (to.width - from.width) * clamped,
    height: from.height + (to.height - from.height) * clamped,
  };
}

/**
 * Run one leg: 0 → 1 on the flight's own value, and on the shared `progress` a
 * consumer reads.
 *
 * Both are driven with the SAME curve rather than one deriving from the other,
 * because deriving would need a `useAnimatedReaction` — a hook, in a module with
 * no component to hang it on. Two animations on two shared values cost a few
 * bytes on the UI thread and keep the driver at the call site.
 *
 * The springs and the web timings are the media gallery's, imported rather than
 * re-tuned: a flight that lands in the gallery and the gallery's own open
 * transition are the same motion, and two copies of a spring config drift.
 */
function animate(flight: MediaFlight, landing: boolean): void {
  const reg = registry();
  const id = flight.id;
  // Only a LANDING leg ends in a release. A `finished === false` callback means
  // the leg was interrupted by a retarget, which owns the surface from then on.
  const onSettled = landing
    ? (finished?: boolean) => {
        'worklet';
        if (finished === false) return;
        runOnJS(releaseFlight)(id);
      }
    : undefined;

  flight.progress.value = 0;
  reg.progress.value = 0;

  if (Platform.OS === 'web') {
    const duration = landing ? CLOSE_DURATION_WEB : OPEN_DURATION_WEB;
    const easing = landing ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic);
    flight.progress.value = withTiming(1, { duration, easing }, onSettled);
    reg.progress.value = withTiming(1, { duration, easing });
    return;
  }

  const spring = landing ? CLOSE_SPRING : OPEN_SPRING;
  flight.progress.value = withSpring(1, spring, onSettled);
  reg.progress.value = withSpring(1, spring);
}
