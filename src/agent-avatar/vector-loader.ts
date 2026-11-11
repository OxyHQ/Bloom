import { resolveAvatarCharacter, type ResolvedAvatarCharacter } from './character';
import { vectorTemplateCharacters } from './vector-template-characters';
import type { VectorAssetImport } from './vector-pack';
import type { VectorAssetLoader, VectorData } from './vector-types';

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

/** Builds the loader `AgentAvatarProvider`'s `catalog` prop takes. Sources are read at call time. */
export function createVectorAssetLoader(sources: VectorAssetSources): VectorAssetLoader {
  const cache = new Map<VectorAssetImport, Promise<VectorData>>();
  const load = (importer: VectorAssetImport | undefined): Promise<VectorData> => {
    if (!importer) return Promise.reject(new Error('Unknown vector avatar asset'));
    const existing = cache.get(importer);
    if (existing) {
      cache.delete(importer);
      cache.set(importer, existing);
      return existing;
    }
    const pending = importer().then((module) => module.default);
    cache.set(importer, pending);
    if (cache.size > 12) cache.delete(cache.keys().next().value!);
    void pending.catch(() => {
      if (cache.get(importer) === pending) cache.delete(importer);
    });
    return pending;
  };
  return {
    shape: (id) => load(sources.shape?.[id]),
    eyes: (id) => load(id === 'none' ? undefined : sources.eyes?.[id]),
    eyewear: (id) => load(id === 'none' ? undefined : sources.eyewear?.[id]),
    accessory: (id) => load(id === 'none' ? undefined : sources.accessory?.[id]),
    template: (character) => {
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
      return source ? load(source) : Promise.resolve(undefined);
    },
  };
}
