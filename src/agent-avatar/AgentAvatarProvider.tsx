import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { AgentAvatarProviderProps } from './types';
import { CharacterStillHost, type NativeStillJob } from './CharacterStillHost';
import { createCharacterStills, type StillBackend } from './character-still';
import { renderWebStill } from './character-still-web';
import {
  type CharacterCapabilities,
  CharacterRuntimeContext,
  BLOOM_CHARACTER_RUNTIME_URL,
  CharacterCapabilitiesContext,
} from './context';

const EMPTY_CAPABILITIES: ReadonlyMap<string, CharacterCapabilities> = new Map();
function sameRecord<T>(left: Record<string, T>, right: Record<string, T>) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

/** Enables the character engine without fetching it until an avatar needs it. */
export function AgentAvatarProvider({
  runtimeUrl = BLOOM_CHARACTER_RUNTIME_URL,
  stillStorage,
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
  const capabilitiesByKey = cache.runtimeUrl === runtimeUrl ? cache.entries : EMPTY_CAPABILITIES;
  useEffect(() => {
    setCapabilities((previous) =>
      previous.runtimeUrl === runtimeUrl ? previous : { runtimeUrl, entries: EMPTY_CAPABILITIES },
    );
  }, [runtimeUrl]);
  const reportCapabilities = useCallback(
    (next: CharacterCapabilities) => {
      // A disposed renderer can finish preparing after its runtime was replaced.
      if (activeRuntime.current !== runtimeUrl) return;
      setCapabilities((previous) => {
        if (activeRuntime.current !== runtimeUrl) return previous;
        const prior = previous.runtimeUrl === runtimeUrl ? previous.entries : EMPTY_CAPABILITIES;
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
  // Native draws stills in one hidden WebView (`CharacterStillHost`) this provider mounts while a
  // render is queued; web draws them straight into the DOM. Either way, one render at a time.
  const [nativeJob, setNativeJob] = useState<NativeStillJob | null>(null);
  const stills = useMemo(() => {
    const backend: StillBackend =
      Platform.OS === 'web'
        ? renderWebStill
        : (job) =>
            new Promise((resolve) => {
              const nextJob: NativeStillJob = {
                ...job,
                done: (uri) => {
                  setNativeJob((current) => (current === nextJob ? null : current));
                  resolve(uri);
                },
              };
              setNativeJob(nextJob);
            });
    return createCharacterStills({ runtimeUrl, storage: stillStorage, backend });
  }, [runtimeUrl, stillStorage]);
  const mountedCache = useRef<typeof stills | null>(null);
  useEffect(() => {
    mountedCache.current = stills;
    return () => {
      mountedCache.current = null;
      // StrictMode replays effects on the same cache. Dispose after that replay, but
      // before an obsolete provider can continue draining work in a later task.
      queueMicrotask(() => {
        if (mountedCache.current !== stills) stills.dispose();
      });
    };
  }, [stills]);
  const value = useMemo(
    () => ({ runtimeUrl, reportCapabilities, stills }),
    [runtimeUrl, reportCapabilities, stills],
  );
  const catalog = useMemo(() => ({ capabilitiesByKey }), [capabilitiesByKey]);
  return (
    <CharacterRuntimeContext.Provider value={value}>
      <CharacterCapabilitiesContext.Provider value={catalog}>
        {children}
        {Platform.OS === 'web' ? null : (
          <CharacterStillHost job={nativeJob?.runtimeUrl === runtimeUrl ? nativeJob : null} />
        )}
      </CharacterCapabilitiesContext.Provider>
    </CharacterRuntimeContext.Provider>
  );
}
