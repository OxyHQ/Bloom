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
import { SURFACE_MOUNT_TIMEOUT_MS } from './constants';
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

/**
 * Bookkeeping the layer does not RENDER, kept out of the `MediaFlight` record
 * on purpose.
 *
 * The record is replaced on every visual change so its identity tells React the
 * leg moved; folding these flags into it would churn that identity on events
 * nobody paints, and folding the record into these would put mutable state back
 * in a rendered position. They are separate because they answer to different
 * consumers.
 */
interface FlightStatus {
  /** The layer has committed a surface for this id. */
  mounted: boolean;
  /** The current leg's animation has finished. */
  settled: boolean;
  /** A destination surface has reported that it is live. */
  handedOff: boolean;
  /** Waiters on `flyTo`'s promise, resolved once `mounted` turns true. */
  mountWaiters: Array<() => void>;
  mountTimer: ReturnType<typeof setTimeout> | null;
  /** Pending final removal while the surface unbinds from its player. */
  unbindTimer: ReturnType<typeof setTimeout> | null;
}

interface Registry {
  anchors: Map<string, MediaFlightAnchorNode>;
  flights: Map<string, MediaFlight>;
  status: Map<string, FlightStatus>;
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
    status: new Map(),
    listeners: new Set(),
    snapshot: [],
    progress: makeMutable(0),
  };
}

function statusFor(id: string): FlightStatus {
  const reg = registry();
  let status = reg.status.get(id);
  if (!status) {
    status = {
      mounted: false,
      settled: false,
      handedOff: false,
      mountWaiters: [],
      mountTimer: null,
      unbindTimer: null,
    };
    reg.status.set(id, status);
  }
  return status;
}

function clearTimers(status: FlightStatus): void {
  if (status.mountTimer !== null) clearTimeout(status.mountTimer);
  if (status.unbindTimer !== null) clearTimeout(status.unbindTimer);
  status.mountTimer = null;
  status.unbindTimer = null;
}

function resolveMountWaiters(status: FlightStatus): void {
  const waiters = status.mountWaiters;
  status.mountWaiters = [];
  if (status.mountTimer !== null) {
    clearTimeout(status.mountTimer);
    status.mountTimer = null;
  }
  for (const waiter of waiters) waiter();
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
 *
 * ## Why it returns a promise, and what the promise means
 *
 * It resolves once the layer has COMMITTED a surface for this id — not once
 * that surface has painted.
 *
 * The distinction is the whole ordering contract. expo-video's web player keeps
 * a `Set` of mounted `<video>` elements and, on each mount, copies
 * `currentTime`, play state, volume, muted and rate from `[...set][0]`. If the
 * set is EMPTY when the new element mounts, it returns early and the element
 * starts at zero — a restart. So the layer's surface has to enter that set while
 * the origin's is still in it, which means the caller must not tear the origin
 * down (on web: must not navigate) until this promise resolves.
 *
 * That knowledge lives here rather than in the caller, which is the point: a
 * consumer that has to know the mount order is a consumer that will get it wrong
 * once and produce an intermittent restart nobody can reproduce locally.
 *
 * Painting is deliberately NOT waited on. `MediaSurface` renders the poster
 * BEHIND the video on both platforms, and neither an unpainted `<video>` (no
 * `poster` attribute is set) nor an Android `TextureView` with the ExoPlayer
 * shutter off draws anything opaque — so the still shows through until the first
 * frame lands, and there is no black box to hide. Waiting for a decode would
 * trade an invisible problem for a laggy tap.
 */
export function flyTo(
  id: string,
  rect: MeasuredRect,
  content: MediaSurfaceContent,
  options?: MediaFlightOptions,
): Promise<void> {
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
      // NOT retargetable: `MediaSurface` captures it on first render because
      // expo-video forbids changing it at runtime, so a new value here would be
      // silently ignored by the view it is meant to configure.
      surfaceType: existing.surfaceType,
      landing: false,
      unbinding: false,
      generation: existing.generation + 1,
    };
    reg.flights.set(id, next);
    const retargeted = statusFor(id);
    retargeted.settled = false;
    animate(next, false);
    publish(reg);
    return awaitSurfaceMount(id);
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
    surfaceType: options?.surfaceType ?? 'textureView',
    progress: makeMutable(0),
    landing: false,
    unbinding: false,
    generation: 0,
  };
  reg.flights.set(id, flight);
  const status = statusFor(id);
  status.mounted = false;
  status.settled = false;
  status.handedOff = false;
  animate(flight, false);
  publish(reg);
  return awaitSurfaceMount(id);
}

