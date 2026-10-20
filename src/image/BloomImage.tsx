import { useEffect, useRef } from 'react';
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
  const sourceIdentity = JSON.stringify(rest.source);
  const lifecycle = useRef({ key: sourceIdentity, revision: 0, mounted: true, probe: 0 });
  if (lifecycle.current.key !== sourceIdentity) {
    lifecycle.current.key = sourceIdentity;
    lifecycle.current.revision += 1;
  }
  const sourceRevision = lifecycle.current.revision;
  const current = () => lifecycle.current.mounted && lifecycle.current.revision === sourceRevision;
  useEffect(() => {
    lifecycle.current.mounted = true;
    return () => {
      lifecycle.current.mounted = false;
      lifecycle.current.probe += 1;
    };
  }, []);

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
              // RN emits source dimensions; RNW forwards a DOM Image load event.
              // Read intrinsic pixels from its target, never rendered box size.
              const loaded:
                | {
                    source?: { width: number; height: number };
                    target?: { naturalWidth?: number; naturalHeight?: number } | null;
                  }
                | undefined = event.nativeEvent;
              const target =
                loaded?.target ??
                (
                  event as unknown as {
                    target?: { naturalWidth?: number; naturalHeight?: number };
                  }
                ).target;
              if (!current()) return;
              const width = loaded?.source?.width ?? target?.naturalWidth ?? 0;
              const height = loaded?.source?.height ?? target?.naturalHeight ?? 0;
              if (width > 0 && height > 0) {
                lifecycle.current.probe += 1;
                onLoad({ width, height });
                return;
              }
              // RNW can await image.decode() before forwarding the load Event.
              // Its target may then be absent. Image.getSize reads the cached
              // image object itself, without introducing fetch/CORS requirements.
              const descriptor =
                typeof source === 'string'
                  ? { uri: source }
                  : typeof source === 'number'
                    ? NativeImage.resolveAssetSource?.(source)
                    : Array.isArray(source)
                      ? source[0]
                      : source;
              if (!descriptor?.uri) {
                onLoad({ width: 0, height: 0 });
                return;
              }
              const probe = ++lifecycle.current.probe;
              const valid = () => current() && lifecycle.current.probe === probe;
              const success = (width: number, height: number) => {
                if (valid()) onLoad({ width, height });
              };
              const failure = (error: unknown) => {
                if (!valid()) return;
                onLoad({ width: 0, height: 0 });
                onError?.({ error: error instanceof Error ? error.message : String(error) });
              };
              try {
                if (descriptor.headers && typeof NativeImage.getSizeWithHeaders === 'function')
                  NativeImage.getSizeWithHeaders(
                    descriptor.uri,
                    descriptor.headers,
                    success,
                    failure,
                  );
                else NativeImage.getSize(descriptor.uri, success, failure);
              } catch (error) {
                failure(error);
              }
            }
          : undefined
      }
      onError={(event) => {
        if (!current()) return;
        lifecycle.current.probe += 1;
        onError?.({ error: String(event.nativeEvent.error) });
      }}
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
