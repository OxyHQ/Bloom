// Side-effect import — must come first. Initializes react-native-css-interop's
// `darkMode` flag to `'class'` at module load so its MutationObserver doesn't
// throw "Cannot manually set color scheme, as dark mode is type 'media'" the
// first time Bloom toggles the dark class on <html>. See ./init-css-interop.
import './init-css-interop';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useControllableState } from '../hooks/useControllableState';
import { FontLoader } from '../fonts/FontLoader';

import { applyDarkClass, applyColorPresetVars } from './apply-dark-class';
import { buildTheme } from './build-theme';
import { type AppColorName } from './color-presets';
import {
  readPersistedTheme,
  readPersistedThemeSync,
  removePersistedTheme,
  writePersistedTheme,
  type BloomThemeStorage,
  type SyncReadResult,
} from './persistence';
import { setColorSchemeSafe } from './set-color-scheme-safe';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';
import type { Theme, ThemeMode } from './types';

const DEFAULT_PRESET: AppColorName = 'oxy';
const DEFAULT_MODE: ThemeMode = 'system';

export interface BloomThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  colorPreset: AppColorName;
  setMode: (mode: ThemeMode) => void;
  setColorPreset: (preset: AppColorName) => void;
  /**
   * Restore mode and color preset to the provider defaults
   * (`defaultMode` / `defaultColorPreset`) and clear the persisted entry.
   * Use this when signing out or otherwise resetting per-user state.
   */
  resetTheme: () => void;
}

export const BloomThemeContext = createContext<BloomThemeContextValue | null>(null);

export interface BloomThemeProviderProps {
  /** Controlled mode. Omit to use Bloom's internal state (with optional persistence). */
  mode?: ThemeMode;
  /** Controlled color preset. Omit to use Bloom's internal state. */
  colorPreset?: AppColorName;
  /** Initial mode when uncontrolled and nothing is persisted yet. */
  defaultMode?: ThemeMode;
  /** Initial color preset when uncontrolled and nothing is persisted yet. */
  defaultColorPreset?: AppColorName;

  onModeChange?: (mode: ThemeMode) => void;
  onColorPresetChange?: (preset: AppColorName) => void;

  /**
   * Persist mode + preset under this storage key. Bloom becomes the single
   * source of truth — apps don't need their own theme store. Has no effect
   * without `storage`.
   */
  persistKey?: string;
  /**
   * Storage adapter paired with `persistKey`. Use `webLocalStorage` on web,
   * or pass an `AsyncStorage`-compatible adapter on native.
   */
  storage?: BloomThemeStorage;
  /**
   * Block rendering until persisted state has been read. Default `true` when
   * both `persistKey` and `storage` are provided, ensuring native apps don't
   * flash the default palette. Web hydrates synchronously so this is a no-op
   * there.
   */
  awaitHydration?: boolean;
  /** Rendered while async hydration is pending. */
  onHydrating?: React.ReactNode;

  /** Load and inject Bloom's font system. Default `true`. */
  fonts?: boolean;
  /** Rendered while native fonts load. Ignored on web. */
  onFontsLoading?: React.ReactNode;

  children: React.ReactNode;
}

interface ThemeStateOptions {
  controlledMode?: ThemeMode;
  controlledPreset?: AppColorName;
  defaultMode: ThemeMode;
  defaultPreset: AppColorName;
  persistKey?: string;
  storage?: BloomThemeStorage;
  onModeChange?: (mode: ThemeMode) => void;
  onColorPresetChange?: (preset: AppColorName) => void;
}

interface ThemeStateResult {
  mode: ThemeMode;
  colorPreset: AppColorName;
  setMode: (mode: ThemeMode) => void;
  setColorPreset: (preset: AppColorName) => void;
  resetTheme: () => void;
  hydrated: boolean;
}

