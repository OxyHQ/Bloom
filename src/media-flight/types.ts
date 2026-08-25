import type { SharedValue } from 'react-native-reanimated';

import type { VideoPlayerLike } from './expo-video-module';

/**
 * On-screen rectangle of a media anchor, in WINDOW coordinates (what
 * `measureInWindow` reports). Bloom-owned so consumers don't depend on an
 * app-local shape.
 */
export interface MeasuredRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Anything that can report its own window rect. This is exactly react-native's
 * `View` instance shape (and react-native-web's), narrowed to the one method
 * the flight layer calls — so a consumer passes its host node straight through
 * without Bloom naming `View` in its public API.
 */
export interface MediaFlightAnchorNode {
  measureInWindow(
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void;
}

/** A still image painted into a media surface. */
export interface MediaSurfaceImage {
  /**
   * Present so the union discriminates. Optional on the image arm so an image
   * literal stays `{ uri }` — the shape every existing gallery caller writes.
   */
  kind?: 'image';
  /** Source URI rendered as the image. */
  uri: string;
}

/**
 * A video painted into a media surface.
 *
 * **Bloom neither creates nor destroys the player.** The consumer owns it (via
 * expo-video's `useVideoPlayer`, a store, whatever it likes) and hands the same
 * object to every surface that should show that video. That is the entire
 * mechanism behind "the video does not restart": expo-video separates the
 * `VideoPlayer` OBJECT from the `VideoView` that displays it, and one player may
 * feed several views. Swapping which view is mounted therefore moves the picture
 * without touching playback — whereas re-creating the player would seek back to
 * zero and re-open the network stream.
 */
export interface MediaSurfaceVideo {
  kind: 'video';
  /** The expo-video `VideoPlayer` the CONSUMER created and owns. */
  player: VideoPlayerLike;
  /**
   * Still frame shown behind the video surface. It is what the user sees before
   * the first video frame renders, and the only thing rendered at all when the
   * optional `expo-video` peer is absent.
   */
  poster?: string;
}

/** What a media surface paints: a still image, or a consumer-owned video. */
export type MediaSurfaceContent = MediaSurfaceImage | MediaSurfaceVideo;

/**
 * A media surface currently owned by the flight layer.
 *
 * One per id, ever — that is the contract. `flyTo` on an id that is already in
 * flight RETARGETS this record rather than adding a second surface, which is
 * what keeps a single `VideoView` alive across the whole transition.
 */
export interface MediaFlight {
  id: string;
  content: MediaSurfaceContent;
  /** Rect the current leg starts from. */
  from: MeasuredRect;
  /** Rect the current leg ends at. */
  to: MeasuredRect;
  cornerRadius: number;
  contentFit: 'contain' | 'cover';
  /**
   * The leg's progress, 0 at `from` and 1 at `to`. Owned by the store (created
   * with `makeMutable`, not a hook) because the animation is STARTED by an
   * imperative call and only READ by the layer — an effect in the layer would
   * have to re-derive from a prop and would fire a frame late.
   */
  progress: SharedValue<number>;
  /**
   * True once `flyBack` has aimed this surface at its anchor: when the leg
   * settles, the surface is released instead of parked.
   */
  landing: boolean;
  /** Bumped on every retarget, so React remounts nothing but the layer re-reads. */
  generation: number;
}

/** Options for a single `flyTo` leg. */
export interface MediaFlightOptions {
  /**
   * Rect the surface starts from, used only when nothing is live for the id
   * yet. This is the origin thumbnail's measured rect — `measureAnchor(id)` is
   * what produces it. Omitted, the surface appears at its destination instead
   * of flying in from a corner, which is the right degradation when the origin
   * could not be measured (virtualised away, already unmounted).
   *
   * It is ignored on a retarget: a surface already in flight resumes from where
   * it currently IS, never from where it once started.
   */
  from?: MeasuredRect;
  /**
   * Corner radius of the flying box. Defaults to Bloom's `radius-12`, the same
   * default the media gallery uses for its fitted media.
   */
  cornerRadius?: number;
  /**
   * How the media fills the flying box. `'cover'` matches a cropped feed
   * thumbnail; `'contain'` matches a fitted fullscreen view. Defaults to
   * `'cover'`, because a flight almost always STARTS at a cropped thumbnail.
   */
  contentFit?: 'contain' | 'cover';
}

/**
 * The imperative surface of the flight layer, returned by `useMediaFlight()`.
 *
 * Origin and destination only DECLARE where they want the surface; the layer is
 * what paints it. Neither renders the media itself while a flight is live, so
 * there is never a second copy to keep in sync.
 */
export interface MediaFlightController {
  /**
   * Register (or, with `null`, clear) the node that anchors `id` on screen.
   * Wire it as a callback ref on the host view the media would otherwise
   * occupy. The most recently registered node for an id is the current anchor,
   * which is what makes a destination screen mounting over an origin screen
   * take over as the fly-back target.
   */
  registerAnchor: (id: string, node: MediaFlightAnchorNode | null) => void;
  /**
   * Measure the current anchor for `id` in window coordinates. Resolves `null`
   * when no anchor is registered (unmounted / virtualised) or it has no area,
   * which is the signal to skip the transition rather than fly to nowhere.
   */
  measureAnchor: (id: string) => Promise<MeasuredRect | null>;
  /**
   * Take the surface for `id` live (if it is not already) and move it to
   * `rect`. The first call flies in from {@link MediaFlightOptions.from} when
   * the caller measured an origin, and appears in place when it did not. A call
   * for an id already in flight RETARGETS the same surface — one surface per
   * id, always.
   *
   * **Await it before tearing the origin down** (on web: before navigating).
   * The promise resolves once the layer has committed its surface, which is what
   * puts it in expo-video's mounted set while the origin is still there — the
   * mechanism that carries `currentTime` across instead of restarting at zero.
   * It resolves on a short timeout if no layer is mounted, so a missing root
   * component degrades to "no transition" rather than to a dead feed.
   */
  flyTo: (
    id: string,
    rect: MeasuredRect,
    content: MediaSurfaceContent,
    options?: MediaFlightOptions,
  ) => Promise<void>;
  /**
   * Fly the live surface for `id` back to its current anchor and release it
   * once it lands. With no measurable anchor the surface is released at once —
   * the caller is expected to render its own copy again at that point.
   */
  flyBack: (id: string) => void;
  /**
   * Tell the layer a destination surface is LIVE, so the flying copy can go.
   *
   * Usually you do not call this: give the destination's `<MediaSurface>` a
   * `flightId` and it reports its own first frame. It is here for a destination
   * that renders something other than a Bloom surface.
   *
   * Called mid-flight it is remembered, not obeyed — the surface finishes
   * travelling first, or it would vanish between the two rects.
   */
  handOff: (id: string) => void;
  /**
   * Progress of the most recent leg, 0 → 1. Read it from a worklet to fade an
   * origin placeholder out and a destination's chrome in, in lockstep with the
   * flight. Shared by every flight: concurrent flights (which the one-surface-
   * per-id contract permits across DIFFERENT ids) overwrite each other here,
   * and each surface's own geometry is driven by its own value regardless.
   */
  progress: SharedValue<number>;
}
