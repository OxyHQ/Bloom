import type { ReactNode } from 'react';

import type { BloomThemeStorage } from '../theme/persistence';

/** When a visible video (or GIF) may start on its own. */
export type VideoAutoplayPolicy = 'always' | 'wifi' | 'never';

/**
 * The viewer's own preferences that Bloom's components read. One record, kept
 * in the storage the theme uses, so every app gets the same settings and every
 * component honours them without the app wiring anything.
 */
export interface BloomPreferences {
  /** Haptic feedback on interactions (`useHaptics`). */
  haptics: boolean;
  /** When media starts by itself (`VideoPlaybackProvider`, `GifMessage`). */
  videoAutoplay: VideoAutoplayPolicy;
}

export interface BloomPreferencesProviderProps {
  /**
   * Where the preferences persist: the same adapter and key namespace as the
   * theme (`BloomProvider`'s `storage` / `persistKey`). Without both they live
   * for the session only, as the theme does.
   */
  storage?: BloomThemeStorage;
  persistKey?: string;
  children?: ReactNode;
}

export interface BloomPreferencesContextValue {
  preferences: BloomPreferences;
  setPreference: <K extends keyof BloomPreferences>(key: K, value: BloomPreferences[K]) => void;
}
