import { resolveAvatarCharacter, type ResolvedAvatarCharacter } from './character';
import { vectorTemplateCharacters } from './vector-template-characters';
import { VECTOR_ACTIONS, type VectorAssetImport } from './vector-pack';
import type { VectorAction, VectorAssetLoader, VectorData } from './vector-types';

export type { VectorAssetImport } from './vector-pack';
export type { VectorAssetLoader } from './vector-types';

/**
 * The vector assets an app ships, by id. Each value is the default export of one module
 * under `@oxy.so/bloom/agent-avatar/catalog/<kind>-<id>`; the app bundles exactly the
 * ones it lists. An id that is not listed fails to load like an unknown one: the avatar
 * shows its placeholder.
 */
export type VectorAssetSources = {
  shape?: Partial<Record<ResolvedAvatarCharacter['shape'], VectorAssetImport>>;
  eyes?: Partial<Record<ResolvedAvatarCharacter['eyes'], VectorAssetImport>>;
  eyewear?: Partial<Record<ResolvedAvatarCharacter['eyewear'], VectorAssetImport>>;
  accessory?: Partial<Record<ResolvedAvatarCharacter['accessory'], VectorAssetImport>>;
  /** Authored whole characters (presets), keyed by template id such as `blue_beret`. */
  template?: Partial<Record<keyof typeof vectorTemplateCharacters, VectorAssetImport>>;
};

const templates = Object.entries(vectorTemplateCharacters).map(([id, character]) => ({
  id,
  character: resolveAvatarCharacter(character),
}));

/** Loads kept per loader: an asset at rest and the same asset whole are two. */
export const VECTOR_ASSET_CACHE_SIZE = 24;

/** Builds the loader `AgentAvatarProvider`'s `catalog` prop takes. Sources are read at call time. */
export function createVectorAssetLoader(sources: VectorAssetSources): VectorAssetLoader {
  // By asset and by the clips asked for: a character at rest and the same one gesturing are two
  // loads of the same module, and the second fetches only what the first left out.
  const cache = new Map<string, Promise<VectorData>>();
  const keys = new Map<VectorAssetImport, number>();
  const load = (
    importer: VectorAssetImport | undefined,
    clips: readonly VectorAction[] = VECTOR_ACTIONS,
  ): Promise<VectorData> => {
    if (!importer) return Promise.reject(new Error('Unknown vector avatar asset'));
    if (!keys.has(importer)) keys.set(importer, keys.size);
    const key = `${keys.get(importer)}:${[...new Set(clips)].sort().join(',')}`;
    const existing = cache.get(key);
    if (existing) {
      cache.delete(key);
      cache.set(key, existing);
      return existing;
    }
    const pending = importer(clips).then((module) => module.default);
    cache.set(key, pending);
    if (cache.size > VECTOR_ASSET_CACHE_SIZE) cache.delete(cache.keys().next().value!);
    void pending.catch(() => {
      if (cache.get(key) === pending) cache.delete(key);
    });
    return pending;
  };
  return {
    shape: (id, clips) => load(sources.shape?.[id], clips),
    eyes: (id, clips) => load(id === 'none' ? undefined : sources.eyes?.[id], clips),
    eyewear: (id, clips) => load(id === 'none' ? undefined : sources.eyewear?.[id], clips),
    accessory: (id, clips) => load(id === 'none' ? undefined : sources.accessory?.[id], clips),
    template: (character, clips) => {
      if (character.eyeSpacing !== undefined) return Promise.resolve(undefined);
      const match = templates.find(
        (item) =>
          item.character.authored === character.authored &&
          item.character.shape === character.shape &&
          item.character.eyes === character.eyes &&
          item.character.eyewear === character.eyewear &&
          item.character.accessory === character.accessory,
      );
      const source = match && sources.template?.[match.id as keyof typeof vectorTemplateCharacters];
      return source ? load(source, clips) : Promise.resolve(undefined);
    },
  };
}
