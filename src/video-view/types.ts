/**
 * expo-video's own view types, named once for the one family that renders it.
 *
 * Type-only, so nothing here links `expo-video` into a bundle; the module itself
 * is still loaded through the optional-peer boundary in
 * `media-flight/expo-video-module.ts`. And unlike that boundary's hand-written
 * slice, these declarations DO name the package — which is why this family is
 * reachable only through its own subpath, `@oxy.so/bloom/video-view`: an app
 * imports it to render video, so it has expo-video installed, while an app that
 * renders none never loads these declarations.
 */
import type {
  VideoView as ExpoVideoView,
  VideoViewProps as ExpoVideoViewProps,
} from 'expo-video';

import type { VideoPlayerLike } from '../media-flight/expo-video-module';

/**
 * expo-video's `VideoViewProps`, every one of them, with `player` widened to
 * Bloom's structural {@link VideoPlayerLike}: the minimum a real `VideoPlayer`
 * satisfies and an arbitrary object does not. That widening is what lets a
 * surface that only knows the slice (`MediaSurface`) render through this view
 * without naming the package in its own declarations.
 */
export interface VideoViewProps extends Omit<ExpoVideoViewProps, 'player'> {
  player?: VideoPlayerLike | null;
}

/**
 * What a `ref` on {@link VideoView} receives: expo-video's own view instance,
 * with `nativeRef`, `enterFullscreen()`, `startPictureInPicture()` and the rest.
 */
export type VideoViewHandle = ExpoVideoView;