function useThemeState({
  controlledMode,
  controlledPreset,
  defaultMode,
  defaultPreset,
  persistKey,
  storage,
  onModeChange,
  onColorPresetChange,
}: ThemeStateOptions): ThemeStateResult {
  // Synchronous read happens once on first render. Succeeds on web with
  // localStorage-backed adapters; async adapters rehydrate via the effect
  // below. Lazy-initialized via `useState` so it runs exactly once per mount.
  const [syncResult] = useState<SyncReadResult>(() =>
    readPersistedThemeSync(persistKey, storage),
  );
  const syncState = syncResult.kind === 'sync' ? syncResult.state : null;

  const initialMode = syncState?.mode ?? defaultMode;
  const initialPreset = syncState?.colorPreset ?? defaultPreset;

  // Hydrated immediately when persistence is off or the adapter resolved
  // synchronously (including a null hit — that's a valid "no value" answer).
  const [hydrated, setHydrated] = useState<boolean>(syncResult.kind !== 'async');

  const [mode, setModeInternal] = useControllableState<ThemeMode>({
    value: controlledMode,
    defaultValue: initialMode,
  });
  const [colorPreset, setPresetInternal] = useControllableState<AppColorName>({
    value: controlledPreset,
    defaultValue: initialPreset,
  });

  // Refs let setMode/setColorPreset stay referentially stable. Callbacks
  // memoized only by setters and storage identity won't churn the context
  // value on every theme change.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const presetRef = useRef(colorPreset);
  presetRef.current = colorPreset;

  // Async hydration for adapters that can't be read synchronously
  // (AsyncStorage, MMKV via JSI fallback, etc).
  useEffect(() => {
    if (hydrated) return;
    if (!persistKey || !storage) {
      setHydrated(true);
      return;
    }

    let cancelled = false;
    readPersistedTheme(persistKey, storage).then((state) => {
      if (cancelled) return;
      if (state?.mode && controlledMode === undefined) {
        setModeInternal(state.mode);
        onModeChange?.(state.mode);
      }
      if (state?.colorPreset && controlledPreset === undefined) {
        setPresetInternal(state.colorPreset);
        onColorPresetChange?.(state.colorPreset);
      }
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
    // Hydration runs once per storage instance. controlledMode/Preset are
    // captured by closure intentionally — switching controlled-ness mid-flight
    // is unsupported and would invalidate the in-flight hydration anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, storage]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeInternal(next);
      onModeChange?.(next);
      void writePersistedTheme(persistKey, storage, {
        mode: next,
        colorPreset: presetRef.current,
      });
    },
    [setModeInternal, onModeChange, persistKey, storage],
  );

  const setColorPreset = useCallback(
    (next: AppColorName) => {
      setPresetInternal(next);
      onColorPresetChange?.(next);
      void writePersistedTheme(persistKey, storage, {
        mode: modeRef.current,
        colorPreset: next,
      });
    },
    [setPresetInternal, onColorPresetChange, persistKey, storage],
  );

  const resetTheme = useCallback(() => {
    if (controlledMode === undefined) {
      setModeInternal(defaultMode);
      onModeChange?.(defaultMode);
    }
    if (controlledPreset === undefined) {
      setPresetInternal(defaultPreset);
      onColorPresetChange?.(defaultPreset);
    }
    void removePersistedTheme(persistKey, storage);
  }, [
    controlledMode,
    controlledPreset,
    defaultMode,
    defaultPreset,
    setModeInternal,
    setPresetInternal,
    onModeChange,
    onColorPresetChange,
    persistKey,
    storage,
  ]);

  return { mode, colorPreset, setMode, setColorPreset, resetTheme, hydrated };
}

export function BloomThemeProvider({
  mode: controlledMode,
  colorPreset: controlledPreset,
  defaultMode = DEFAULT_MODE,
  defaultColorPreset = DEFAULT_PRESET,
  onModeChange,
  onColorPresetChange,
  persistKey,
  storage,
  awaitHydration,
  onHydrating,
  fonts = true,
  onFontsLoading,
  children,
}: BloomThemeProviderProps) {
  const rnScheme = useRNColorScheme();

  const { mode, colorPreset, setMode, setColorPreset, resetTheme, hydrated } = useThemeState({
    controlledMode,
    controlledPreset,
    defaultMode,
    defaultPreset: defaultColorPreset,
    persistKey,
    storage,
    onModeChange,
    onColorPresetChange,
  });

  const isAdaptive = mode === 'adaptive';
  const effectiveMode: Exclude<ThemeMode, 'adaptive'> = isAdaptive ? 'system' : mode;
  const resolved: 'light' | 'dark' =
    effectiveMode === 'system' ? (rnScheme === 'dark' ? 'dark' : 'light') : effectiveMode;

  // Apply native color scheme, dark class, and CSS vars whenever the resolved
  // mode or preset changes. `useIsomorphicLayoutEffect` runs before paint on
  // both native and web, eliminating the previous render-time side effect.
  useIsomorphicLayoutEffect(() => {
    setColorSchemeSafe(effectiveMode);
    applyDarkClass(resolved);
    applyColorPresetVars(colorPreset, resolved);
  }, [effectiveMode, resolved, colorPreset]);

  const contextValue = useMemo<BloomThemeContextValue>(
    () => ({
      theme: buildTheme(colorPreset, resolved, isAdaptive),
      mode,
      colorPreset,
      setMode,
      setColorPreset,
      resetTheme,
    }),
    [colorPreset, resolved, isAdaptive, mode, setMode, setColorPreset, resetTheme],
  );

  const shouldAwait = awaitHydration ?? Boolean(persistKey && storage);
  const isGated = shouldAwait && !hydrated;

  return (
    <BloomThemeContext.Provider value={contextValue}>
      <FontLoader enabled={fonts} fallback={onFontsLoading}>
        {isGated ? onHydrating ?? null : children}
      </FontLoader>
    </BloomThemeContext.Provider>
  );
}


