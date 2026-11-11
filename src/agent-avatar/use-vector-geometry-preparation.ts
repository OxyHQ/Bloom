import { useEffect } from 'react';
import { resolveAvatarCharacter, type AvatarCharacter } from './character';
import { useVectorAssetLoader } from './default-catalog';
import { loadVectorGeometry, vectorGeometryKey } from './vector-compose';

/** Prepare two neighbors sequentially: browser idle time, deferred timer on native. */
export function useVectorGeometryPreparation(characters: readonly AvatarCharacter[]): void {
  const catalog = useVectorAssetLoader();
  const recipes = characters.slice(0, 2).map(resolveAvatarCharacter);
  const key = JSON.stringify(recipes.map(vectorGeometryKey));
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    let index = 0;
    const schedule = () => {
      if (cancelled || index >= recipes.length) return;
      const prepare = () => {
        if (cancelled) return;
        const recipe = recipes[index++]!;
        void loadVectorGeometry(recipe, catalog)
          .catch(() => undefined)
          .then(schedule);
      };
      if (typeof requestIdleCallback === 'function') idle = requestIdleCallback(prepare);
      else timer = setTimeout(prepare, 150);
    };
    // Avoid competing with the selected character's first load or rapid wheel changes.
    timer = setTimeout(schedule, 250);
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      if (idle !== undefined && typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
    };
    // Paint does not change geometry. The key captures the complete prepared recipes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, catalog]);
}
