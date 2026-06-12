import { Platform } from 'react-native';
import { APP_COLOR_NAMES, type AppColorName } from './color-presets';
import type { ThemeMode } from './types';

const VALID_PRESETS = new Set<string>(APP_COLOR_NAMES);
const VALID_MODES = new Set<string>(['light', 'dark', 'system', 'adaptive']);

/**
 * Storage adapter for persisting Bloom theme state.
 *
 * Methods may be synchronous or asynchronous. The provider awaits both, so
 * `AsyncStorage`-compatible adapters on native and `localStorage`-backed
 * adapters on web both work without consumer-side branching.
 *
 * On web, a synchronous adapter lets Bloom hydrate before the first paint —
 * preventing a flash of the default palette. On native, the provider can
 * gate `children` rendering until hydration completes (see
 * `awaitHydration` on `BloomThemeProvider`).
 */
export interface BloomThemeStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

export interface PersistedThemeState {
  mode?: ThemeMode;
  colorPreset?: AppColorName;
}

const isValidMode = (value: unknown): value is ThemeMode =>
  typeof value === 'string' && VALID_MODES.has(value);

const isValidPreset = (value: unknown): value is AppColorName =>
  typeof value === 'string' && VALID_PRESETS.has(value);

function parsePersistedTheme(raw: unknown): PersistedThemeState | null {
  if (typeof raw !== 'string') return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as { mode?: unknown; colorPreset?: unknown };

  const mode = isValidMode(obj.mode) ? obj.mode : undefined;
  const colorPreset = isValidPreset(obj.colorPreset) ? obj.colorPreset : undefined;

  if (!mode && !colorPreset) return null;
  return { mode, colorPreset };
}

export type SyncReadResult =
  | { kind: 'sync'; state: PersistedThemeState | null }
  | { kind: 'async' }
  | { kind: 'none' };

const isThenable = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as { then?: unknown }).then === 'function';

/**
 * Read persisted state during the first render. Returns a discriminated union
 * so the provider can tell apart:
 *   - `none`: persistence not configured.
 *   - `sync`: adapter returned a value synchronously (web `localStorage`).
 *     Provider can render immediately with the resolved state.
 *   - `async`: adapter returned a Promise (native `AsyncStorage`). Provider
 *     must await `readPersistedTheme` before painting if gating is enabled.
 */
export function readPersistedThemeSync(
  persistKey: string | undefined,
  storage: BloomThemeStorage | undefined,
): SyncReadResult {
  if (!persistKey || !storage) return { kind: 'none' };

  let raw: string | null | Promise<string | null>;
  try {
    raw = storage.getItem(persistKey);
  } catch {
    return { kind: 'sync', state: null };
  }

  if (isThenable(raw)) return { kind: 'async' };
  return { kind: 'sync', state: parsePersistedTheme(raw) };
}

export async function readPersistedTheme(
  persistKey: string | undefined,
  storage: BloomThemeStorage | undefined,
): Promise<PersistedThemeState | null> {
  if (!persistKey || !storage) return null;

  try {
    const raw = await storage.getItem(persistKey);
    return parsePersistedTheme(raw);
  } catch {
    return null;
  }
}

export async function writePersistedTheme(
  persistKey: string | undefined,
  storage: BloomThemeStorage | undefined,
  state: PersistedThemeState,
): Promise<void> {
  if (!persistKey || !storage) return;

  const payload: PersistedThemeState = {};
  if (state.mode !== undefined) payload.mode = state.mode;
  if (state.colorPreset !== undefined) payload.colorPreset = state.colorPreset;

  try {
    await storage.setItem(persistKey, JSON.stringify(payload));
  } catch {
    // Persistence is best-effort: ignore quota and privacy-mode errors.
  }
}

/**
 * `localStorage`-backed storage adapter. Only defined on web; on native the
 * export is `undefined` so consumers pass an `AsyncStorage` adapter explicitly.
 */
export const webLocalStorage: BloomThemeStorage | undefined = (() => {
  if (Platform.OS !== 'web') return undefined;
  if (typeof globalThis === 'undefined') return undefined;
  if (!('localStorage' in globalThis)) return undefined;

  const ls = (globalThis as { localStorage: Storage }).localStorage;

  return {
    getItem: (key) => {
      try {
        return ls.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        ls.setItem(key, value);
      } catch {
        // Swallow quota / privacy-mode errors.
      }
    },
  };
})();
