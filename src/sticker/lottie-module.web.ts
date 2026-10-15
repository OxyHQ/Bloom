/**
 * The optional-peer boundary for the WEB Lottie player,
 * `@lottiefiles/dotlottie-react` — the web half of `lottie-module.ts`, with the
 * same adapted surface but an ASYNCHRONOUS load.
 *
 * dotLottie draws with ThorVG compiled to WebAssembly, which plays both `.lottie`
 * archives and plain Lottie JSON, and exposes its instance through a ref
 * callback rather than props: load, failure and pause all go through it.
 *
 * ## Why `import()` and not `require()`
 *
 * A web bundler collects a `require('…')` as a STATIC dependency wherever it
 * sits, so the old synchronous load put `@lottiefiles/dotlottie-react` and the
 * ~160 KiB `@lottiefiles/dotlottie-web` it wraps into whatever chunk holds this
 * file. Stickers render in several lazy screens of an app, so Expo hoisted the
 * pair into the `__common` chunk every page downloads at startup — whether or
 * not a sticker was ever shown. A dynamic `import()` is a split point instead:
 * the player is its own chunk, fetched the first time a `Sticker` with an
 * `animation` mounts. `Sticker` already draws its still until the player reports
 * a loaded animation, so that fetch is just a little more of the existing
 * "animation is still loading" state.
 *
 * The `import()` is the direct statement of a `try` block for the same reason
 * the native `require` is: it is the one shape Metro marks optional, so an app
 * without the peer still bundles (the chunk is then a thrower, caught below).
 */
import { createElement, useEffect, useRef, useState, type ComponentType } from 'react';

import type { LottiePlayerProps } from './types';

interface DotLottieInstance {
  play(): void;
  pause(): void;
  addEventListener(event: 'load' | 'loadError', listener: () => void): void;
  removeEventListener(event: 'load' | 'loadError', listener: () => void): void;
}

interface DotLottieReactLikeProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  dotLottieRefCallback?: (instance: DotLottieInstance | null) => void;
  style?: unknown;
}

type DotLottieReactLike = ComponentType<DotLottieReactLikeProps>;

/** The slice of the `@lottiefiles/dotlottie-react` module Bloom reads. */
interface DotLottieReactModuleLike {
  DotLottieReact?: unknown;
  setWasmUrl?: unknown;
}

let providedPlayer: ComponentType<LottiePlayerProps> | null | undefined;
/** `undefined` until the import settles; then the adapted player, or `null` when the peer is missing. */
let loadedPlayer: ComponentType<LottiePlayerProps> | null | undefined;
let pendingPlayer: Promise<ComponentType<LottiePlayerProps> | null> | undefined;
let loadedModule: DotLottieReactModuleLike | undefined;
let wasmUrl: string | undefined;
let hasWarned = false;

export function provideLottiePlayer(player: ComponentType<LottiePlayerProps> | null): void {
  providedPlayer = player;
}

/** Forget the loaded player — for tests. */
export function resetLottiePlayer(): void {
  providedPlayer = undefined;
  loadedPlayer = undefined;
  pendingPlayer = undefined;
  loadedModule = undefined;
  wasmUrl = undefined;
  hasWarned = false;
}

/**
 * Where dotLottie fetches its WebAssembly renderer from.
 *
 * Left alone, dotLottie fetches it from a public npm CDN, which a strict
 * `connect-src` refuses and which makes every sticker depend on a third party.
 * An app serving the binary itself (e.g. `@lottiefiles/dotlottie-web/dotlottie-player.wasm`
 * bundled as an asset) names its URL here, once, at startup. It is applied when
 * the player chunk arrives — or immediately if it already has — so calling this
 * never loads the player and costs an app nothing until a sticker animates.
 */
export function setLottieWasmUrl(url: string): void {
  wasmUrl = url;
  applyWasmUrl();
}

