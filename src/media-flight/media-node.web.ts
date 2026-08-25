/**
 * ONE DOM node per media id, for its whole life.
 *
 * ## Why this exists
 *
 * expo-video's web player keeps a SET of mounted `<video>` elements and keeps
 * them in step: `mountVideoView` adds an element and then copies play state and
 * `currentTime` onto it from `[...set][0]`, and `_addListeners` gives every
 * element an `onpause` that pauses all the OTHERS. `unmountVideoView` deletes
 * the element from the set and nothing more — the handlers it installed are
 * never removed by anything in the package.
 *
 * So an element on its way out still governs the player. The browser pauses a
 * `<video>` the moment it leaves the document, that pause runs the dead
 * element's handler, and the handler stops the element the viewer is watching.
 *
 * Measured against the real `VideoPlayerWeb` (expo-video 57.0.2), across every
 * topology a consumer can produce on one shared player:
 *
 * ```
 * origin dies BEFORE the destination mounts   ct=0      playing   (restarts)
 * origin dies AFTER  the destination mounts   ct=4.28   paused    (freezes)
 * one element, re-parented                    ct=4.28   playing
 * ```
 *
 * TWO ELEMENTS GIVE THE POSITION OR THE PLAYBACK, NEVER BOTH. That is not a
 * property of the flight layer — the first two rows have no Bloom surface in
 * them at all — it is a property of two elements sharing one player. The only
 * topology that gives both is one element that is never unmounted and never
 * removed from the document.
 *
 * ## How a node survives its host
 *
 * A `<video>` React renders belongs to React: when the host unmounts, React
 * removes it, and if anything has moved it in the meantime React's
 * `parent.removeChild(node)` throws. So the node cannot be owned by either end.
 *
 * Instead Bloom creates a WRAPPER outside React (`document.createElement`) and
 * the layer renders the media into it with `createPortal`. A portal's container
 * is not part of React's tree — React reconciles the media against the wrapper
 * and never against the document — so moving the wrapper between hosts with
 * `appendChild` is invisible to React. The container's IDENTITY never changes,
 * which is the whole trick: `createPortal` to a container that CHANGES unmounts
 * and remounts, which is exactly what we are avoiding.
 *
 * And a synchronous move does not pause the video. HTML's removal steps for a
 * media element await a stable state and then abort if the element is back in a
 * document — so `appendChild` from one parent to another is not a removal as
 * far as playback is concerned. (This is why re-parenting a `<video>` works and
 * re-parenting an `<iframe>` does not: an iframe reloads.)
 *
 * ## Claims
 *
 * Hosts do not move the node themselves; they CLAIM the id and the registry
 * decides. A flight outranks a host, so the layer keeps the node for the whole
 * leg even though the destination has already mounted and claimed it — and the
 * frame the flight lets go is the frame the destination takes it, with no gap
 * and no second element. With no claim at all the node parks in a holder that
 * is attached to the document but invisible, because a parked node that was
 * DETACHED would pause.
 */
import { hasFlight } from './store';
import type { MediaSurfaceContent, MediaVideoSlot } from './types';

/** What the layer paints into a shared node, as its current holder wants it. */
export interface MediaNodeRender {
  content: MediaSurfaceContent;
  contentFit: 'contain' | 'cover';
  /** The consumer's own video element, if it brought one. Compared by identity. */
  renderVideo: MediaVideoSlot | undefined;
  nativeControls: boolean;
  accessibilityLabel: string | undefined;
  /** Forwarded to the media, so a consumer keeps its own first-frame signal. */
  flightId: string | undefined;
}

/** A flight outranks a host: the layer holds the node until the leg ends. */
export const HOST_RANK = 0;
export const FLIGHT_RANK = 1;

interface MediaNodeClaim {
  el: HTMLElement;
  rank: number;
  /** Registration order, so the most recent host wins among equals. */
  seq: number;
  /**
   * What this claimant wants painted — or `undefined` for a claim that decides
   * only WHERE the node lives.
   *
   * The flight is the second kind, and that distinction is load-bearing. A
   * flight that published a render of its own would replace whatever the hosts
   * were painting for the length of the leg, and if a consumer brought its own
   * element (`renderVideo`) the flight would swap it out and back — two
   * remounts, in the middle of the one operation whose entire purpose is that
   * the element is never rebuilt. Measured: the consumer's `<video>` ended the
   * flight as a different node, with the original left disconnected.
   */
  render: MediaNodeRender | undefined;
}

