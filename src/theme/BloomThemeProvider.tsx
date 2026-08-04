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
import {
  Platform,
  View,
  useColorScheme as useRNColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useControllableState } from '../hooks/useControllableState';
import { FontLoader } from '../fonts/FontLoader';

import { useAmbientThemeState } from './ambient-store';

import { applyDarkClass, applyVarsToDocument } from './apply-dark-class';
import { buildTheme } from './build-theme';
import { buildThemeFromSeed } from './build-theme-from-seed';
import { buildSeedScopeVars } from './color-scope/seed-scope';
import { type AppColorName } from './color-presets';
import { buildScopeVars, getVariableContextProvider } from './color-scope/style-builder';
import { applyVarsToRootVariables } from './native-root-vars';
import {
  readPersistedTheme,
  readPersistedThemeSync,
  removePersistedTheme,
  writePersistedTheme,
  type BloomThemeStorage,
  type SyncReadResult,
} from './persistence';
import type { ExplicitAccents } from './preset-vars';
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

declare global {
  // eslint-disable-next-line no-var
  var __oxyhq_bloom_theme_context__:
    | React.Context<BloomThemeContextValue | null>
    | undefined;
}

/**
 * `BloomThemeContext` is a `globalThis`-guarded singleton so that every physical
 * copy of this module returns the SAME React context object.
 *
 * Why this is required: `package.json`'s `exports["./theme"]` ships a
 * `react-native` → `./src/...` condition alongside the `import` → `./lib/module/...`
 * and `require` → `./lib/commonjs/...` forks, so up to three physical copies of the
 * theme module can coexist in a single bundle. A bundler can resolve them through
 * DIFFERENT conditions across import paths — e.g. an app importing `@oxyhq/bloom/theme`
 * lands on the `src` copy while `@oxyhq/bloom/toast`'s `Toast.tsx` imports
 * `../theme/use-theme` relatively and lands on a different physical copy. With a plain
 * module-level `createContext(...)`, each copy creates its OWN context object: the
 * mounted `<BloomThemeProvider>` writes into context A while `useTheme`/`useBloomTheme`/
 * `Toast`/`Dialog` read context B, so `useContext` returns `null` and they throw
 * "must be used within a <BloomThemeProvider>" even when correctly wrapped. This is the
 * same src-vs-lib dual-instance class react-native-css guards its `StyleCollection`/
 * root-variable families against. Anchoring the context on `globalThis` (keyed by the
 * `__oxyhq_bloom_theme_context__` property) collapses all copies onto one object. The
 * `??=` runs `createContext` at most once per process.
 */
