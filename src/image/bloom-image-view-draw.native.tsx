/**
 * How {@link BloomImage} draws Bloom's native image view: its props in the view's
 * vocabulary. The native file; the web and default one, `bloom-image-view-draw.ts`, draws
 * nothing, since the view is never linked on web (`bloom-image-view.ts`).
 */
import type { ComponentType, ReactElement } from 'react';
import { Image as NativeImage, processColor } from 'react-native';
import type { BloomImageViewProps } from './bloom-image-view-types';
import type { BloomImageProps, BloomImageSource } from './types';

/** `BloomImage`'s props with its defaults applied (`contentFit`, `cachePolicy`). */
export type DrawnBloomImageProps = BloomImageProps &
  Required<Pick<BloomImageProps, 'contentFit' | 'cachePolicy'>>;

/** The native view `View` (from `loadBloomImageView`) for `props`. */
export function drawBloomImageView(
  View: ComponentType<BloomImageViewProps>,
  {
    contentFit,
    transition,
    cachePolicy,
    recyclingKey,
    onLoad,
    onError,
    source,
    tintColor,
    blurRadius,
    alt,
    ...viewRest
  }: DrawnBloomImageProps,
): ReactElement | null {
  const { uri, headers } = sourceOf(source);
  const tint = tintColor === undefined ? null : processColor(tintColor);
  return (
    <View
      {...viewRest}
      // `alt` is the image's name, as expo-image reads it.
      accessibilityLabel={viewRest.accessibilityLabel ?? alt}
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
