/**
 * How {@link BloomImage} draws Bloom's native image view: WEB/default, which draws
 * nothing (the view is never linked on web). The native file is
 * `bloom-image-view-draw.native.tsx`.
 */
import type { ComponentType, ReactElement } from 'react';
import type { BloomImageViewProps } from './bloom-image-view-types';
import type { BloomImageProps } from './types';

/** `BloomImage`'s props with its defaults applied (`contentFit`, `cachePolicy`). */
export type DrawnBloomImageProps = BloomImageProps &
  Required<Pick<BloomImageProps, 'contentFit' | 'cachePolicy'>>;

/** Nothing on web. */
export function drawBloomImageView(
  _View: ComponentType<BloomImageViewProps>,
  _props: DrawnBloomImageProps,
): ReactElement | null {
  return null;
}