interface MediaNodeRecord {
  wrapper: HTMLDivElement;
  claims: MediaNodeClaim[];
  /**
   * How the media is painted right now: the top claim's, or — while the node is
   * PARKED between hosts — the last claim's.
   *
   * Parking has to keep painting. A node the layer stopped rendering would lose
   * its element to React, which is the removal this whole module exists to
   * avoid, and it would lose it exactly in the gap between the origin
   * unmounting and the destination mounting: the moment of the flight.
   */
  render: MediaNodeRender;
}

/** What the layer needs in order to paint one shared node. */
export interface MediaNodeView {
  id: string;
  wrapper: HTMLDivElement;
  render: MediaNodeRender;
}

interface NodeRegistry {
  nodes: Map<string, MediaNodeRecord>;
  listeners: Set<() => void>;
  /** Cached for `useSyncExternalStore`, which compares snapshots by identity. */
  snapshot: readonly MediaNodeView[];
  holder: HTMLElement | null;
  seq: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __oxyhq_bloom_media_nodes__: NodeRegistry | undefined;
}

function registry(): NodeRegistry {
  globalThis.__oxyhq_bloom_media_nodes__ ??= {
    nodes: new Map(),
    listeners: new Set(),
    snapshot: [],
    holder: null,
    seq: 0,
  };
  return globalThis.__oxyhq_bloom_media_nodes__;
}

/** Where a node with no holder waits: in the document, and not on screen. */
const HOLDER_ID = 'bloom-media-holder';

function holder(reg: NodeRegistry): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (reg.holder !== null && reg.holder.isConnected) return reg.holder;
  const existing = document.getElementById(HOLDER_ID);
  if (existing !== null) {
    reg.holder = existing;
    return existing;
  }
  const created = document.createElement('div');
  created.id = HOLDER_ID;
  // Attached, so nothing pauses; 1x1 and transparent, so nothing shows. NOT
  // `display: none` — a video in a `display: none` subtree keeps playing in
  // every browser that matters, but it also stops presenting frames, and the
  // point of parking is that the media survives untouched.
  created.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
  created.setAttribute('aria-hidden', 'true');
  document.body.appendChild(created);
  reg.holder = created;
  return created;
}

function makeWrapper(): HTMLDivElement {
  const wrapper = document.createElement('div');
  // Fills whichever box currently hosts it. `pointer-events: auto` is explicit
  // and load-bearing: a host may sit inside a `pointer-events: none` layer (a
  // poster overlay, a flying surface), and the media inside this wrapper is
  // the one thing in there that a viewer may need to press.
  wrapper.style.cssText =
    'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:auto;';
  wrapper.setAttribute('data-bloom-media-node', '');
  return wrapper;
}

function recordFor(id: string, render: MediaNodeRender | undefined): MediaNodeRecord {
  const reg = registry();
  let record = reg.nodes.get(id);
  if (!record) {
    // A position-only claim can be the first one in: a flight can take off
    // before the host it flies from has committed. `EMPTY_RENDER` paints
    // nothing until a host says what, which is the honest state.
    record = { wrapper: makeWrapper(), claims: [], render: render ?? EMPTY_RENDER };
    reg.nodes.set(id, record);
  }
  return record;
}

/** Nothing to paint yet. Replaced by the first host claim that arrives. */
const EMPTY_RENDER: MediaNodeRender = {
  content: { uri: '' },
  contentFit: 'cover',
  renderVideo: undefined,
  nativeControls: false,
  accessibilityLabel: undefined,
  flightId: undefined,
};

/** The claim that currently holds the node: highest rank, then most recent. */
function topClaim(record: MediaNodeRecord): MediaNodeClaim | null {
  return pick(record.claims);
}

/** The highest-ranked claim that says what to PAINT. See `MediaNodeClaim.render`. */
function topRender(record: MediaNodeRecord): MediaNodeClaim | null {
  return pick(record.claims.filter((claim) => claim.render !== undefined));
}

function pick(claims: readonly MediaNodeClaim[]): MediaNodeClaim | null {
  let best: MediaNodeClaim | null = null;
  for (const claim of claims) {
    if (best === null || claim.rank > best.rank || (claim.rank === best.rank && claim.seq > best.seq)) {
      best = claim;
    }
  }
  return best;
}

/**
 * Put the wrapper where its top claim says, in ONE synchronous move.
 *
 * The `parentElement` check is not an optimisation: re-appending to the same
 * parent is a remove-then-insert, and doing that per render would put the media
 * through the removal path it exists to avoid.
 */
function place(record: MediaNodeRecord): void {
  const reg = registry();
  const target = topClaim(record)?.el ?? holder(reg);
  if (target === null) return;
  if (record.wrapper.parentElement === target) return;
  target.appendChild(record.wrapper);
}

