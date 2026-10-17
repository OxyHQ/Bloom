import { Image as NativeImage, type ImageResizeMode } from 'react-native';
import { loadExpoImage } from './expo-image-module';
import type { BloomImageContentFit, BloomImageProps } from './types';

/**
 * react-native's nearest `resizeMode` for each fit. `none` and `scale-down` both
 * become `center`, which draws at intrinsic size and scales DOWN only when the
 * image is larger than the box — `scale-down` exactly, `none` for every image
 * that fits.
 */
const RESIZE_MODE: Record<BloomImageContentFit, ImageResizeMode> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'stretch',
  none: 'center',
  'scale-down': 'center',
};

/**
 * The ONE way Bloom draws a raster image.
 *
 * On iOS and Android it renders `expo-image`, so no image Bloom draws depends on
 * react-native's GIF/WebP decoders and an app may switch them off
 * (`expo-build-properties` `android.gifEnabled`/`webpEnabled: false`). On web,
 * and wherever expo-image cannot be loaded, it renders react-native's `Image`.
 * Why the split and why expo-image is `require`d: `expo-image-module.ts`.
 *
 * One vocabulary for both renderers: `contentFit` (expo-image's) and a plain
 * `{ width, height }` / `{ error }` for `onLoad` / `onError`, so a caller never
 * branches on which one drew the pixels.
 */
export function BloomImage({
  contentFit = 'cover',
  transition,
  onLoad,
  onError,
  ...rest
}: BloomImageProps) {
  const ExpoImage = loadExpoImage();

  if (ExpoImage) {
    return (
      <ExpoImage
        {...rest}
        contentFit={contentFit}
        transition={transition}
        onLoad={
          onLoad
            ? (event) => onLoad({ width: event.source.width, height: event.source.height })
            : undefined
        }
        onError={onError ? (event) => onError({ error: event.error }) : undefined}
      />
    );
  }

  const { source, ...nativeRest } = rest;
  return (
    <NativeImage
      {...nativeRest}
      source={typeof source === 'string' ? { uri: source } : (source ?? undefined)}
      resizeMode={RESIZE_MODE[contentFit]}
      fadeDuration={transition}
      onLoad={
        onLoad
          ? (event) => {
              const loaded = event.nativeEvent.source;
              onLoad({ width: loaded.width, height: loaded.height });
            }
          : undefined
      }
      onError={onError ? (event) => onError({ error: String(event.nativeEvent.error) }) : undefined}
    />
  );
}

/**
 * Warm the cache for a remote image the user is about to see, in the cache
 * {@link BloomImage} will read from — expo-image's on a device, the browser's
 * on web. Resolves `false` instead of rejecting.
 */
export function prefetchImage(uri: string): Promise<boolean> {
  const ExpoImage = loadExpoImage();
  const prefetch = ExpoImage?.prefetch
    ? ExpoImage.prefetch.bind(ExpoImage)
    : NativeImage.prefetch.bind(NativeImage);
  return prefetch(uri).catch(() => false);
}

/**
 * Intrinsic pixel size of a remote image, read through the same pipeline (and
 * cache) {@link BloomImage} draws from on a device. Web keeps react-native-web's
 * `getSize`, an `<img>` probe: expo-image's web `loadAsync` uses `fetch`, which
 * needs CORS headers an `<img>` does not.
 */
export function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  const ExpoImage = loadExpoImage();
  if (ExpoImage?.loadAsync) {
    return ExpoImage.loadAsync(uri).then((ref) => {
      const size = { width: ref.width, height: ref.height };
      ref.release?.();
      return size;
    });
  }
  return new Promise((resolve, reject) => {
    NativeImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}
