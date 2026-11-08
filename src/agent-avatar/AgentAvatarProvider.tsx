import { useMemo, useState, useCallback } from 'react';
import type { AgentAvatarProviderProps } from './types';
import {
  type CharacterCapabilities,
  CharacterRuntimeContext,
  CharacterCapabilitiesContext,
} from './context';

function sameRecord<T>(left: Record<string, T>, right: Record<string, T>) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

/** Shares SVG catalog capabilities; no hosted module or hidden render surface. */
export function AgentAvatarProvider({ children }: AgentAvatarProviderProps) {
  const [capabilitiesByKey, setCapabilities] = useState<ReadonlyMap<string, CharacterCapabilities>>(
    () => new Map(),
  );
  const reportCapabilities = useCallback((next: CharacterCapabilities) => {
    setCapabilities((previous) => {
      const known = previous.get(next.key);
      if (
        known &&
        sameRecord(known.available, next.available) &&
        sameRecord(known.selected, next.selected)
      )
        return previous;
      const entries = new Map(previous);
      entries.delete(next.key);
      entries.set(next.key, next);
      if (entries.size > 64) entries.delete(entries.keys().next().value!);
      return entries;
    });
  }, []);
  const value = useMemo(() => ({ reportCapabilities }), [reportCapabilities]);
  const catalog = useMemo(() => ({ capabilitiesByKey }), [capabilitiesByKey]);
  return (
    <CharacterRuntimeContext.Provider value={value}>
      <CharacterCapabilitiesContext.Provider value={catalog}>
        {children}
      </CharacterCapabilitiesContext.Provider>
    </CharacterRuntimeContext.Provider>
  );
}
