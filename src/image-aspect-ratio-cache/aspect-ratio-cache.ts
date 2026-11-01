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

// Only in-flight probes have an entry. A committed newer probe cannot be
// overwritten by an older one; an explicit set invalidates all pending probes.
const inFlightProbes = new Map<
  string,
  { generation: number; committedGeneration: number; count: number }
>();

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
    const pending = inFlightProbes.get(uri);
    if (pending) pending.committedGeneration = ++pending.generation;
    aspectRatioCache.set(uri, ratio);
  }
};

/**
 * Internal owner-aware probe. An obsolete owner still receives its result, but
 * cannot put it into the shared cache. The public helper uses an always-live owner.
 */
export const fetchAspectRatioForOwner = (
  uri: string,
  isCurrent: () => boolean,
): Promise<number> => {
  const cached = aspectRatioCache.get(uri);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  let pending = inFlightProbes.get(uri);
  if (!pending) {
    pending = { generation: 0, committedGeneration: 0, count: 0 };
    inFlightProbes.set(uri, pending);
  }
  const state = pending;
  const generation = ++state.generation;
  state.count += 1;
  const finish = () => {
    state.count -= 1;
    if (state.count === 0 && inFlightProbes.get(uri) === state) inFlightProbes.delete(uri);
  };
  let size: Promise<IntrinsicSize>;
  try {
    size = getImageSize(uri);
  } catch (error) {
    finish();
    throw error;
  }
  const mayCache = () => {
    if (!isCurrent() || generation < state.committedGeneration) return false;
    state.committedGeneration = generation;
    return true;
  };
  return size.then(
    (result) => {
      try {
        const { width, height } = result;
        if (width > 0 && height > 0) {
          const ratio = width / height;
          if (mayCache()) {
            aspectRatioCache.set(uri, ratio);
            intrinsicSizeCache.set(uri, { width, height });
          }
          return ratio;
        }
        if (mayCache()) aspectRatioCache.set(uri, DEFAULT_ASPECT_RATIO);
        return DEFAULT_ASPECT_RATIO;
      } finally {
        finish();
      }
    },
    () => {
      try {
        if (mayCache()) aspectRatioCache.set(uri, DEFAULT_ASPECT_RATIO);
        return DEFAULT_ASPECT_RATIO;
      } finally {
        finish();
      }
    },
  );
};

const alwaysCurrent = () => true;

/**
 * Resolve the aspect ratio for `uri`, returning the cached value immediately on
 * a hit and otherwise fetching the intrinsic size via `getImageSize` (`image/`), writing
 * the result back into the shared cache. On failure the shared
 * `DEFAULT_ASPECT_RATIO` is cached and returned so callers never deadlock on a
 * broken image.
 */
export const fetchAspectRatio = (uri: string): Promise<number> =>
  fetchAspectRatioForOwner(uri, alwaysCurrent);
