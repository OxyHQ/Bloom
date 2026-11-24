import type { ImageSourcePropType, ImageStyle, StyleProp, ViewProps } from 'react-native';

/**
 * How the image fills its box — expo-image's vocabulary, because expo-image is
 * what draws it on a device. The react-native `Image` fallback maps each value
 * onto the nearest `resizeMode` (`BloomImage.tsx`).
 */
export type BloomImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

/** Where a loaded image is kept: expo-image's cache policies. */
export type BloomImageCachePolicy = 'memory-disk' | 'memory' | 'disk' | 'none';

/** A bundled asset (`require()`), a URI descriptor or a bare URI string. */
export type BloomImageSource = ImageSourcePropType | string;

/** The intrinsic pixel size, reported once the image has loaded. */
export interface BloomImageLoadInfo {
  width: number;
  height: number;
}

/** Why the image did not load, as the renderer reported it. */
export interface BloomImageErrorInfo {
  error: string;
}

/**
 * Props of {@link BloomImage}. View-level props (accessibility, `testID`,
 * `pointerEvents`) pass through to whichever renderer draws the image.
 */
export interface BloomImageProps extends Omit<ViewProps, 'style' | 'children' | 'onLayout'> {
  source: BloomImageSource | null | undefined;
  /** Defaults to `cover`, the default of both renderers. */
  contentFit?: BloomImageContentFit;
  style?: StyleProp<ImageStyle>;
  /** Paints every opaque pixel this color (monochrome glyph artwork). */
  tintColor?: string;
  blurRadius?: number;
  /** Text alternative; the same as `accessibilityLabel`. */
  alt?: string;
  /** Cross-fade duration in ms when the image arrives. Defaults to none. */
  transition?: number;
  /**
   * Where a loaded image is kept for the next time it is drawn. Defaults to
   * `memory-disk`: the decoded picture stays in memory, so an image scrolled back
   * to, or drawn again by another row, paints in the same frame instead of being
   * decoded from disk again. `disk` keeps only the downloaded bytes; `none` keeps
   * nothing. expo-image's vocabulary; react-native's `Image` (web) ignores it.
   */
  cachePolicy?: BloomImageCachePolicy;
  /**
   * The identity of what this image shows, for a view a list reuses for another
   * item. When it changes the previous picture is cleared at once, so a recycled
   * row never shows the last row's image while its own loads. Pass the source's
   * URI. Ignored by react-native's `Image` (web), which keeps no picture across
   * sources.
   */
  recyclingKey?: string | null;
  onLoad?: (info: BloomImageLoadInfo) => void;
  onError?: (info: BloomImageErrorInfo) => void;
  onLayout?: ViewProps['onLayout'];
}
