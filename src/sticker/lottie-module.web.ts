/**
 * The optional-peer boundary for the WEB Lottie player,
 * `@lottiefiles/dotlottie-react` — the web half of `lottie-module.ts`, with the
 * same loading contract and the same adapted surface.
 *
 * dotLottie draws with ThorVG compiled to WebAssembly, which plays both `.lottie`
 * archives and plain Lottie JSON, and exposes its instance through a ref
 * callback rather than props: load, failure and pause all go through it.
 */
import { createElement, useEffect, useRef, type ComponentType } from 'react';

import type { LottiePlayerProps } from './types';

declare const require: (moduleName: string) => unknown;

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

let providedPlayer: ComponentType<LottiePlayerProps> | null | undefined;
let loadedPlayer: ComponentType<LottiePlayerProps> | null | undefined;
let hasWarned = false;

export function provideLottiePlayer(player: ComponentType<LottiePlayerProps> | null): void {
  providedPlayer = player;
}

/** Forget the loaded player — for tests. */
export function resetLottiePlayer(): void {
  providedPlayer = undefined;
  loadedPlayer = undefined;
  hasWarned = false;
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

/** The web player, adapted, or `null` when `@lottiefiles/dotlottie-react` is not installed. */
export function loadLottiePlayer(): ComponentType<LottiePlayerProps> | null {
  if (providedPlayer !== undefined && providedPlayer !== null) return providedPlayer;
  if (loadedPlayer !== undefined) return loadedPlayer;
  loadedPlayer = null;

  if (typeof require === 'undefined') return loadedPlayer;

  try {
    const loaded = require('@lottiefiles/dotlottie-react') as { DotLottieReact?: unknown } | null | undefined;
    if (isComponent(loaded?.DotLottieReact)) loadedPlayer = adapt(loaded.DotLottieReact);
  } catch {
    loadedPlayer = null;
  }
  return loadedPlayer;
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
