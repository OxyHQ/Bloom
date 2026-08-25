/**
 * The optional-peer boundary for `expo-video`.
 *
 * Bloom ships no native code and never will, so `expo-video` cannot be a hard
 * dependency: an app that renders no video must not be made to install a native
 * module. It is therefore an OPTIONAL peer, and a static `import` contradicts
 * that — Metro resolves every static import in the eager graph, so an omitted
 * "optional" peer does not degrade, it aborts the whole bundle with `Unable to
 * resolve module expo-video`, naming a package the app never mentions.
 *
 * The load has to be dynamic in the ONE shape Metro understands: a `require()`
 * of a STRING LITERAL as a DIRECT STATEMENT of a `try` block, which Metro
 * collects as an optional dependency (resolving the real module when installed,
 * writing `null` into the dependency map when it is not, so the failure lands in
 * the `catch` below at evaluation time instead of at build time). One `if` of
 * nesting loses that — `isOptionalDependency` returns at the FIRST BlockStatement
 * it meets — hence the `typeof require` guard sits OUTSIDE the try.
 *
 * `require` may also not exist at all (this file backs the `import` condition
 * too, i.e. an ESM build under Node), hence that guard.
 *
 * A missing video module is invisible — a poster where a video should be looks
 * exactly like a video that has not started — so {@link warnExpoVideoUnavailable}
 * names the package once, in dev.
 *
 * @see connection-status/netinfo.ts — the same boundary for netinfo.
 * @see hooks/haptics-module.ts — the same boundary for expo-haptics.
 */
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below instead
 * of leaking an untyped value into the caller.
 */
declare const require: (moduleName: string) => unknown;

/**
 * The slice of `expo-video`'s `VideoPlayer` Bloom depends on.
 *
 * Hand-written rather than `typeof import('expo-video')` so no expo-video type
 * reaches Bloom's emitted declarations — a consumer that skips the optional peer
 * must not inherit a TS7016 from Bloom's own `.d.ts`. The two are kept in step by
 * the assignability check in `__tests__/MediaFlight.test.tsx`, which is excluded
 * from the build and so may name the real package.
 *
 * Bloom never CALLS any of this. **The consumer creates the player, owns it and
 * destroys it**; Bloom only hands the object back to a `VideoView`, which is the
 * whole mechanism that lets a video move between surfaces without restarting
 * (expo-video's own docs: "when the same player is playing in multiple video
 * views"). The three members below exist so the type is not `object` — a
 * structural minimum the real `VideoPlayer` satisfies, and that an arbitrary
 * object does not.
 *
 * `play`/`pause` are declared in METHOD syntax deliberately: `strictFunctionTypes`
 * exempts method parameters from contravariance, which keeps a real
 * `VideoPlayer` assignable here across `@types/react` copies.
 */
export interface VideoPlayerLike {
  readonly playing: boolean;
  play(): void;
  pause(): void;
}

/** How a video is scaled inside its box. Mirrors expo-video's `VideoContentFit`. */
export type VideoSurfaceContentFit = 'contain' | 'cover' | 'fill';

/**
 * Android's rendering surface for a video view.
 *
 * `textureView` is what Bloom asks for everywhere, because a `SurfaceView` is
 * composited by the system OUTSIDE the app's view hierarchy: it ignores the
 * parent's clip, corner radius and transform, so a video flying between two
 * rects would paint as an un-rounded rectangle at the wrong place. It also
 * cannot be changed at runtime (expo-video: "This prop should not be changed at
 * runtime"), which is why {@link MediaSurfaceProps.surfaceType} is captured on
 * first render.
 */
export type VideoSurfaceType = 'textureView' | 'surfaceView';

/** The slice of `VideoViewProps` Bloom passes. */
export interface VideoViewLikeProps {
  player?: VideoPlayerLike | null;
  contentFit?: VideoSurfaceContentFit;
  surfaceType?: VideoSurfaceType;
  nativeControls?: boolean;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  accessibilityLabel?: string;
}

/** The slice of expo-video's module surface Bloom renders. */
export interface ExpoVideoLike {
  VideoView: ComponentType<VideoViewLikeProps>;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let videoModule: ExpoVideoLike | null | undefined;
/** Why the load failed, quoted verbatim in the dev warning. */
let unavailableReason = '';
let hasWarned = false;

/** The expo-video module, or `null` when the optional peer is not installed. */
export function loadExpoVideo(): ExpoVideoLike | null {
  if (videoModule !== undefined) return videoModule;
  videoModule = null;

  // The `typeof require` guard sits OUTSIDE the try on purpose — see the header.
  // Nested one `if`/`else` deeper, the require below is no longer a direct
  // statement of the try block, Metro stops marking it optional, and an app
  // without expo-video fails to BUILD instead of losing the video surface.
  if (typeof require === 'undefined') {
    unavailableReason = 'this bundle has no CommonJS `require`';
    return videoModule;
  }

  try {
    const loaded = require('expo-video') as
      | (Partial<ExpoVideoLike> & { default?: Partial<ExpoVideoLike> })
      | null
      | undefined;
    // `VideoView` is a class component upstream, so `typeof` is `'function'`
    // either way; a memo/forwardRef build would be an object carrying
    // `$$typeof`. Both are accepted, nothing else is.
    const resolved = isComponentBearing(loaded) ? loaded : loaded?.default;

    if (isComponentBearing(resolved)) {
      videoModule = { VideoView: resolved.VideoView as ComponentType<VideoViewLikeProps> };
    } else {
      unavailableReason = 'the module resolved without a `VideoView` export';
    }
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }

  return videoModule;
}

function isComponentBearing(
  candidate: (Partial<ExpoVideoLike> & { default?: unknown }) | null | undefined,
): candidate is Partial<ExpoVideoLike> & { VideoView: ComponentType<VideoViewLikeProps> } {
  const view = candidate?.VideoView;
  if (typeof view === 'function') return true;
  return typeof view === 'object' && view !== null && '$$typeof' in view;
}

/**
 * One warning per module lifetime, and none in production — the same mechanism
 * as `connection-status/netinfo.ts` and `hooks/haptics-module.ts`. Metro and
 * Vite/Rolldown both fold the `NODE_ENV` check statically, so a production
 * bundle keeps neither the branch nor the message.
 */
export function warnExpoVideoUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  // Internal Bloom diagnostic: only the consumer's package.json can fix this,
  // so it names the package, the install command and what is lost.
  // eslint-disable-next-line no-console
  console.warn(
    '[Bloom] A video media surface fell back to its poster: the optional peer ' +
      '`expo-video` could not be loaded, so no video is rendered and the shared ' +
      'media transition carries a still frame instead. Install it ' +
      '(`npx expo install expo-video`) or pass image content only. ' +
      `Reason: ${unavailableReason}`,
  );
}

/** Test seam — drops the cached module handle so a suite can load it again. */
export function resetExpoVideoModule(): void {
  videoModule = undefined;
  unavailableReason = '';
  hasWarned = false;
}
