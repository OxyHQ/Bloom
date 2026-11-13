import { useEffect, useState } from 'react';

type StaticPortraits = typeof import('./vector-static');

let loaded: StaticPortraits | undefined;
let pending: Promise<StaticPortraits> | undefined;

/**
 * The offline shape and eye portraits (`vector-static`, ~310 KB of paths), loaded on first use.
 *
 * Only the agent creator draws them (its shape arc and its eye picker); an avatar never does. Linked
 * statically from the avatar renderer, they were in every app's first paint. Every caller goes
 * through this one `import()`, so no route links them eagerly and the module is fetched once.
 */
export function loadStaticPortraits(): Promise<StaticPortraits> {
  pending ??= import('./vector-static').then(
    (module) => {
      loaded = module;
      return module;
    },
    (error: unknown) => {
      // Forget a failed fetch so the next render asks again.
      pending = undefined;
      throw error;
    },
  );
  return pending;
}

/**
 * The portraits, or `undefined` until they arrive. The portrait keeps its size meanwhile (an empty
 * box, as for no eyes), so nothing moves when it fills in; after the first load it is synchronous.
 */
export function useStaticPortraits(): StaticPortraits | undefined {
  const [portraits, setPortraits] = useState(loaded);
  useEffect(() => {
    if (portraits) return;
    let live = true;
    loadStaticPortraits().then(
      (module) => {
        if (live) setPortraits(module);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [portraits]);
  return portraits;
}
