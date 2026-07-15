export interface GalleryImage {
  /** Source URI rendered both as the thumbnail and the zoomed image. */
  uri: string;
  /**
   * Author-authored accessibility description (Bluesky-style "ALT"). When present,
   * shown as a caption at the bottom of the fullscreen viewer for the active image.
   */
  alt?: string;
  /**
   * Optional intrinsic aspect ratio (width / height) supplied by the consumer.
   * When known ahead of time it avoids a first-frame `Image.getSize` round-trip.
   */
  aspectRatio?: number;
}

/**
 * On-screen rectangle of a thumbnail, used to fly the zoom transition to/from
 * the tapped image. Bloom-owned so consumers don't depend on an app-local shape.
 */
export interface MeasuredRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Resolve the on-screen rect of the thumbnail at `index` within the SAME
 * images-only subset the gallery opens/pages in, so the close animation can fly
 * back to the image currently being viewed. Resolves `null` when the thumbnail
 * ref is missing (unmounted/virtualized), in which case the gallery falls back
 * to a plain center fade-out.
 */
export type MeasureThumb = (index: number) => Promise<MeasuredRect | null>;

export interface ZoomableImageGalleryHandle {
  /**
   * Open the gallery at `index` within `images`, animating the zoom from the
   * tapped thumbnail's measured screen rect (when provided).
   */
  open: (images: GalleryImage[], index: number, rect?: MeasuredRect) => void;
}

export interface ZoomableImageGalleryProps {
  /** Measures any thumbnail by its images-only subset index, used on dismiss. */
  measureThumb?: MeasureThumb;
  /** Corner radius applied to the zoomed images. Defaults to `DEFAULT_CORNER_RADIUS`. */
  cornerRadius?: number;
}
