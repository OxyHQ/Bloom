import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { LyricLine } from '../../src/lyrics';
import type { PlaybackDevice, RepeatMode, SleepTimerValue } from '../../src/media-player';
import { moveQueueItem, type QueueSection, type QueueTrack } from '../../src/queue-panel';
import type { Track } from '../../src/track-list';
import { formatDuration } from '../../src/media-controls';
import {
  ALBUM_BY_ID,
  ARTIST_BY_ID,
  DEVICES,
  SHOW_BY_ID,
  TRACK_BY_ID,
  lyricsFor,
  makeRng,
  type DemoEpisode,
  type DemoTrack,
} from './data';

/**
 * The template's one player: a fake playback clock and everything the pages
 * share — the loaded item, the context it plays from, the listener's queue,
 * shuffle, repeat, volume, device, speed and likes. Every play button, every
 * now-playing row, the bar, the mini player, the queue and the lyrics read it,
 * so they always agree. There is no audio.
 */

// ---------------------------------------------------------------------------
//  Playables
// ---------------------------------------------------------------------------

export interface Playable {
  id: string;
  kind: 'track' | 'episode';
  title: string;
  artists: { id?: string; name: string }[];
  artwork: string;
  artworkColor: string;
  duration: number;
  explicit?: boolean;
  /** The album (track) or show (episode) it belongs to. */
  parentId: string;
  parentTitle: string;
}

const LYRICS_CACHE = new Map<string, LyricLine[]>();

/** The synced lyrics of a track (none for an episode), generated once per track. */
export function lyricsOf(item: Playable | null | undefined): LyricLine[] | undefined {
  if (!item || item.kind !== 'track') return undefined;
  let lines = LYRICS_CACHE.get(item.id);
  if (!lines) {
    lines = lyricsFor(item.duration);
    LYRICS_CACHE.set(item.id, lines);
  }
  return lines;
}

export function playableFromTrack(track: DemoTrack): Playable {
  const album = ALBUM_BY_ID[track.albumId]!;
  return {
    id: track.id,
    kind: 'track',
    title: track.title,
    artists: track.artistIds.map((id) => ({ id, name: ARTIST_BY_ID[id]!.name })),
    artwork: album.artwork,
    artworkColor: album.artworkColor,
    duration: track.duration,
    explicit: track.explicit,
    parentId: album.id,
    parentTitle: album.title,
  };
}

export function playableFromEpisode(episode: DemoEpisode): Playable {
  const show = SHOW_BY_ID[episode.showId]!;
  return {
    id: episode.id,
    kind: 'episode',
    title: episode.title,
    artists: [{ name: show.title }],
    artwork: show.artwork,
    artworkColor: show.artworkColor,
    duration: episode.duration,
    parentId: show.id,
    parentTitle: show.title,
  };
}

export function playablesFromTrackIds(ids: readonly string[]): Playable[] {
  return ids.map((id) => playableFromTrack(TRACK_BY_ID[id]!));
}

/** A demo track in `TrackList`'s shape. */
export function toListTrack(track: DemoTrack, liked: boolean, extra: Partial<Track> = {}): Track {
  const album = ALBUM_BY_ID[track.albumId]!;
  return {
    id: track.id,
    title: track.title,
    artists: track.artistIds.map((id) => ({ id, name: ARTIST_BY_ID[id]!.name })),
    album: album.title,
    cover: album.artwork,
    duration: track.duration,
    plays: track.plays,
    explicit: track.explicit,
    liked,
    ...extra,
  };
}

export function toQueueTrack(item: Playable): QueueTrack {
  return {
    id: item.id,
    title: item.title,
    artists: item.artists.map((a) => a.name).join(', '),
    cover: item.artwork,
    explicit: item.explicit,
    meta: formatDuration(item.duration),
  };
}

// ---------------------------------------------------------------------------
//  State
// ---------------------------------------------------------------------------

export interface PlayContext {
  /** The album, playlist, artist, mix or show id the list came from. */
  id: string;
  /** "Late Night Drive". */
  name: string;
  /** "playlist", "album"… — the full player's "Playing from" line. */
  type: string;
}

export interface PlayerState {
  /** The loaded item, or `null` before anything played. */
  current: Playable | null;
  context: PlayContext | null;
  /** What follows from the context, after the current item. */
  upNext: Playable[];
  /** Tracks the listener added ("Next in queue"). */
  queue: Playable[];
  recentlyPlayed: Playable[];
  playing: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  device: PlaybackDevice;
  rate: number;
  sleep: SleepTimerValue;
  liked: ReadonlySet<string>;
}

