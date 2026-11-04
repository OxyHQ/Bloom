import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_PREFERENCES,
  preferencesKey,
  readPreferences,
  writePreferences,
} from './persistence';
import type {
  BloomPreferences,
  BloomPreferencesContextValue,
  BloomPreferencesProviderProps,
} from './types';

const BloomPreferencesContext = createContext<BloomPreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  setPreference: () => {},
});

/**
 * Holds the viewer's {@link BloomPreferences}. `BloomProvider` mounts it with the
 * theme's storage, so an app mounts nothing; a nested one scopes its subtree.
 */
export function BloomPreferencesProvider({
  storage,
  persistKey,
  children,
}: BloomPreferencesProviderProps) {
  const key = preferencesKey(persistKey);
  const [preferences, setPreferences] = useState<BloomPreferences>(DEFAULT_PREFERENCES);
  // The record as last set, for the setter to build on without a stale closure.
  const currentRef = useRef(preferences);
  // A choice made before the stored record arrives must not be overwritten by it.
  const touchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void readPreferences(key, storage).then((stored) => {
      if (!stored || cancelled || touchedRef.current) return;
      currentRef.current = stored;
      setPreferences(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [key, storage]);

  const setPreference = useCallback<BloomPreferencesContextValue['setPreference']>(
    (name, value) => {
      touchedRef.current = true;
      if (currentRef.current[name] === value) return;
      const next = { ...currentRef.current, [name]: value };
      currentRef.current = next;
      setPreferences(next);
      void writePreferences(key, storage, next);
    },
    [key, storage],
  );

  const value = useMemo(() => ({ preferences, setPreference }), [preferences, setPreference]);
  return (
    <BloomPreferencesContext.Provider value={value}>{children}</BloomPreferencesContext.Provider>
  );
}

BloomPreferencesProvider.displayName = 'BloomPreferencesProvider';

/** The viewer's preferences and their setter. Defaults apply outside any provider. */
export function useBloomPreferences(): BloomPreferencesContextValue {
  return useContext(BloomPreferencesContext);
}
