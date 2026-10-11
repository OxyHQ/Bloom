/**
 * The optional-peer boundary for the NATIVE Lottie player, `lottie-react-native`.
 *
 * Same contract as `media-flight/expo-video-module.ts`, and for the same reason:
 * Bloom ships no native code, so an app that shows no animated sticker must not
 * be made to install a native module. The `require` is a string literal as a
 * direct statement of a `try` block — the one shape Metro collects as an
 * optional dependency — and the `typeof require` guard stays OUTSIDE the try.
 *
 * Whatever player loads is adapted to {@link LottiePlayerProps}, so `Sticker`
 * drives the native and the web player (`lottie-module.web.ts`) the same way.
 */
import { createElement, useEffect, useRef, type ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { LottiePlayerProps } from './types';

declare const require: (moduleName: string) => unknown;

/** The slice of `lottie-react-native`'s `LottieView` Bloom depends on. */
interface LottieViewLikeProps {
  source: { uri: string };
  autoPlay?: boolean;
  loop?: boolean;
  resizeMode?: 'contain';
  onAnimationLoaded?: () => void;
  onAnimationFailure?: (error: string) => void;
  style?: StyleProp<ViewStyle>;
}

interface LottieViewHandle {
  pause(): void;
  resume(): void;
}

type LottieViewLike = ComponentType<LottieViewLikeProps & { ref?: unknown }>;

let providedPlayer: ComponentType<LottiePlayerProps> | null | undefined;
let loadedPlayer: ComponentType<LottiePlayerProps> | null | undefined;
let hasWarned = false;

/** Tests (and an app with its own build of the player) hand one in here. */
export function provideLottiePlayer(player: ComponentType<LottiePlayerProps> | null): void {
  providedPlayer = player;
}

/** Forget the loaded player — for tests. */
export function resetLottiePlayer(): void {
  providedPlayer = undefined;
  loadedPlayer = undefined;
  hasWarned = false;
}

function isComponent(candidate: unknown): candidate is LottieViewLike {
  if (typeof candidate === 'function') return true;
  return typeof candidate === 'object' && candidate !== null && '$$typeof' in candidate;
}

function adapt(LottieView: LottieViewLike): ComponentType<LottiePlayerProps> {
  function NativeLottiePlayer({ uri, loop, paused, onLoad, onError, style }: LottiePlayerProps) {
    const ref = useRef<LottieViewHandle | null>(null);
    useEffect(() => {
      if (paused) ref.current?.pause();
      else ref.current?.resume();
    }, [paused]);
    return createElement(LottieView, {
      ref,
      source: { uri },
      autoPlay: !paused,
      loop,
      resizeMode: 'contain',
      onAnimationLoaded: onLoad,
      onAnimationFailure: onError,
      style,
    });
  }
  return NativeLottiePlayer;
}

/** The native player, adapted, or `null` when `lottie-react-native` is not installed. */
export function loadLottiePlayer(): ComponentType<LottiePlayerProps> | null {
  if (providedPlayer !== undefined && providedPlayer !== null) return providedPlayer;
  if (loadedPlayer !== undefined) return loadedPlayer;
  loadedPlayer = null;

  if (typeof require === 'undefined') return loadedPlayer;

  try {
    const loaded = require('lottie-react-native') as { default?: unknown } | null | undefined;
    const view = isComponent(loaded) ? loaded : loaded?.default;
    if (isComponent(view)) loadedPlayer = adapt(view);
  } catch {
    loadedPlayer = null;
  }
  return loadedPlayer;
}

/** One dev warning per module lifetime: a still sticker looks like a working one. */
export function warnLottieUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  console.warn(
    '[Bloom] An animated Sticker fell back to its still image: the optional peer ' +
      '`lottie-react-native` could not be loaded. Install it (`npx expo install ' +
      'lottie-react-native`) to animate stickers.',
  );
}
