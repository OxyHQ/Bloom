import { resolveAvatarCharacter } from './character';
import {
  vectorShapeImports,
  vectorEyeImports,
  vectorEyewearImports,
  vectorAccessoryImports,
  vectorTemplateImports,
  vectorTemplateCharacters,
} from './vector-asset-imports';
import type { VectorAssetLoader, VectorData } from './vector-types';
type Import = () => Promise<{ default: VectorData }>;
const cache = new Map<Import, Promise<VectorData>>();
function load(importer: Import | undefined): Promise<VectorData> {
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
}
const templates = Object.entries(vectorTemplateCharacters).map(([id, character]) => ({
  id,
  character: resolveAvatarCharacter(character),
}));
export const vectorAssetLoader: VectorAssetLoader = {
  shape: (id) => load(vectorShapeImports[id]),
  eyes: (id) => load(id === 'none' ? undefined : vectorEyeImports[id]),
  eyewear: (id) => load(id === 'none' ? undefined : vectorEyewearImports[id]),
  accessory: (id) => load(id === 'none' ? undefined : vectorAccessoryImports[id]),
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
    return match
      ? load(vectorTemplateImports[match.id as keyof typeof vectorTemplateImports])
      : Promise.resolve(undefined);
  },
};
