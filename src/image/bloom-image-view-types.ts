/**
 * The types of Bloom's native image view's boundary (`bloom-image-view.native.ts`), in a
 * file of their own so the web and native files share them.
 */
import type { ImageStyle, StyleProp, ViewProps } from 'react-native';
import type { BloomImageCachePolicy, BloomImageContentFit } from './types';

/** The props of the native view (its generated component spec's `NativeProps`). */
export interface BloomImageViewProps extends Omit<ViewProps, 'style' | 'children'> {
  source?: string;
  headers: readonly string[];
  placeholder?: string;
  contentFit?: BloomImageContentFit;
  transition?: number;
  cachePolicy?: BloomImageCachePolicy;
  recyclingKey?: string;
  tint?: number;
  blurRadius?: number;
  style?: StyleProp<ImageStyle>;
  onLoad?: (event: { nativeEvent: { width: number; height: number } }) => void;
  onError?: (event: { nativeEvent: { error: string } }) => void;
}

/** The slice of the `BloomImage` TurboModule Bloom calls (its generated spec's `Spec`). */
export interface BloomImageModuleLike {
  prefetch(urls: string[], memory: boolean): Promise<boolean>;
  size(url: string): Promise<number[]>;
}
