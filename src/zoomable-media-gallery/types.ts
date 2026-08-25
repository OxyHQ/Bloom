import type {
  MeasuredRect,
  MediaSurfaceImage,
  MediaSurfaceVideo,
} from '../media-flight/types';

/**
 * A still image page.
 *
 * `kind` is optional on this arm so an image literal stays `{ uri }` — the shape
 * every caller already writes, and the reason adding video to this gallery is
 * not a breaking change for image consumers.
 */
export interface GalleryImage extends MediaSurfaceImage {
  /**
   * Author-authored accessibility description (Bluesky-style "ALT"). When present,
   * shown as a caption at the bottom of the fullscreen viewer for the active item.
   */
  alt?: string;
  /**
   * Optional intrinsic aspect ratio (width / height) supplied by the consumer.
   * When known ahead of time it avoids a first-frame `Image.getSize` round-trip.
   */
  aspectRatio?: number;
}

/**
 * A video page, fed by a `VideoPlayer` the CONSUMER created and owns.
 *
 * Bloom neither creates nor destroys players — see `MediaSurfaceVideo`. That is
 * what lets the same video keep playing as it moves from a feed thumbnail into
 * this gallery and back out again: one player, a different view.
 */
export interface GalleryVideo extends MediaSurfaceVideo {
  /**
   * Stable identity for this video. Used as the React key (a video has no `uri`
   * to key on) and as the media-flight id when the consumer flies it in.
   */
  id: string;
  /** See {@link GalleryImage.alt}. */
  alt?: string;
  /**
   * Intrinsic aspect ratio. Strongly recommended for video: unlike an image
   * there is nothing to probe for it, so without one the page opens at the
   * gallery's default ratio and resizes when the first frame arrives.
   */
  aspectRatio?: number;
  /**
   * URL handed to the share sheet. The poster is not what a user means by
   * "share this video", so the two are separate; with neither, the share button
   * is inert for that page.
   */
  shareUrl?: string;
}

/** One page of the gallery: a still image, or a consumer-owned video. */
export type GalleryMedia = GalleryImage | GalleryVideo;

export type { MeasuredRect };

/**
 * Resolve the on-screen rect of the thumbnail at `index` within the SAME
 * media subset the gallery opens/pages in, so the close animation can fly
 * back to the item currently being viewed. Resolves `null` when the thumbnail
 * ref is missing (unmounted/virtualized), in which case the gallery falls back
 * to a plain center fade-out.
 */
export type MeasureThumb = (index: number) => Promise<MeasuredRect | null>;

export interface ZoomableMediaGalleryHandle {
  /**
   * Open the gallery at `index` within `items`, animating the zoom from the
   * tapped thumbnail's measured screen rect (when provided).
   */
  open: (items: GalleryMedia[], index: number, rect?: MeasuredRect) => void;
}

export interface ZoomableMediaGalleryProps {
  /** Measures any thumbnail by its media subset index, used on dismiss. */
  measureThumb?: MeasureThumb;
  /**
   * Corner radius applied to the zoomed media. `'circle'` rounds each item to
   * a full circle at whatever size it is fitted to — what an avatar needs, and
   * the reason avatars don't need their own viewer.
   */
  cornerRadius?: number | 'circle';
  /**
   * Bottom page indicator for multi-item galleries. `'dots'` (default) renders the
   * compact dot row; `'thumbnails'` renders a horizontal strip of tappable media
   * tiles. The counter pill shows in both. Ignored for single-item galleries.
   */
  indicatorVariant?: 'dots' | 'thumbnails';
  /**
   * Whether video pages show expo-video's own transport controls. Off by
   * default, so a video opens as a picture that happens to move — the same
   * gesture vocabulary (tap to dismiss, drag to dismiss) as an image. Turn it
   * on for a viewer whose job is watching rather than glancing.
   */
  videoControls?: boolean;
}