/**
 * Resolve once `<MediaFlightLayer>` reports it has committed the surface, or
 * after {@link SURFACE_MOUNT_TIMEOUT_MS} — which is what happens when no layer
 * is mounted at all. Degrading to "carry on without a transition" is right;
 * never resolving would mean an app that forgot one line at its root has a feed
 * whose videos cannot be opened.
 */
function awaitSurfaceMount(id: string): Promise<void> {
  const status = statusFor(id);
  if (status.mounted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    status.mountWaiters.push(resolve);
    if (status.mountTimer !== null) return;
    status.mountTimer = setTimeout(() => {
      status.mountTimer = null;
      warnNoLayerMounted();
      resolveMountWaiters(status);
    }, SURFACE_MOUNT_TIMEOUT_MS);
  });
}

/**
 * The layer calls this from the surface's mount effect. It is the commit signal
 * `flyTo` waits on, and the only thing that makes the ordering contract above
 * true rather than hopeful.
 */
export function notifySurfaceMounted(id: string): void {
  const status = statusFor(id);
  status.mounted = true;
  resolveMountWaiters(status);
}

/** The layer calls this when a leg's animation finishes. */
export function notifySurfaceSettled(id: string): void {
  const status = statusFor(id);
  status.settled = true;
  if (status.handedOff) releaseFlight(id);
}

/**
 * A destination surface reporting that it is LIVE — it has presented a frame of
 * its own, so the flying copy is now redundant and can go.
 *
 * This is the release condition, and it is deliberately not the animation's
 * clock. Measured against production, a fullscreen video route needs ~1 s from
 * tap to first presented frame; releasing when a ~300 ms animation ends would
 * leave ~700 ms with nothing live on screen — the hole the transition exists to
 * cover, made longer.
 *
 * Wire it by giving the destination's `<MediaSurface>` a `flightId`; it calls
 * this itself on its first frame. A destination that renders something other
 * than a Bloom surface can call it directly.
 */
