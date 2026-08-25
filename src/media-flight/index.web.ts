/**
 * The web barrel, which exists to NAME the `.web` siblings.
 *
 * Export conditions do not apply to relative specifiers, so a bundler that is
 * not Metro reaches `MediaFlightLayer.web.tsx` and `MediaFlightHost.web.tsx`
 * only because this file spells them out. Those two are the whole web fork of
 * this family: the layer that paints each shared media node once, and the host
 * that claims it. Everything else below is the same module on both platforms.
 */
export { MediaFlightLayer } from './MediaFlightLayer.web';
export { MediaFlightHost } from './MediaFlightHost.web';
export { MediaSurface, MediaPoster, EmptyMediaSurface } from './MediaSurface';
export { useMediaFlight } from './use-media-flight';
export {
  DEFAULT_FLIGHT_CORNER_RADIUS,
  flightProgress,
  handOffFlight,
  hasFlight,
  releaseFlight,
  resetMediaFlight,
} from './store';
export { SURFACE_MOUNT_TIMEOUT_MS } from './constants';
export {
  loadExpoVideo,
  warnExpoVideoUnavailable,
  provideExpoVideo,
  resetExpoVideoModule,
  type ExpoVideoLike,
  type VideoPlayerLike,
  type VideoSurfaceContentFit,
  type VideoSurfaceType,
  type VideoViewLikeProps,
} from './expo-video-module';
export type {
  MediaFlight,
  MediaFlightAnchorNode,
  MediaFlightController,
  MediaFlightHostProps,
  MediaFlightOptions,
  MediaSurfaceContent,
  MediaSurfaceImage,
  MediaSurfaceVideo,
  MeasuredRect,
} from './types';
export type { MediaSurfaceProps } from './MediaSurface';
