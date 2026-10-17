import type { ImageSourcePropType, ImageStyle, StyleProp, ViewProps } from 'react-native';

/**
 * How the image fills its box — expo-image's vocabulary, because expo-image is
 * what draws it on a device. The react-native `Image` fallback maps each value
 * onto the nearest `resizeMode` (`BloomImage.tsx`).
 */
export type BloomImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

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
  onLoad?: (info: BloomImageLoadInfo) => void;
  onError?: (info: BloomImageErrorInfo) => void;
  onLayout?: ViewProps['onLayout'];
}
