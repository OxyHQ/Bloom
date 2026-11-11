import { useContext } from 'react';
import { VectorCatalogContext } from './context';
import type { VectorAssetLoader } from './vector-types';

let pending: Promise<VectorAssetLoader> | undefined;
/**
 * Bloom's own full catalog, linked only from here and only lazily. An app that supplies its own
 * `catalog` drops it: Vite, webpack and esbuild fold `process.env.EXPO_PUBLIC_BLOOM_AVATAR_CATALOG`
 * (define it as "none"); Metro does not inline env vars inside node_modules, so a Metro app resolves
 * `./vector-assets` from this file to an empty module instead (docs/agent-avatar.mdx).
 */
function loadDefaultCatalog(): Promise<VectorAssetLoader> {
  if (process.env.EXPO_PUBLIC_BLOOM_AVATAR_CATALOG !== 'none')
    return (pending ??= import('./vector-assets').then((module) => {
      // A Metro `{ type: 'empty' }` resolution (docs/agent-avatar.mdx) leaves no loader behind.
      if (!module.vectorAssetLoader) throw new Error('Bloom avatar catalog is not bundled');
      return module.vectorAssetLoader;
    }));
  return Promise.reject(
    new Error('Bloom avatar catalog is disabled; pass `catalog` to AgentAvatarProvider'),
  );
}

/** Resolves each asset through the lazily loaded full catalog. */
export const defaultVectorAssetLoader: VectorAssetLoader = {
  shape: (id) => loadDefaultCatalog().then((catalog) => catalog.shape(id)),
  eyes: (id) => loadDefaultCatalog().then((catalog) => catalog.eyes(id)),
  eyewear: (id) => loadDefaultCatalog().then((catalog) => catalog.eyewear(id)),
  accessory: (id) => loadDefaultCatalog().then((catalog) => catalog.accessory(id)),
  template: (character) => loadDefaultCatalog().then((catalog) => catalog.template(character)),
};

/** The catalog a character renders from: the prop, else the provider's, else Bloom's own. */
export function useVectorAssetLoader(catalog?: VectorAssetLoader): VectorAssetLoader {
  const provided = useContext(VectorCatalogContext);
  return catalog ?? provided ?? defaultVectorAssetLoader;
}
