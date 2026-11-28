import { loadExpoVideo } from '@oxy.so/bloom/media-flight';

/**
 * The players under the Bloom language's `VideoPlayer` (`Video.bloom`), pooled: a feed of
 * videos keeps `decoders` of them decoding (one by default), as Mention's shared player does. A
 * player that starts takes a decoder; when there is none free, the one that played least
 * recently pauses and gives its source up (its position kept), and takes a decoder again when
 * it plays again. The underlying players are expo-video's (a `bloom build` answers expo-video
 * with `BloomVideo`, media3 on Android).
 */

/** The slice of expo-video's `VideoPlayer` the pool drives. */
export interface PooledPlayer {
  playing: boolean;
  muted: boolean;
  loop: boolean;
  currentTime: number;
  readonly duration: number;
  timeUpdateEventInterval: number;
  play(): void;
  pause(): void;
  release(): void;
  addListener(
    event: string,
    listener: (payload: Record<string, unknown>) => void,
  ): { remove(): void };
}

/** What makes a player of a source: expo-video's `createVideoPlayer`. */
export type PlayerFactory = (url: string) => PooledPlayer;

/** The `@Observable` model a player drives: the Bloom `VideoPlayer`'s fields. */
export interface VideoModel {
  readonly url: { readonly absoluteString: string } | string;
  isMuted: boolean;
  loops: boolean;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  $set(field: string, value: unknown): void;
  $subscribe(fields: readonly string[], listener: () => void): () => void;
}

interface Lease {
  readonly model: VideoModel;
  readonly url: string;
  player: PooledPlayer | null;
  /** The position to start from when it plays again (after giving its decoder up, or a seek). */
  resume: number;
  stops: (() => void)[];
  /** Who draws it: a view subscribed here draws again when its player comes or goes. */
  readonly views: Set<() => void>;
}

const leases = new WeakMap<object, Lease>();
/** The leases that hold a decoder, the least recently played first. */
const decoding: Lease[] = [];
let decoders = 1;
let provided: PlayerFactory | null | undefined;

/** Hands the pool its player factory (tests, or an ESM web bundle without `require`). */
export function provideVideoPlayers(factory: PlayerFactory | null | undefined): void {
  provided = factory;
}

/** How many players decode at once (1 by default). */
export function setVideoDecoders(count: number): void {
  decoders = Math.max(1, Math.floor(count));
  while (decoding.length > decoders) detach(decoding[0] as Lease);
}

function factory(): PlayerFactory | null {
  if (provided !== undefined) return provided;
  const module = loadExpoVideo() as unknown as { createVideoPlayer?: PlayerFactory } | null;
  return module?.createVideoPlayer ?? null;
}

const urlOf = (url: VideoModel['url']) => (typeof url === 'string' ? url : url.absoluteString);

/** `VideoPlayer(url:)`'s model: registered with the pool, with no decoder yet. */
export function videoAttach(model: VideoModel, url?: string): void {
  if (leases.has(model)) return;
  leases.set(model, {
    model,
    url: url ?? urlOf(model.url),
    player: null,
    resume: 0,
    stops: [],
    views: new Set(),
  });
}

function leaseOf(model: VideoModel): Lease {
  let lease = leases.get(model);
  if (!lease) {
    videoAttach(model);
    lease = leases.get(model) as Lease;
  }
  return lease;
}

function changed(lease: Lease): void {
  for (const view of [...lease.views]) view();
}

/** Gives the lease's decoder up, keeping its position. */
function detach(lease: Lease): void {
  const player = lease.player;
  if (!player) return;
  lease.resume = player.currentTime;
  for (const stop of lease.stops.splice(0)) stop();
  player.pause();
  player.release();
  lease.player = null;
  const at = decoding.indexOf(lease);
  if (at >= 0) decoding.splice(at, 1);
  lease.model.$set('isPlaying', false);
  changed(lease);
}

/** The lease's player, taking a decoder (the least recently played one's, when none is free). */
function acquire(lease: Lease): PooledPlayer | null {
  if (lease.player) {
    decoding.splice(decoding.indexOf(lease), 1);
    decoding.push(lease);
    return lease.player;
  }
  const make = factory();
  if (!make) return null;
  while (decoding.length >= decoders) detach(decoding[0] as Lease);
  const { model } = lease;
  const player = make(lease.url);
  player.muted = model.isMuted;
  player.loop = model.loops;
  player.timeUpdateEventInterval = 0.25;
  if (lease.resume > 0) player.currentTime = lease.resume;
  const listen = (event: string, f: (payload: Record<string, unknown>) => void) => {
    const subscription = player.addListener(event, f);
    lease.stops.push(() => subscription.remove());
  };
  listen('timeUpdate', (p) =>
    model.$set('currentTime', Number(p.currentTime ?? player.currentTime)),
  );
  listen('playingChange', (p) => model.$set('isPlaying', Boolean(p.isPlaying ?? player.playing)));
  listen('sourceLoad', (p) => model.$set('duration', Number(p.duration ?? player.duration)));
  listen('statusChange', () => {
    if (player.duration > 0) model.$set('duration', player.duration);
  });
  lease.stops.push(
    model.$subscribe(['isMuted', 'loops'], () => {
      player.muted = model.isMuted;
      player.loop = model.loops;
    }),
  );
  lease.player = player;
  decoding.push(lease);
  changed(lease);
  return player;
}

export function videoPlay(model: VideoModel): void {
  const player = acquire(leaseOf(model));
  if (!player) return;
  player.play();
  model.$set('isPlaying', true);
}

export function videoPause(model: VideoModel): void {
  const lease = leaseOf(model);
  lease.player?.pause();
  model.$set('isPlaying', false);
}

export function videoSeek(model: VideoModel, seconds: number): void {
  const lease = leaseOf(model);
  if (lease.player) lease.player.currentTime = seconds;
  else lease.resume = seconds;
  model.$set('currentTime', seconds);
}

/** Frees the model's decoder (a `Video(url:)`'s own player, when its view goes). */
export function videoRelease(model: VideoModel): void {
  const lease = leases.get(model);
  if (lease) detach(lease);
}

/** The player a view draws (none while the model has no decoder). */
export function videoPlayerOf(model: VideoModel): PooledPlayer | null {
  return leases.get(model)?.player ?? null;
}

/** Calls `listener` when the model's player comes or goes; returns the unsubscribe. */
export function subscribeVideoPlayer(model: VideoModel, listener: () => void): () => void {
  const lease = leaseOf(model);
  lease.views.add(listener);
  return () => lease.views.delete(listener);
}

/** Whether `value` is a Bloom `VideoPlayer` (a model the pool drives). */
export function isVideoModel(value: unknown): value is VideoModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$set' in value &&
    'isMuted' in value &&
    'url' in value
  );
}

/** The pool's state, for tests: how many players decode. */
export function decodingCount(): number {
  return decoding.length;
}
