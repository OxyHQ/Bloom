import type { BloomThemeStorage } from '../theme/persistence';
import type { BloomPreferences, VideoAutoplayPolicy } from './types';

export const DEFAULT_PREFERENCES: BloomPreferences = { haptics: true, videoAutoplay: 'always' };

const POLICIES: ReadonlySet<string> = new Set<VideoAutoplayPolicy>(['always', 'wifi', 'never']);

/** The key under the theme's namespace, so one app's preferences never meet another's. */
export function preferencesKey(persistKey: string | undefined): string | undefined {
  return persistKey ? `${persistKey}:preferences` : undefined;
}

/** Whatever was stored, reduced to valid fields over the defaults. */
export function parsePreferences(raw: string | null | undefined): BloomPreferences {
  if (!raw) return DEFAULT_PREFERENCES;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFERENCES;
  const { haptics, videoAutoplay } = parsed as Partial<Record<keyof BloomPreferences, unknown>>;
  return {
    haptics: typeof haptics === 'boolean' ? haptics : DEFAULT_PREFERENCES.haptics,
    videoAutoplay:
      typeof videoAutoplay === 'string' && POLICIES.has(videoAutoplay)
        ? (videoAutoplay as VideoAutoplayPolicy)
        : DEFAULT_PREFERENCES.videoAutoplay,
  };
}

export async function readPreferences(
  key: string | undefined,
  storage: BloomThemeStorage | undefined,
): Promise<BloomPreferences | null> {
  if (!key || !storage) return null;
  try {
    return parsePreferences(await storage.getItem(key));
  } catch {
    return null;
  }
}

export async function writePreferences(
  key: string | undefined,
  storage: BloomThemeStorage | undefined,
  preferences: BloomPreferences,
): Promise<void> {
  if (!key || !storage) return;
  try {
    await storage.setItem(key, JSON.stringify(preferences));
  } catch {
    // Persistence is best-effort, as the theme's is: quota and privacy-mode errors are ignored.
  }
}
