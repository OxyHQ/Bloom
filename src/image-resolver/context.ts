import { createContext, useContext } from 'react';

/**
 * A function that resolves opaque identifiers (e.g. file IDs) to
 * loadable image URLs. Returns `undefined` when no URL is available yet.
 */
export type ImageResolver = (id: string) => string | undefined;

const ImageResolverContext = createContext<ImageResolver | null>(null);
ImageResolverContext.displayName = 'BloomImageResolverContext';

export const ImageResolverProvider = ImageResolverContext.Provider;

export function useImageResolver(): ImageResolver | null {
  return useContext(ImageResolverContext);
}
