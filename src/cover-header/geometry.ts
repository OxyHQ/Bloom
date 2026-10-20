import type { BloomImageSource } from '../image';
import type { CoverImageGeometry, CoverPosition } from './types';

export const CENTER_POSITION: CoverPosition = { x: 0.5, y: 0.5 };
export function clampPosition(position: CoverPosition): CoverPosition {
  const clamp = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5);
  return { x: clamp(position.x), y: clamp(position.y) };
}
export function coverGeometry(
  box: { width: number; height: number },
  natural: { width: number; height: number },
  fit: 'cover' | 'contain',
): CoverImageGeometry | null {
  if (box.width <= 0 || box.height <= 0 || natural.width <= 0 || natural.height <= 0) return null;
  const scale = Math[fit === 'cover' ? 'max' : 'min'](
    box.width / natural.width,
    box.height / natural.height,
  );
  const width = natural.width * scale;
  const height = natural.height * scale;
  return {
    width,
    height,
    overflowX: Math.max(0, width - box.width),
    overflowY: Math.max(0, height - box.height),
  };
}
export function dragCoverPosition(
  start: CoverPosition,
  delta: { x: number; y: number },
  geometry: CoverImageGeometry,
  axes: 'vertical' | 'both',
): CoverPosition {
  return clampPosition({
    x: axes === 'both' && geometry.overflowX > 0 ? start.x - delta.x / geometry.overflowX : start.x,
    y: geometry.overflowY > 0 ? start.y - delta.y / geometry.overflowY : start.y,
  });
}

/** Stable asset identity can survive signed URL renewal without cancelling an edit. */
export function coverSourceIdentity(
  source: BloomImageSource | null | undefined,
  key?: string | number,
): string {
  if (key !== undefined) return `key:${key}`;
  if (
    source &&
    typeof source === 'object' &&
    'cacheKey' in source &&
    typeof source.cacheKey === 'string'
  )
    return `cache:${source.cacheKey}`;
  return JSON.stringify(source) ?? '';
}
