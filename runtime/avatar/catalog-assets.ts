import type { ResolvedAvatarAsset } from './authored-engine';
import { composeCatalog, type CatalogRecipe, type ComposedCatalog } from './catalog-compose';
import { attachCatalogComputer } from './catalog-computer';
import type { AuthoredMotionSampler } from './motion';
import type { MotionSamplers } from './motion-catalog';
import type { EyeGazeProfile } from './eye-gaze-controller';

export type CatalogMotionResolver = (
  composed: ComposedCatalog,
  detail: 'low' | 'high',
  work?: AuthoredMotionSampler,
) => Promise<{ samplers: MotionSamplers; eyeProfiles: Record<number, EyeGazeProfile> }>;

/** Asset ownership transfers to the renderer only after the complete rig loads.
 * A failed recipe releases its own geometry and never selects another backend. */
export function createCatalogAssetResolver(resolveMotion: CatalogMotionResolver) {
  return async (
    key: string,
    detail: 'low' | 'high',
    activities = true,
  ): Promise<ResolvedAvatarAsset> => {
    if (!key.startsWith('catalog:')) throw Error(`Unknown avatar asset: ${key}`);
    const recipe = JSON.parse(key.slice('catalog:'.length)) as CatalogRecipe;
    if (
      !recipe ||
      ['shape', 'eyes', 'eyewear', 'accessory'].some(
        (name) => typeof recipe[name as keyof CatalogRecipe] !== 'string',
      )
    )
      throw Error('Invalid avatar catalog recipe');
    const composed = await composeCatalog(recipe, detail);
    try {
      const work = activities ? await attachCatalogComputer(composed, recipe.shape) : undefined;
      const { samplers, eyeProfiles } = await resolveMotion(composed, detail, work);
      if (!samplers.idle || !samplers.reaction || (activities && !samplers.work))
        throw Error('Incomplete avatar catalog animation');
      if (recipe.previewPart === 'eyes') {
        // Keep the rig/material indices intact, but never submit body, eyewear,
        // accessories or work props to the renderer. Its alpha fit frames the eyes.
        const eyes = new Set(
          composed.bindings.filter((b) => b.part.category === 'eyes').map((b) => b.part),
        );
        composed.source.parts = composed.source.parts.filter((part) => {
          if (eyes.has(part as (typeof composed.bindings)[number]['part'])) return true;
          part.geometry.dispose();
          return false;
        });
      }
      return { source: composed.source, samplers, eyeProfiles };
    } catch (error) {
      for (const part of composed.source.parts) part.geometry.dispose();
      throw error;
    }
  };
}
