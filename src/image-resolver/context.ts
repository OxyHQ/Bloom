import { createContext, useContext } from 'react';

/**
 * A function that resolves opaque identifiers (e.g. Oxy file IDs) to
 * loadable image URLs. Returns `undefined` when no URL is available yet.
 *
 * The optional `variant` selects a rendition (e.g. `'thumb'`, `'small'`,
 * `'medium'`) — it is forwarded straight to the app's URL builder (typically
 * `oxyServices.getFileDownloadUrl(id, variant)`), the single chokepoint where
 * the canonical `cloud.oxy.so`/signed URL is constructed. Resolvers registered
 * as `(id) => …` (ignoring `variant`) remain valid: omitting `variant` yields
 * the full-size rendition.
 */
export type ImageResolver = (
  id: string,
  variant?: string,
) => string | undefined;

const ImageResolverContext = createContext<ImageResolver | null>(null);
ImageResolverContext.displayName = 'BloomImageResolverContext';

export const ImageResolverProvider = ImageResolverContext.Provider;

export function useImageResolver(): ImageResolver | null {
  return useContext(ImageResolverContext);
}
