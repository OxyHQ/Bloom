import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { AgentAvatarProviderProps } from './types';
import {
  type CharacterCapabilities,
  CharacterRuntimeContext,
  CharacterCapabilitiesContext,
} from './context';

const EMPTY_CAPABILITIES: ReadonlyMap<string, CharacterCapabilities> =
  new Map();
function sameRecord<T>(left: Record<string, T>, right: Record<string, T>) {
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => left[key] === right[key])
  );
}

/** Enables the optional character engine without fetching it until an avatar needs it. */
export function AgentAvatarProvider({
  runtimeUrl,
  children,
}: AgentAvatarProviderProps) {
  const [cache, setCapabilities] = useState(() => ({
    runtimeUrl,
    entries: EMPTY_CAPABILITIES,
  }));
  const activeRuntime = useRef(runtimeUrl);
  activeRuntime.current = runtimeUrl;
  // An old module's catalog cannot describe the newly selected runtime, even
  // for the same saved recipe. Hide its cache during the first changed render.
  const capabilitiesByKey =
    cache.runtimeUrl === runtimeUrl ? cache.entries : EMPTY_CAPABILITIES;
  useEffect(() => {
    setCapabilities((previous) =>
      previous.runtimeUrl === runtimeUrl
        ? previous
        : { runtimeUrl, entries: EMPTY_CAPABILITIES },
    );
  }, [runtimeUrl]);
  const reportCapabilities = useCallback(
    (next: CharacterCapabilities) => {
      // A disposed renderer can finish preparing after its runtime was replaced.
      if (activeRuntime.current !== runtimeUrl) return;
      setCapabilities((previous) => {
        if (activeRuntime.current !== runtimeUrl) return previous;
        const prior =
          previous.runtimeUrl === runtimeUrl
            ? previous.entries
            : EMPTY_CAPABILITIES;
        const known = prior.get(next.key);
        if (
          known &&
          sameRecord(known.available, next.available) &&
          sameRecord(known.selected, next.selected)
        )
          return previous;
        const entries = new Map(prior);
        entries.delete(next.key);
        entries.set(next.key, next);
        if (entries.size > 64) entries.delete(entries.keys().next().value!);
        return { runtimeUrl, entries };
      });
    },
    [runtimeUrl],
  );
  const value = useMemo(
    () => ({ runtimeUrl, reportCapabilities }),
    [runtimeUrl, reportCapabilities],
  );
  const catalog = useMemo(() => ({ capabilitiesByKey }), [capabilitiesByKey]);
  return (
    <CharacterRuntimeContext.Provider value={value}>
      <CharacterCapabilitiesContext.Provider value={catalog}>
        {children}
      </CharacterCapabilitiesContext.Provider>
    </CharacterRuntimeContext.Provider>
  );
}