function sameRender(a: MediaNodeRender, b: MediaNodeRender): boolean {
  if (a.contentFit !== b.contentFit) return false;
  if (a.renderVideo !== b.renderVideo) return false;
  if (a.nativeControls !== b.nativeControls) return false;
  if (a.accessibilityLabel !== b.accessibilityLabel) return false;
  if (a.flightId !== b.flightId) return false;
  const x = a.content;
  const y = b.content;
  if (x.kind !== y.kind) return false;
  if (x.kind === 'video' && y.kind === 'video') {
    return x.player === y.player && x.poster === y.poster;
  }
  return x.kind !== 'video' && y.kind !== 'video' && x.uri === y.uri;
}

function publish(reg: NodeRegistry): void {
  const next: MediaNodeView[] = [];
  for (const [id, record] of reg.nodes) {
    record.render = topRender(record)?.render ?? record.render;
    next.push({ id, wrapper: record.wrapper, render: record.render });
  }
  const previous = reg.snapshot;
  const unchanged =
    previous.length === next.length &&
    previous.every((view, i) => {
      const candidate = next[i];
      return (
        candidate !== undefined &&
        candidate.id === view.id &&
        candidate.wrapper === view.wrapper &&
        sameRender(candidate.render, view.render)
      );
    });
  // Identity is the signal `useSyncExternalStore` reads. Publishing a fresh
  // array for an unchanged set renders the layer forever.
  if (unchanged) {
    for (const listener of reg.listeners) listener();
    return;
  }
  reg.snapshot = next;
  for (const listener of reg.listeners) listener();
}

/**
 * Claim the shared node for `id` into `el`.
 *
 * Idempotent for an unchanged claim: called from a layout effect on every
 * render, it moves the node once and publishes nothing afterwards.
 */
export function claimMediaNode(
  id: string,
  el: HTMLElement,
  rank: number,
  render?: MediaNodeRender,
): void {
  const reg = registry();
  const record = recordFor(id, render);
  const existing = record.claims.find((claim) => claim.el === el && claim.rank === rank);
  if (existing !== undefined) {
    const unchanged =
      existing.render === render ||
      (existing.render !== undefined && render !== undefined && sameRender(existing.render, render));
    if (unchanged && record.wrapper.parentElement === topClaim(record)?.el) return;
    existing.render = render;
  } else {
    reg.seq += 1;
    record.claims.push({ el, rank, seq: reg.seq, render });
  }
  place(record);
  publish(reg);
}

/**
 * Drop a claim. The node goes to the next claim, or parks — or is DISPOSED, if
 * nothing is going to want it back.
 *
 * "Nothing is going to want it back" is a fact the registry can read rather
 * than a timeout it has to guess: no claim left AND no flight live for this id.
 * During a navigation there IS a flight live — that is what a flight IS — so
 * the node survives the gap between the origin unmounting and the destination
 * mounting. Without a flight, an unmounted host is just a host that went away.
 */
export function releaseMediaNode(id: string, el: HTMLElement, rank: number): void {
  const reg = registry();
  const record = reg.nodes.get(id);
  if (record === undefined) return;
  const before = record.claims.length;
  record.claims = record.claims.filter((claim) => !(claim.el === el && claim.rank === rank));
  if (record.claims.length === before) return;
  if (record.claims.length === 0 && !hasFlight(id)) {
    reg.nodes.delete(id);
    record.wrapper.remove();
    publish(reg);
    return;
  }
  place(record);
  publish(reg);
}

/** Whether anything holds a shared node for this id. */
export function hasMediaNode(id: string): boolean {
  const record = registry().nodes.get(id);
  return record !== undefined && record.claims.length > 0;
}

/** Subscribe to the shared-node set. The layer's `useSyncExternalStore` half. */
export function subscribeToMediaNodes(listener: () => void): () => void {
  const reg = registry();
  reg.listeners.add(listener);
  return () => {
    reg.listeners.delete(listener);
  };
}

/** Every shared node that something is currently holding. Stable identity. */
export function getMediaNodes(): readonly MediaNodeView[] {
  return registry().snapshot;
}

/** Test seam: drop every node and take its wrapper out of the document. */
export function resetMediaNodes(): void {
  const reg = registry();
  for (const record of reg.nodes.values()) record.wrapper.remove();
  reg.nodes.clear();
  reg.snapshot = [];
  if (reg.holder !== null) {
    reg.holder.remove();
    reg.holder = null;
  }
  for (const listener of reg.listeners) listener();
}
