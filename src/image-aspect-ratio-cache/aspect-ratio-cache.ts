/**
 * Shared module-scoped cache of image aspect ratios (width / height), keyed by
 * the image source URI.
 *
 * Intended for a thumbnail renderer and a fullscreen viewer (e.g.
 * `@oxy.so/bloom/zoomable-media-gallery`) sharing the SAME image URI to read
 * from and write to this one map, so an image already resolved as a thumbnail
 * has its ratio on hand when it opens "big" — no second cache, no duplicate
 * `getImageSize` round-trip on the hot path. If the two surfaces render
 * different URI variants of the same image (e.g. a smaller thumbnail variant
 * vs. a larger lightbox variant), pass the known ratio through explicitly
 * (`GalleryImage.aspectRatio`) instead of relying on cache-key reuse.
 */
import { getImageSize } from '../image';

/** Fallback ratio used when a remote image's intrinsic size cannot be read. */
export const DEFAULT_ASPECT_RATIO = 4 / 3;

const aspectRatioCache = new Map<string, number>();

/**
 * Intrinsic pixel size, recorded whenever we had to read it anyway (the
 * `getImageSize` behind `fetchAspectRatio`). A viewer needs it to avoid
 * blowing a small image up past its own resolution — a ratio alone cannot say
 * how big "big" is allowed to be.
 */
export interface IntrinsicSize {
  width: number;
  height: number;
}

const intrinsicSizeCache = new Map<string, IntrinsicSize>();

/** Intrinsic size for `uri`, when it has already been measured. */
export const getIntrinsicSize = (uri: string): IntrinsicSize | undefined =>
  intrinsicSizeCache.get(uri);

export const getAspectRatio = (uri: string): number | undefined => aspectRatioCache.get(uri);

export const hasAspectRatio = (uri: string): boolean => aspectRatioCache.has(uri);

export const setAspectRatio = (uri: string, ratio: number): void => {
  if (uri && ratio > 0 && Number.isFinite(ratio)) {
    aspectRatioCache.set(uri, ratio);
  }
};

/**
 * Resolve the aspect ratio for `uri`, returning the cached value immediately on
 * a hit and otherwise fetching the intrinsic size via `getImageSize` (`image/`), writing
 * the result back into the shared cache. On failure the shared
 * `DEFAULT_ASPECT_RATIO` is cached and returned so callers never deadlock on a
 * broken image.
 */
export const fetchAspectRatio = (uri: string): Promise<number> => {
  const cached = aspectRatioCache.get(uri);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  return getImageSize(uri).then(
    ({ width, height }) => {
      if (width > 0 && height > 0) {
        const ratio = width / height;
        aspectRatioCache.set(uri, ratio);
        intrinsicSizeCache.set(uri, { width, height });
        return ratio;
      }
      aspectRatioCache.set(uri, DEFAULT_ASPECT_RATIO);
      return DEFAULT_ASPECT_RATIO;
    },
    () => {
      aspectRatioCache.set(uri, DEFAULT_ASPECT_RATIO);
      return DEFAULT_ASPECT_RATIO;
    },
  );
};