export function handOffFlight(id: string): void {
  const reg = registry();
  if (!reg.flights.has(id)) return;
  const status = statusFor(id);
  status.handedOff = true;
  // Mid-flight the surface is still travelling: releasing now would make it
  // vanish somewhere between the two rects. `notifySurfaceSettled` picks it up.
  if (status.settled) releaseFlight(id);
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

/**
 * Drop the surface for `id`. Called when a landing leg settles, and on teardown.
 *
 * A VIDEO surface does not go straight out. It renders for one more commit with
 * NO player first, because expo-video's web player mirrors pause across every
 * element bound to it and a `<video>` removed from the DOM is auto-paused by the
 * browser — while `unmountVideoView` only runs in a PASSIVE effect cleanup,
 * i.e. after removal and after that auto-pause. So the dying element pauses the
 * one the viewer is now watching. Measured: the reel's video paused 1 ms after
 * the flying surface left the DOM, with `currentTime` still advancing and
 * nobody having called `pause()`.
 *
 * Rendering `player={null}` for one commit runs expo-video's own `[props.player]`
 * effect while the node is STILL in the DOM, and the operative part of that is
 * NOT the unbind. `unmountVideoView` takes the element out of `_mountedVideos`
 * and leaves the `onpause` handler `_addListeners` installed, so unbinding
 * alone would still mirror. What saves it is the other half of the same
 * branch: `removeAttribute('src'); load()` (`VideoView.web.js:206`). The media
 * element load algorithm sets `paused` to true WITHOUT firing `pause`, so the
 * element goes quiet, and its later removal fires nothing either because it is
 * already paused.
 *
 * Measured in real Chrome, with controls: a playing element put through
 * `removeAttribute('src') + load()` reports events `["play"]` and nothing more,
 * while the same element paused by hand, or removed from the DOM while
 * playing, reports `["play","pause"]`. Against real builds: without this commit
 * the destination ends STOPPED (5/5), with it PLAYING (6/6) and the position
 * carried.
 *
 * DO NOT replace this with a direct `unmountVideoView` call. It looks
 * equivalent, it is the half that does not matter, and the fix would disappear
 * silently. `MediaFlight.test.tsx` makes that substitution its control, and
 * `scripts/probe-expo-video-listener-leak.mjs` measures the upstream defect
 * this steps around — run it before touching any of this. The day it prints
 * LEAK GONE, this commit and the tests that pin it can go.
 *
 * The cost is one frame in which the outgoing surface shows its poster instead
 * of video. It is already on its way out and the destination is live by then —
 * `handOff` is what got us here — so that frame is covered.
 */
export function releaseFlight(id: string): void {
  const reg = registry();
  const flight = reg.flights.get(id);

  if (flight !== undefined && flight.content.kind === 'video' && !flight.unbinding) {
    reg.flights.set(id, { ...flight, unbinding: true });
    const unbinding = statusFor(id);
    if (unbinding.unbindTimer === null) {
      // After the commit AND expo-video's passive effect, which is the whole
      // point — a microtask would run before either.
      unbinding.unbindTimer = setTimeout(() => {
        unbinding.unbindTimer = null;
        releaseFlight(id);
      }, 0);
    }
    publish(reg);
    return;
  }

  const status = reg.status.get(id);
  if (status) {
    // A waiter still parked on `flyTo`'s promise would otherwise hang until its
    // own timeout, holding a caller that has nothing left to wait for.
    clearTimers(status);
    resolveMountWaiters(status);
    reg.status.delete(id);
  }
  if (!reg.flights.delete(id)) return;
  publish(reg);
}

/** Test seam — drops every anchor and surface. */
export function resetMediaFlight(): void {
  const existing = globalThis.__oxyhq_bloom_media_flight__;
  // Timers outlive a registry swap: an unfired mount timeout from the previous
  // suite would warn — and resolve a waiter nobody is holding — inside the next.
  if (existing) for (const status of existing.status.values()) clearTimers(status);
  globalThis.__oxyhq_bloom_media_flight__ = emptyRegistry();
  hasWarnedNoLayer = false;
}

let hasWarnedNoLayer = false;

/**
 * One warning per module lifetime, and none in production — the same mechanism
 * as the optional-peer boundaries. A missing `<MediaFlightLayer>` is otherwise
 * completely silent: every `flyTo` resolves on its timeout and the app simply
 * never shows a transition, which looks like the feature not being wired rather
 * than the root not being.
 */
function warnNoLayerMounted(): void {
  if (process.env.NODE_ENV === 'production' || hasWarnedNoLayer) return;
  hasWarnedNoLayer = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[Bloom] flyTo() timed out waiting for a media surface to mount. Nothing is ' +
      'rendering <MediaFlightLayer>, so no media transition will ever run and a ' +
      'video opened from a feed will restart. Mount it ONCE at the app root ' +
      '(app/_layout.tsx), above the router.',
  );
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
  // EVERY leg reports its settlement, because the release condition is now
  // "settled AND the destination is live" and either can arrive first. A
  // `finished === false` callback means the leg was interrupted by a retarget,
  // which owns the surface from then on.
  //
  // A LANDING leg is the one case that releases on its own: it has flown back to
  // its anchor and there is nothing left to cover.
  const onSettled = (finished?: boolean) => {
    'worklet';
    if (finished === false) return;
    runOnJS(landing ? releaseFlight : notifySurfaceSettled)(id);
  };

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
