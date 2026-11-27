/**
 * Bloom's native image view's load boundary: WEB/default. The native file,
 * `bloom-image-view.native.ts`, is filename-resolved by Metro (as `ToastHost.native.tsx`
 * is). On web the view is never linked, so this file loads nothing and a web bundle
 * (Metro's, Vite's, esbuild's) carries neither the loader nor the native view's specs:
 * the avatar's web initial-chunk budget (`scripts/verify-avatar-bundle-size.mjs`) holds.
 */
import type { ComponentType } from 'react';
import type { BloomImageModuleLike, BloomImageViewProps } from './bloom-image-view-types';

export type { BloomImageModuleLike, BloomImageViewProps } from './bloom-image-view-types';

/** Never on web. */
export function loadBloomImageView(): ComponentType<BloomImageViewProps> | null {
  return null;
}

/** Never on web. */
export function loadBloomImageModule(): BloomImageModuleLike | null {
  return null;
}
