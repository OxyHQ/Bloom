import type { ImageSource } from '../shapes/types';
import { assertImageSource } from '../shapes/validation';

/**
 * Sort serialized descriptor keys so equivalent inline sources retain failures.
 * A new URI,
 * local asset ID or dimension descriptor starts a new request.
 */
export function imageSourcesKey(primary?: ImageSource, fallback?: ImageSource): string {
  if (primary !== undefined) assertImageSource(primary);
  if (fallback !== undefined) assertImageSource(fallback);
  return JSON.stringify([primary ?? null, fallback ?? null], (_key, value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    );
  });
}