export interface PlayerActions {
  /** Loads `items` from `index` and plays. Pressing play on the loaded context toggles instead. */
  play: (items: Playable[], index: number, context: PlayContext) => void;
  /** Play/pause on a whole context: toggles when it is the loaded one, else starts it at the top. */
  playContext: (items: Playable[], context: PlayContext) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: RepeatMode) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setDevice: (device: PlaybackDevice) => void;
  setRate: (rate: number) => void;
  setSleep: (value: SleepTimerValue) => void;
  setLiked: (id: string, liked: boolean) => void;
  addToQueue: (items: Playable[]) => void;
  reorder: (section: QueueSection, from: number, to: number) => void;
  remove: (section: QueueSection, index: number) => void;
  clearQueue: () => void;
  /** Plays a row of the queue panel. */
  playFromQueue: (section: QueueSection | 'recent' | 'now', index: number) => void;
}

const PlayerStateContext = createContext<(PlayerState & PlayerActions) | null>(null);
const PositionContext = createContext<number>(0);

export function usePlayer(): PlayerState & PlayerActions {
  const value = useContext(PlayerStateContext);
  if (!value) throw new Error('usePlayer() must be used inside <PlayerProvider>');
  return value;
}

/** The playback position in seconds — its own context, so only what shows time re-renders on every tick. */
export function usePosition(): number {
  return useContext(PositionContext);
}

/** Whether `id` (an item) is loaded, and whether it is playing. */
export function useIsCurrent(id: string | undefined): { current: boolean; playing: boolean } {
  const { current, playing } = usePlayer();
  const isCurrent = !!id && current?.id === id;
  return { current: isCurrent, playing: isCurrent && playing };
}

/** Whether `contextId` is the playing context. */
export function useIsContext(contextId: string): { current: boolean; playing: boolean } {
  const { context, playing } = usePlayer();
  const isCurrent = context?.id === contextId;
  return { current: isCurrent, playing: isCurrent && playing };
}

export interface PlayerProviderProps {
  children: React.ReactNode;
  /** What is loaded on mount. */
  initial?: { items: Playable[]; index: number; context: PlayContext; position?: number; playing?: boolean };
  /** Seed the listener's own queue. */
  initialQueue?: Playable[];
  initialLiked?: string[];
  initialDeviceId?: string;
  /** Milliseconds between clock ticks. Default 500. */
  tickMs?: number;
}