function applyWasmUrl(): void {
  if (wasmUrl === undefined || typeof loadedModule?.setWasmUrl !== 'function') return;
  (loadedModule.setWasmUrl as (url: string) => void)(wasmUrl);
}

function isComponent(candidate: unknown): candidate is DotLottieReactLike {
  if (typeof candidate === 'function') return true;
  return typeof candidate === 'object' && candidate !== null && '$$typeof' in candidate;
}

function adapt(DotLottieReact: DotLottieReactLike): ComponentType<LottiePlayerProps> {
  function WebLottiePlayer({ uri, loop, paused, onLoad, onError, style }: LottiePlayerProps) {
    const instance = useRef<DotLottieInstance | null>(null);
    const callbacks = useRef({ onLoad, onError });
    callbacks.current = { onLoad, onError };

    useEffect(() => {
      if (paused) instance.current?.pause();
      else instance.current?.play();
    }, [paused]);

    return createElement(DotLottieReact, {
      src: uri,
      autoplay: !paused,
      loop,
      style,
      dotLottieRefCallback: (next) => {
        if (instance.current === next) return;
        instance.current = next;
        if (!next) return;
        next.addEventListener('load', () => callbacks.current.onLoad?.());
        next.addEventListener('loadError', () => callbacks.current.onError?.('load failed'));
      },
    });
  }
  return WebLottiePlayer;
}

/** The module, or `null` when the peer is not installed (Metro then bundles a thrower). */
async function importDotLottieReact(): Promise<unknown> {
  try {
    return await import('@lottiefiles/dotlottie-react');
  } catch {
    return null;
  }
}

/** Starts the one import on first call; every caller after shares it. */
function settlePlayer(): Promise<ComponentType<LottiePlayerProps> | null> {
  pendingPlayer ??= importDotLottieReact().then((loaded) => {
    const dotLottie = loaded as DotLottieReactModuleLike | null | undefined;
    if (dotLottie && isComponent(dotLottie.DotLottieReact)) {
      loadedModule = dotLottie;
      applyWasmUrl();
      loadedPlayer = adapt(dotLottie.DotLottieReact);
    } else {
      loadedPlayer = null;
    }
    return loadedPlayer;
  });
  return pendingPlayer;
}

/**
 * What `Sticker` mounts on the web: renders nothing until the player chunk has
 * arrived (the still underneath is the placeholder), then the real player. One
 * stable component for every sticker, so a sticker mounted while the chunk was
 * in flight is not remounted when it lands. A missing peer surfaces as the
 * player's `onError`, which is exactly the "show the still for good" path.
 */
function LazyWebLottiePlayer(props: LottiePlayerProps) {
  const [Player, setPlayer] = useState<ComponentType<LottiePlayerProps> | null>(
    () => loadedPlayer ?? null,
  );
  const onError = useRef(props.onError);
  onError.current = props.onError;

  useEffect(() => {
    if (Player) return undefined;
    let mounted = true;
    void settlePlayer().then((next) => {
      if (!mounted) return;
      if (next) setPlayer(() => next);
      else onError.current?.('@lottiefiles/dotlottie-react is not installed');
    });
    return () => {
      mounted = false;
    };
  }, [Player]);

  return Player ? createElement(Player, props) : null;
}

/**
 * The web player: one handed in through `provideLottiePlayer`, else the lazy
 * player that loads `@lottiefiles/dotlottie-react` on first mount, or `null`
 * once that load has found the peer missing.
 */
export function loadLottiePlayer(): ComponentType<LottiePlayerProps> | null {
  if (providedPlayer !== undefined && providedPlayer !== null) return providedPlayer;
  if (loadedPlayer === null) return null;
  return LazyWebLottiePlayer;
}

export function warnLottieUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  console.warn(
    '[Bloom] An animated Sticker fell back to its still image: the optional peer ' +
      '`@lottiefiles/dotlottie-react` could not be loaded. Install it to animate ' +
      'stickers on the web.',
  );
}