export const BloomThemeContext: React.Context<BloomThemeContextValue | null> =
  (globalThis.__oxyhq_bloom_theme_context__ ??=
    createContext<BloomThemeContextValue | null>(null));

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

  /**
   * Style applied to the native `<View>` wrapper that carries the preset's
   * CSS vars. Defaults to `{ flex: 1 }`. Ignored on web (the provider writes
   * vars to `document.documentElement` instead of using a wrapper).
   */
  nativeWrapperStyle?: StyleProp<ViewStyle>;

  /**
   * Optional app-wide secondary-accent colour, `#rrggbb`. When set, the whole
   * theme's secondary family (`--secondary`, `bg-secondary`, `colors.secondary`,
   * plus the container / on-colour roles) is PINNED to this brand colour instead
   * of the derived hue-rotation of the active preset's seed — for a brand with a
   * distinct accent (e.g. blue primary + yellow secondary). M3 role tones still
   * apply. Omit to keep the preset's derived accent.
   */
  secondaryColor?: string;
  /**
   * Optional app-wide tertiary-accent colour, `#rrggbb`. Same semantics as
   * {@link BloomThemeProviderProps.secondaryColor} for the tertiary family.
   */
  tertiaryColor?: string;

  /**
   * Optional DYNAMIC seed colour, `#rrggbb`. When set, the WHOLE app themes from
   * this seed instead of the named `colorPreset` (via the same colour engine the
   * preset path uses) — driving app-wide dynamic theming (e.g. tint everything to
   * the artwork the user is viewing/hovering). `secondaryColor`/`tertiaryColor`
   * act as this seed's pinned secondary/tertiary accents (e.g. the 2nd/3rd colours
   * extracted from that artwork). Omit / pass `undefined` to fall back to the
   * preset — so clearing it restores the app's default theme.
   */
  seed?: string;

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
  nativeWrapperStyle,
  secondaryColor,
  tertiaryColor,
  seed,
  children,
}: BloomThemeProviderProps) {
  const rnScheme = useRNColorScheme();

  // The app-wide ambient override, driven imperatively via `useAmbientTheme()`
  // from anywhere in the app. Subscribed through the module-level store's
  // `useSyncExternalStore` (stable snapshot ref while unchanged → React-Compiler
  // safe). When an ambient seed is set it OVERRIDES the static `seed` prop and
  // the active preset; clearing it restores them.
  const ambient = useAmbientThemeState();

  // The EFFECTIVE dynamic seed + accents for this render: ambient wins over the
  // static props. `null` ambient seed means "no override" → fall back to the
  // `seed` prop (which itself may be undefined → preset path). When ambient is
  // active, ambient accents replace the static accent props entirely (a null
  // ambient accent = "no pin for this artwork colour").
  const ambientActive = ambient.seed !== null;
  const effectiveSeed: string | undefined = ambientActive
    ? ambient.seed ?? undefined
    : seed;
  const effectiveSecondary: string | undefined = ambientActive
    ? ambient.secondary ?? undefined
    : secondaryColor;
  const effectiveTertiary: string | undefined = ambientActive
    ? ambient.tertiary ?? undefined
    : tertiaryColor;

  // The app-wide pinned accents, if any. Memoized so its identity only changes
  // when an accent changes (keeps the effect/memo deps below stable). Left
  // `undefined` when neither is set so every downstream call is byte-identical
  // to the no-accent path. Uses the EFFECTIVE accents so ambient accents apply
  // to the preset path too when no ambient seed is present.
  const explicitAccents = useMemo<ExplicitAccents | undefined>(
    () =>
      effectiveSecondary === undefined && effectiveTertiary === undefined
        ? undefined
        : { secondaryHex: effectiveSecondary, tertiaryHex: effectiveTertiary },
    [effectiveSecondary, effectiveTertiary],
  );

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
  // The single `--x -> value` record + JS theme for the ACTIVE source, computed
  // ONCE and applied identically to web (document), native (rootVariables +
  // VariableContext), and the JS `theme` context. The source is a DYNAMIC seed
  // (whole-app dynamic theming — `secondaryColor`/`tertiaryColor` pin this seed's
  // accents) when `seed` is set, else the named preset. Both go through the same
  // colour engine, so there is one code path — no seed/preset duplication.
  const themeVars = useMemo(
    () =>
      effectiveSeed
        ? buildSeedScopeVars({
            seed: effectiveSeed,
            mode: resolved,
            secondarySeed: effectiveSecondary,
            tertiarySeed: effectiveTertiary,
          })
        : buildScopeVars(colorPreset, resolved, explicitAccents),
    [effectiveSeed, effectiveSecondary, effectiveTertiary, colorPreset, resolved, explicitAccents],
  );
  const themeColors = useMemo(
    () =>
      effectiveSeed
        ? buildThemeFromSeed(
            effectiveSeed,
            resolved,
            undefined,
            undefined,
            { secondarySeed: effectiveSecondary, tertiarySeed: effectiveTertiary }
          )
        : buildTheme(colorPreset, resolved, isAdaptive, explicitAccents),
    [
      effectiveSeed,
      effectiveSecondary,
      effectiveTertiary,
      colorPreset,
      resolved,
      isAdaptive,
      explicitAccents,
    ],
  );

  useIsomorphicLayoutEffect(() => {
    setColorSchemeSafe(effectiveMode);
    applyDarkClass(resolved);
    applyVarsToDocument(themeVars);
  }, [effectiveMode, resolved, themeVars]);

  // Native only: publish the same vars into react-native-css's GLOBAL root
  // variable family so they reach the ENTIRE app tree — navigator screens and
  // every portal/modal/bottom-sheet that paints outside the provider's React
  // subtree (and therefore never sees the `VariableContextProvider` vars below).
  // Web writes the same vars to `document.documentElement` above, so this no-ops
  // there. Runs before paint via `useIsomorphicLayoutEffect`.
  useIsomorphicLayoutEffect(() => {
    applyVarsToRootVariables(themeVars);
  }, [themeVars]);

  const contextValue = useMemo<BloomThemeContextValue>(
    () => ({
      theme: themeColors,
      mode,
      colorPreset,
      setMode,
      setColorPreset,
      resetTheme,
    }),
    [themeColors, mode, colorPreset, setMode, setColorPreset, resetTheme],
  );

  const shouldAwait = awaitHydration ?? Boolean(persistKey && storage);
  const isGated = shouldAwait && !hydrated;

  // On native, the same record is handed to `VariableContextProvider` so
  // descendants resolve `var(--primary)` etc. through react-native-css's real
  // VariableContext. Web writes them to `document.documentElement` above.
  const nativeVars = useMemo(
    () => (Platform.OS === 'web' ? null : themeVars),
    [themeVars],
  );
  const VariableProvider = getVariableContextProvider();

  const content = (
    <FontLoader enabled={fonts} fallback={onFontsLoading}>
      {isGated ? onHydrating ?? null : children}
    </FontLoader>
  );

  if (Platform.OS === 'web') {
    return <BloomThemeContext.Provider value={contextValue}>{content}</BloomThemeContext.Provider>;
  }

  // The flex wrapper is still needed for layout; the preset vars now flow
  // through `VariableContextProvider` rather than an (inert) inline-vars style.
  // If NativeWind isn't installed the wrapper still renders so we never crash.
  const nativeTree = <View style={[{ flex: 1 }, nativeWrapperStyle]}>{content}</View>;

  return (
    <BloomThemeContext.Provider value={contextValue}>
      {VariableProvider && nativeVars ? (
        <VariableProvider value={nativeVars}>{nativeTree}</VariableProvider>
      ) : (
        nativeTree
      )}
    </BloomThemeContext.Provider>
  );
}


