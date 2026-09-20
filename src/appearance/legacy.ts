import type { BloomSize } from './types';

/** Normalize v3 size spellings at public boundaries; contexts use shared sizes. */
export function normalizeBloomSize(size: string | undefined): BloomSize | undefined {
  if (size === 'small') return 'sm';
  if (size === 'medium' || size === 'default' || size === 'icon') return 'md';
  if (size === 'large') return 'lg';
  return size === 'xs' || size === 'sm' || size === 'md' || size === 'lg' ? size : undefined;
}
export type BloomSizeInput = BloomSize | 'small' | 'medium' | 'large' | 'default';