function shuffled<T>(list: readonly T[], seed: number): T[] {
  const rnd = makeRng(seed);
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function PlayerProvider({
  children,
  initial,
  initialQueue = [],
  initialLiked = [],
  initialDeviceId = 'this',
  tickMs = 500,
}: PlayerProviderProps) {
  const [current, setCurrent] = useState<Playable | null>(initial ? (initial.items[initial.index] ?? null) : null);
  const [context, setContext] = useState<PlayContext | null>(initial?.context ?? null);
  const [upNext, setUpNext] = useState<Playable[]>(initial ? initial.items.slice(initial.index + 1) : []);
  /** The context's list before shuffle, to restore the order. */
  const [ordered, setOrdered] = useState<Playable[]>(initial?.items ?? []);
  const [queue, setQueue] = useState<Playable[]>(initialQueue);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Playable[]>(() =>
    initial ? initial.items.slice(0, initial.index).reverse() : [],
  );
  const [playing, setPlaying] = useState(initial?.playing ?? false);
  const [position, setPosition] = useState(initial?.position ?? 0);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [volume, setVolume] = useState(0.72);
  const [muted, setMuted] = useState(false);
  const [device, setDevice] = useState<PlaybackDevice>(DEVICES.find((d) => d.id === initialDeviceId) ?? DEVICES[0]!);
  const [rate, setRate] = useState(1);
  const [sleep, setSleep] = useState<SleepTimerValue>('off');
  const [liked, setLikedSet] = useState<ReadonlySet<string>>(() => new Set(initialLiked));

  const load = useCallback((item: Playable, from = 0) => {
    setCurrent((previous) => {
      if (previous && previous.id !== item.id) {
        setRecentlyPlayed((list) => [previous, ...list.filter((x) => x.id !== previous.id)].slice(0, 30));
      }
      return item;
    });
    setPosition(from);
  }, []);

  const play = useCallback<PlayerActions['play']>(
    (items, index, ctx) => {
      const item = items[index];
      if (!item) return;
      if (current?.id === item.id && context?.id === ctx.id) {
        setPlaying((p) => !p);
        return;
      }
      setContext(ctx);
      setOrdered(items);
      const rest = items.slice(index + 1);
      setUpNext(shuffle ? shuffled(rest, items.length * 31 + index) : rest);
      load(item);
      setPlaying(true);
    },
    [context?.id, current?.id, load, shuffle],
  );

  const playContext = useCallback<PlayerActions['playContext']>(
    (items, ctx) => {
      if (context?.id === ctx.id && current) {
        setPlaying((p) => !p);
        return;
      }
      play(items, 0, ctx);
    },
    [context?.id, current, play],
  );

  const next = useCallback(() => {
    if (queue.length > 0) {
      const [head, ...rest] = queue;
      setQueue(rest);
      load(head!);
      setPlaying(true);
      return;
    }
    if (upNext.length > 0) {
      const [head, ...rest] = upNext;
      setUpNext(rest);
      load(head!);
      setPlaying(true);
      return;
    }
    if (repeat === 'all' && ordered.length > 0) {
      setUpNext(ordered.slice(1));
      load(ordered[0]!);
      setPlaying(true);
      return;
    }
    setPosition(0);
    setPlaying(false);
  }, [load, ordered, queue, repeat, upNext]);

  const previous = useCallback(() => {
    if (position > 3 || recentlyPlayed.length === 0 || !current) {
      setPosition(0);
      return;
    }
    const [head, ...rest] = recentlyPlayed;
    setRecentlyPlayed(rest);
    setUpNext((list) => [current, ...list]);
    setCurrent(head!);
    setPosition(0);
  }, [current, position, recentlyPlayed]);

  // The clock. Refs keep the interval stable across renders.
  const nextRef = useRef(next);
  nextRef.current = next;
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const durationRef = useRef(current?.duration ?? 0);
  durationRef.current = current?.duration ?? 0;

  useEffect(() => {
    if (!playing || !current) return undefined;
    const step = (tickMs / 1000) * rate;
    const id = setInterval(() => {
      setPosition((p) => {
        const nextPosition = p + step;
        if (nextPosition < durationRef.current) return nextPosition;
        if (repeatRef.current === 'one') return 0;
        // Defer: `next` sets state of its own.
        setTimeout(() => nextRef.current(), 0);
        return durationRef.current;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [playing, current, rate, tickMs]);

  const seek = useCallback((seconds: number) => {
    setPosition(Math.max(0, Math.min(durationRef.current, seconds)));
  }, []);
  const seekBy = useCallback((delta: number) => {
    setPosition((p) => Math.max(0, Math.min(durationRef.current, p + delta)));
  }, []);

  const setShuffle = useCallback(
    (on: boolean) => {
      setShuffleState(on);
      if (!current) return;
      if (on) {
        setUpNext((list) => shuffled(list, list.length * 17 + 5));
      } else {
        const at = ordered.findIndex((x) => x.id === current.id);
        if (at >= 0) setUpNext(ordered.slice(at + 1));
      }
    },
    [current, ordered],
  );

  const setLiked = useCallback((id: string, on: boolean) => {
    setLikedSet((set) => {
      const nextSet = new Set(set);
      if (on) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  }, []);

  const addToQueue = useCallback((items: Playable[]) => setQueue((list) => [...list, ...items]), []);

  const reorder = useCallback((section: QueueSection, from: number, to: number) => {
    if (section === 'queue') setQueue((list) => moveQueueItem(list, from, to));
    else setUpNext((list) => moveQueueItem(list, from, to));
  }, []);

  const remove = useCallback((section: QueueSection, index: number) => {
    const drop = <T,>(list: T[]) => list.filter((_, i) => i !== index);
    if (section === 'queue') setQueue(drop);
    else setUpNext(drop);
  }, []);

  const playFromQueue = useCallback<PlayerActions['playFromQueue']>(
    (section, index) => {
      if (section === 'now') {
        setPlaying((p) => !p);
        return;
      }
      if (section === 'queue') {
        const item = queue[index];
        if (!item) return;
        setQueue((list) => list.slice(index + 1));
        load(item);
      } else if (section === 'context') {
        const item = upNext[index];
        if (!item) return;
        setUpNext((list) => list.slice(index + 1));
        load(item);
      } else {
        const item = recentlyPlayed[index];
        if (!item) return;
        load(item);
      }
      setPlaying(true);
    },
    [load, queue, recentlyPlayed, upNext],
  );

  const value = useMemo(
    () => ({
      current,
      context,
      upNext,
      queue,
      recentlyPlayed,
      playing,
      shuffle,
      repeat,
      volume,
      muted,
      device,
      rate,
      sleep,
      liked,
      play,
      playContext,
      toggle: () => setPlaying((p) => (current ? !p : false)),
      next,
      previous,
      seek,
      seekBy,
      setShuffle,
      setRepeat,
      setVolume,
      setMuted,
      setDevice,
      setRate,
      setSleep,
      setLiked,
      addToQueue,
      reorder,
      remove,
      clearQueue: () => setQueue([]),
      playFromQueue,
    }),
    [
      current,
      context,
      upNext,
      queue,
      recentlyPlayed,
      playing,
      shuffle,
      repeat,
      volume,
      muted,
      device,
      rate,
      sleep,
      liked,
      play,
      playContext,
      next,
      previous,
      seek,
      seekBy,
      setShuffle,
      setLiked,
      addToQueue,
      reorder,
      remove,
      playFromQueue,
    ],
  );

  return (
    <PlayerStateContext.Provider value={value}>
      <PositionContext.Provider value={position}>{children}</PositionContext.Provider>
    </PlayerStateContext.Provider>
  );
}
