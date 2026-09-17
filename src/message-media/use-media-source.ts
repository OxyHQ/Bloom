import type { ImageSourcePropType } from 'react-native';

import { useImageResolver } from '../image-resolver/context';
import type { MessageMediaSource } from './types';

function isUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('file:')
  );
}

/**
 * A `MessageMediaSource` as React Native's `Image` wants it.
 *
 * A bare (non-URL) STRING is an Oxy file ID and goes through the registered
 * {@link ImageResolver}; a full URL, a `{ uri }` object and a `require()` result
 * pass through untouched. Same rule `Avatar` uses, so an app that registered one
 * resolver has registered it for every media block here too.
 *
 * `undefined` when there is nothing to draw — including a file ID with no
 * resolver registered, which is the case a `{ uri: 'abc123' }` would turn into a
 * silently broken request.
 */
export function useMediaSource(
  source: MessageMediaSource | undefined,
  variant?: string,
): ImageSourcePropType | undefined {
  const resolver = useImageResolver();
  if (source === undefined || source === null) return undefined;
  if (typeof source === 'string') {
    if (source.length === 0) return undefined;
    if (isUrl(source)) return { uri: source };
    const resolved = resolver?.(source, variant);
    return resolved ? { uri: resolved } : undefined;
  }
  return source;
}
