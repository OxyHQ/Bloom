import { useEffect, useRef } from 'react';
import { Image as NativeImage, processColor, type ImageResizeMode } from 'react-native';
import { loadBloomImageModule, loadBloomImageView } from './bloom-image-view';
import { loadExpoImage } from './expo-image-module';
import type { BloomImageContentFit, BloomImageProps, BloomImageSource } from './types';

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
 * On a device it renders, in order of preference:
 *
 * 1. Bloom's own native image view, `BloomImageView`, in a build that links it
 *    (`bloom build android`): Kotlin over React Native's own image pipeline, its
 *    memory and disk caches (`bloom-image-view.ts`).
 * 2. `expo-image` (an Expo build), so no image Bloom draws depends on
 *    react-native's GIF/WebP decoders and an app may switch them off
 *    (`expo-build-properties` `android.gifEnabled`/`webpEnabled: false`).
 * 3. react-native's `Image`, wherever neither can be loaded, and on web.
 *
 * Why the split and why each is `require`d: `bloom-image-view.ts` and
 * `expo-image-module.ts`.
 *
 * One vocabulary for both renderers: `contentFit` (expo-image's) and a plain
 * `{ width, height }` / `{ error }` for `onLoad` / `onError`, so a caller never
 * branches on which one drew the pixels.
 */
export function BloomImage({
  contentFit = 'cover',
  transition,
  cachePolicy = 'memory-disk',
  recyclingKey,
  onLoad,
  onError,
  ...rest
}: BloomImageProps) {
  const BloomImageView = loadBloomImageView();
  if (BloomImageView) {
    const { source, tintColor, blurRadius, alt, ...viewRest } = rest;
    const { uri, headers } = sourceOf(source);
    const tint = tintColor === undefined ? null : processColor(tintColor);
    return (
      <BloomImageView
        {...viewRest}
        // `alt` is the image's name, as expo-image reads it.
        accessibilityLabel={rest.accessibilityLabel ?? alt}
        source={uri}
        headers={headers}
        contentFit={contentFit}
        transition={transition ?? 0}
        cachePolicy={cachePolicy}
        recyclingKey={recyclingKey ?? undefined}
        tint={typeof tint === 'number' ? tint : 0}
        blurRadius={blurRadius ?? 0}
        onLoad={onLoad ? (event) => onLoad(event.nativeEvent) : undefined}
        onError={onError ? (event) => onError(event.nativeEvent) : undefined}
      />
    );
  }

  const ExpoImage = loadExpoImage();
  if (ExpoImage) {
    return (
      <ExpoImage
        {...rest}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        recyclingKey={recyclingKey}
        onLoad={
          onLoad
            ? (event) => onLoad({ width: event.source.width, height: event.source.height })
            : undefined
        }
        onError={onError ? (event) => onError({ error: event.error }) : undefined}
      />
    );
  }

  return (
    <FallbackImage
      {...rest}
      contentFit={contentFit}
      transition={transition}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

const NO_HEADERS: readonly string[] = [];

/**
 * The native view's source: a URI and its request headers as `[name, value, …]`. A
 * bundled image (`require()`) is the URI React Native's asset resolver gives it (Metro's
 * URL in development, the drawable's name in a release build); of several sources, the
 * first.
 */
function sourceOf(source: BloomImageSource | null | undefined): {
  uri: string | undefined;
  headers: readonly string[];
} {
  if (source == null) return { uri: undefined, headers: NO_HEADERS };
  if (typeof source === 'string') return { uri: source, headers: NO_HEADERS };
  const descriptor =
    typeof source === 'number'
      ? NativeImage.resolveAssetSource?.(source)
      : Array.isArray(source)
        ? source[0]
        : source;
  if (!descriptor?.uri) return { uri: undefined, headers: NO_HEADERS };
  const headers = descriptor.headers
    ? Object.entries(descriptor.headers).flatMap(([name, value]) => [name, String(value)])
    : NO_HEADERS;
  return { uri: descriptor.uri, headers };
}

/**
 * Only the RN/RNW renderer needs lifecycle state for asynchronous dimension probes.
 * Keep this component mounted when callbacks change so the image node stays stable.
 */
function FallbackImage({
  contentFit = 'cover',
  transition,
  onLoad,
  onError,
  ...rest
}: BloomImageProps) {
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

  const { source, ...nativeRest } = rest;
  return (
    <NativeImage
      {...nativeRest}
      // `alt` is the image's name, as expo-image and React Native's own Image read it;
      // react-native-web's Image reads only `accessibilityLabel` (its `aria-label` and `<img alt>`).
      accessibilityLabel={rest.accessibilityLabel ?? rest.alt}
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
 * {@link BloomImage} will read from — Bloom's image view's or expo-image's on a
 * device, the browser's on web. Resolves `false` instead of rejecting.
 */
export function prefetchImage(uri: string): Promise<boolean> {
  const bloom = loadBloomImageModule();
  if (bloom) return bloom.prefetch([uri], false).catch(() => false);
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
  const bloom = loadBloomImageModule();
  if (bloom) return bloom.size(uri).then(([width = 0, height = 0]) => ({ width, height }));
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
