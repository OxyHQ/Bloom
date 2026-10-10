/**
 * THE video view: expo-video's `VideoView`, with inline playback on by default.
 *
 * expo-video's web view renders `<video playsInline={props.playsInline}>`, so
 * the element carries `playsinline` only when a caller remembers to pass the
 * prop. iPhone Safari will not play a `<video>` without it inline: a muted
 * autoplay is refused outright and the element keeps showing its poster, which
 * looks exactly like a video that has not started yet. Every Oxy app paints
 * feeds, reels and previews that way, and none passed the prop.
 *
 * So the default lives here, once, and every Bloom surface that paints a video
 * (`MediaSurface`, and through it `MediaFlightLayer`, `MediaFlightHost` and the
 * media gallery) renders through this view. Apps render it instead of
 * importing `VideoView` from expo-video directly. A caller may still pass
 * `playsInline={false}`; native ignores the prop, since iOS and Android views
 * are always inline.
 *
 * The module is loaded through the optional-peer boundary, never imported: an
 * app that paints only images through `MediaSurface` must not have to install a
 * native video module (see `media-flight/expo-video-module.ts`). When it cannot
 * be loaded this renders nothing and says why once, in dev.
 */
import { forwardRef, type ComponentType, type RefAttributes } from 'react';
import type { VideoView as ExpoVideoView, VideoViewProps as ExpoVideoViewProps } from 'expo-video';

import { loadExpoVideo, warnExpoVideoUnavailable } from '../media-flight/expo-video-module';
import type { VideoViewHandle, VideoViewProps } from './types';

/**
 * The loaded module's `VideoView`, under its real type. The boundary types it
 * as the slice Bloom itself passes; what it holds is expo-video's class, either
 * required as `expo-video` or handed over by `provideExpoVideo(ExpoVideo)`.
 */
type ExpoVideoViewComponent = ComponentType<ExpoVideoViewProps & RefAttributes<ExpoVideoView>>;

export const VideoView = forwardRef<VideoViewHandle, VideoViewProps>(function VideoView(
  { playsInline = true, player, ...props },
  ref,
) {
  const expoVideo = loadExpoVideo();
  if (expoVideo === null) {
    warnExpoVideoUnavailable();
    return null;
  }
  const NativeVideoView = expoVideo.VideoView as ExpoVideoViewComponent;
  return (
    <NativeVideoView
      {...props}
      ref={ref}
      // Bloom never creates a player, so whatever arrives here is the
      // consumer's own expo-video `VideoPlayer`; the prop is typed by its
      // structural minimum only so `MediaSurface` need not name the package.
      player={player as ExpoVideoViewProps['player']}
      playsInline={playsInline}
    />
  );
});

VideoView.displayName = 'VideoView';
