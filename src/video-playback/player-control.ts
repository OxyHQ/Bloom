import type { ControlledVideoPlayer, VideoPlayerSubscription } from './types';

interface PlaybackDemand {
  shouldPlay: boolean;
  shouldLoad: boolean;
}

interface PlaybackSnapshot extends PlaybackDemand {
  hasRenderedFrame: boolean;
}

/**
 * A player can have several presenters (a row and the media flight carrying it
 * to the next route, a feed card and its detail screen), but only ONE playback
 * decision: it plays while any presenter asks it to, and loads while any wants
 * it loaded.
 */
export class PlaybackControl {
  private demands = new Map<object, PlaybackDemand>();
  private listeners = new Set<() => void>();
  private snapshot: PlaybackSnapshot;
  private subscriptions: VideoPlayerSubscription[] = [];

  constructor(private player: ControlledVideoPlayer) {
    this.snapshot = {
      shouldPlay: false,
      shouldLoad: false,
      hasRenderedFrame: player.status === 'readyToPlay',
    };
  }

  getSnapshot = (): PlaybackSnapshot => this.snapshot;
  getRenderedFrame = (): boolean => this.snapshot.hasRenderedFrame;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  publish(owner: object, demand: PlaybackDemand): void {
    const isFirstOwner = this.demands.size === 0;
    if (isFirstOwner) {
      // A new source or a player becoming ready forgets what it was told, so the
      // standing decision is re-applied on both.
      this.subscriptions = [
        this.player.addListener('sourceChange', this.synchronize),
        this.player.addListener('statusChange', ({ status }) => {
          if (status !== 'readyToPlay') return;
          this.setRenderedFrame(true);
          this.synchronize();
        }),
      ];
    }
    this.demands.set(owner, demand);
    this.update(isFirstOwner);
  }

  remove(owner: object): void {
    this.demands.delete(owner);
    if (this.demands.size === 0) {
      for (const subscription of this.subscriptions) subscription.remove();
      this.subscriptions = [];
    }
    this.update();
  }

  setRenderedFrame(hasRenderedFrame: boolean): void {
    if (this.snapshot.hasRenderedFrame === hasRenderedFrame) return;
    this.snapshot = { ...this.snapshot, hasRenderedFrame };
    for (const listener of this.listeners) listener();
  }

  synchronize = (): void => {
    // During a route handoff the outgoing presenter unmounts before the next
    // arrives. Releasing a presenter is not a pause command.
    if (this.demands.size === 0) return;
    if (this.snapshot.shouldPlay) this.player.play();
    else this.player.pause();
  };

  private update(force = false): void {
    let shouldPlay = false;
    let shouldLoad = false;
    for (const demand of this.demands.values()) {
      shouldPlay ||= demand.shouldPlay;
      shouldLoad ||= demand.shouldLoad;
    }
    const previous = this.snapshot;
    if (previous.shouldPlay === shouldPlay && previous.shouldLoad === shouldLoad) {
      if (force) this.synchronize();
      return;
    }
    this.snapshot = { ...previous, shouldPlay, shouldLoad };
    for (const listener of this.listeners) listener();
    if (force || previous.shouldPlay !== shouldPlay) this.synchronize();
  }
}

// Weak keys follow the player's own lifetime; a control never retains a decoder.
const controls = new WeakMap<ControlledVideoPlayer, PlaybackControl>();

export function controlFor(player: ControlledVideoPlayer): PlaybackControl {
  let control = controls.get(player);
  if (!control) {
    control = new PlaybackControl(player);
    controls.set(player, control);
  }
  return control;
}

/**
 * Follow whether any presenter wants `player` loaded, for a decoder that runs
 * beside the player rather than inside it (a JS HLS decoder on web): hidden
 * media should not fetch. Calls `onChange` once now, then on every change.
 */
export function subscribeVideoLoadingDemand(
  player: ControlledVideoPlayer,
  onChange: (loading: boolean) => void,
): () => void {
  const control = controlFor(player);
  let previous: boolean | undefined;
  const update = () => {
    const loading = control.getSnapshot().shouldLoad;
    if (loading === previous) return;
    previous = loading;
    onChange(loading);
  };
  const unsubscribe = control.subscribe(update);
  update();
  return unsubscribe;
}

/**
 * Tell the control the player has (or no longer has) a painted frame, for a
 * view that learns it first (`onFirstFrameRender`, a decoder swap).
 */
export function setVideoHasRenderedFrame(
  player: ControlledVideoPlayer,
  hasRenderedFrame: boolean,
): void {
  controlFor(player).setRenderedFrame(hasRenderedFrame);
}
