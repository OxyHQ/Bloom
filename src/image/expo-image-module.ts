/**
 * The load boundary for `expo-image`, the renderer behind {@link BloomImage}.
 *
 * WHY expo-image on a device: react-native's own `Image` decodes GIF and
 * animated WebP through decoder libraries an Android app ships only while
 * `expo-build-properties` keeps `gifEnabled`/`webpEnabled` on (~340 KB download,
 * ~870 KB installed). An app may turn them off only when NOTHING it renders —
 * Bloom included — draws a GIF or animated WebP through react-native's `Image`.
 * expo-image decodes on its own (Glide / SDWebImage), so routing every image
 * Bloom draws through it is what lets an app make that choice.
 *
 * WHY a `require`, not a static import: the root barrel is imported by Vite web
 * apps that do not install expo-image at all, and Metro does not tree-shake, so
 * one static import from a root family would make expo-image a build
 * requirement of every consumer (`root-barrel-graph.test.ts` forbids exactly
 * that). A `require()` of a STRING LITERAL as a DIRECT STATEMENT of a `try`
 * block is the one shape Metro collects as an optional dependency — the real
 * module when installed, a caught failure when not. Nesting it one `if` deeper
 * loses that, hence every guard sits OUTSIDE the try.
 *
 * WHY native only: the decoder trade-off exists only on Android, and on web
 * react-native-web's `Image` is the browser's own `<img>`. Keeping web on it
 * means a Metro web build and a Vite build render the same DOM, and a Vite
 * bundle — which has no `require` at all — loses nothing.
 *
 * Falling back to react-native's `Image` when expo-image cannot load keeps an
 * image on screen; {@link warnExpoImageUnavailable} names the package once, in
 * dev, because the fallback is otherwise invisible.
 *
 * @see media-flight/expo-video-module.ts — the same boundary for expo-video.
 */
import type { ComponentType } from 'react';
import { Platform, type ImageStyle, type StyleProp, type ViewProps } from 'react-native';
import type { BloomImageContentFit, BloomImageSource } from './types';

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below.
 */
declare const require: (moduleName: string) => unknown;

/**
 * The slice of expo-image's `Image` props Bloom passes. Hand-written rather than
 * `typeof import('expo-image')` so no expo-image type reaches Bloom's emitted
 * declarations — the root barrel's `.d.ts` must resolve for a consumer that never
 * installed it.
 */
export interface ExpoImageLikeProps extends Omit<ViewProps, 'style' | 'children'> {
  source?: BloomImageSource | null;
  contentFit?: BloomImageContentFit;
  style?: StyleProp<ImageStyle>;
  tintColor?: string | null;
  blurRadius?: number;
  alt?: string;
  transition?: number | null;
  onLoad?: (event: { source: { width: number; height: number } }) => void;
  onError?: (event: { error: string }) => void;
}

/** The slice of expo-image's `Image` class Bloom calls. */
export type ExpoImageComponentLike = ComponentType<ExpoImageLikeProps> & {
  prefetch?: (urls: string | string[]) => Promise<boolean>;
  loadAsync?: (source: string) => Promise<{ width: number; height: number; release?: () => void }>;
};

/** `undefined` until the first load attempt, then the component or `null`. */
let expoImage: ExpoImageComponentLike | null | undefined;
/** Why the load failed, quoted verbatim in the dev warning. */
let unavailableReason = '';
let hasWarned = false;

/** expo-image's `Image`, or `null` on web and wherever it cannot be loaded. */
export function loadExpoImage(): ExpoImageComponentLike | null {
  if (expoImage !== undefined) return expoImage;
  expoImage = null;

  // Read per call rather than at module scope: a test flips `Platform.OS`.
  // Neither guard may move inside the try — see the header.
  if (Platform.OS === 'web') {
    unavailableReason = 'web renders react-native-web `Image` by design';
    expoImage = undefined;
    return null;
  }
  if (typeof require === 'undefined') {
    unavailableReason = 'this bundle has no CommonJS `require`';
    return expoImage;
  }

  try {
    const loaded = require('expo-image') as
      | { Image?: unknown; default?: { Image?: unknown } }
      | null
      | undefined;
    const candidate = loaded?.Image ?? loaded?.default?.Image;
    if (isComponent(candidate)) {
      expoImage = candidate as ExpoImageComponentLike;
    } else {
      unavailableReason = 'the module resolved without an `Image` export';
    }
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }

  if (expoImage === null) warnExpoImageUnavailable();
  return expoImage;
}

function isComponent(candidate: unknown): boolean {
  if (typeof candidate === 'function') return true;
  return typeof candidate === 'object' && candidate !== null && '$$typeof' in candidate;
}

/**
 * One warning per module lifetime, and none in production — the same mechanism
 * as `media-flight/expo-video-module.ts`.
 */
function warnExpoImageUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  // Internal Bloom diagnostic: only the consumer's package.json can fix this.
  console.warn(
    '[Bloom] expo-image could not be loaded, so Bloom draws images with ' +
      "react-native's Image (which needs the GIF/WebP decoders on Android). Install " +
      `it with \`npx expo install expo-image\`. Reason: ${unavailableReason}`,
  );
}
