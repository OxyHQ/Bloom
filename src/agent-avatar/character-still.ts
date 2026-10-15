import type { BloomThemeStorage } from '../theme/persistence';
import type { ResolvedAvatarCharacter } from './character';

/**
 * A still of a character: one PNG, drawn once by the shared runtime and kept by CONTENT.
 *
 * A feed row must never own a WebGL canvas. So a row asks this cache for the picture of its
 * character, draws an ordinary image when it arrives, and the cache renders each distinct
 * character at most once per size bucket, one at a time, however many rows ask.
 */

/** Bump when the runtime's look changes: stills drawn by the old one would otherwise outlive it. */
const STILL_VERSION = 1;
/** CSS-pixel render sizes. A row takes the smallest that covers it, so 50 rows share 1-3 images. */
export const STILL_BUCKETS = [64, 128, 256] as const;
const MEMORY_LIMIT = 256;
const STORED_LIMIT = 96;
const KEY_PREFIX = 'bloom:avatar-still:';
const INDEX_KEY = `${KEY_PREFIX}index`;

/** What the backend draws. `css` is the square's edge in CSS pixels; `ratio` the density it is drawn at. */
export type StillJob = Readonly<{
  key: string;
  runtimeUrl: string;
  character: ResolvedAvatarCharacter;
  css: number;
  ratio: number;
}>;
/** Resolves a `data:image/png` URI, or `null` when the picture could not be made. */
export type StillBackend = (job: StillJob) => Promise<string | null>;

export type StillRequest = Readonly<{ promise: Promise<string | null>; cancel(): void }>;
export type CharacterStills = {
  /** The still if it is already in memory; synchronous, so a cached row never flashes a placeholder. */
  peek(key: string): string | undefined;
  /** `key` is `stillKey(character, css, ratio)`, computed once by the caller. */
  request(
    key: string,
    character: ResolvedAvatarCharacter,
    css: number,
    ratio: number,
  ): StillRequest;
};

/** The bucket (CSS px) that covers a rendered size. */
export function stillBucket(size: number): number {
  return STILL_BUCKETS.find((bucket) => bucket >= size) ?? STILL_BUCKETS[STILL_BUCKETS.length - 1]!;
}

/** cyrb53: a 53-bit string hash, plenty for a cache of hundreds. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * The address of a still: the RESOLVED character (so `{ preset }` and the same preset written out
 * in full are one picture), the render size and the density. Fixed field order, never the order
 * the caller happened to write the keys in.
 */
export function stillKey(character: ResolvedAvatarCharacter, css: number, ratio: number): string {
  const { preset, shape, eyes, eyewear, accessory, paint, eyeSpacing, authored } = character;
  return hash(
    JSON.stringify([
      STILL_VERSION,
      preset ?? null,
      shape,
      eyes,
      eyewear,
      accessory,
      'bodyColor' in paint ? ['b', paint.bodyColor] : ['c', paint.color],
      eyeSpacing ?? null,
      authored,
      css,
      ratio,
    ]),
  );
}

type Pending = {
  job: StillJob;
  waiters: number;
  started: boolean;
  promise: Promise<string | null>;
  settle(uri: string | null): void;
};

/**
 * `backend` is null where nothing can draw (native without a mounted provider): every request then
 * resolves `null` and the row keeps its placeholder.
 */
export function createCharacterStills({
  runtimeUrl,
  storage,
  backend,
}: {
  runtimeUrl: string;
  storage?: BloomThemeStorage;
  backend: StillBackend | null;
}): CharacterStills {
  const memory = new Map<string, string>();
  const pending = new Map<string, Pending>();
  const queue: Pending[] = [];
  let running = false;

  const remember = (key: string, uri: string) => {
    memory.delete(key);
    memory.set(key, uri);
    if (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value!);
  };

  const readStored = async (key: string): Promise<string | null> => {
    try {
      const stored = await storage?.getItem(KEY_PREFIX + key);
      return typeof stored === 'string' && stored.startsWith('data:image/png;base64,')
        ? stored
        : null;
    } catch {
      return null;
    }
  };

  const writeStored = async (key: string, uri: string) => {
    if (!storage) return;
    try {
      const raw = await storage.getItem(INDEX_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const index = Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === 'string' && entry !== key)
        : [];
      index.push(key);
      for (const evicted of index.splice(0, Math.max(0, index.length - STORED_LIMIT)))
        await storage.removeItem?.(KEY_PREFIX + evicted);
      await storage.setItem(KEY_PREFIX + key, uri);
      await storage.setItem(INDEX_KEY, JSON.stringify(index));
    } catch {
      /* A full or unavailable store only costs a re-render next launch. */
    }
  };

  const produce = async (entry: Pending) => {
    const { job } = entry;
    const stored = await readStored(job.key);
    if (stored) return stored;
    if (!backend) return null;
    const uri = await backend(job).catch(() => null);
    if (uri) void writeStored(job.key, uri);
    return uri;
  };

  // One at a time: a long list queues renders, it never runs them side by side.
  const drain = async () => {
    if (running) return;
    running = true;
    try {
      for (let entry = queue.shift(); entry; entry = queue.shift()) {
        entry.started = true;
        const uri = await produce(entry);
        if (uri) remember(entry.job.key, uri);
        pending.delete(entry.job.key);
        entry.settle(uri);
      }
    } finally {
      running = false;
    }
  };

  return {
    peek(key) {
      const uri = memory.get(key);
      if (uri) remember(key, uri);
      return uri;
    },
    request(key, character, css, ratio) {
      const cached = memory.get(key);
      if (cached) return { promise: Promise.resolve(cached), cancel() {} };
      let entry = pending.get(key);
      if (!entry) {
        let settle!: (uri: string | null) => void;
        const promise = new Promise<string | null>((resolve) => (settle = resolve));
        entry = {
          job: { key, runtimeUrl, character, css, ratio },
          waiters: 0,
          started: false,
          promise,
          settle,
        };
        pending.set(key, entry);
        queue.push(entry);
        void drain();
      }
      entry.waiters++;
      const joined = entry;
      let cancelled = false;
      return {
        promise: joined.promise,
        cancel() {
          if (cancelled) return;
          cancelled = true;
          // A row scrolled away before its turn takes its render with it.
          if (--joined.waiters > 0 || joined.started) return;
          queue.splice(queue.indexOf(joined), 1);
          pending.delete(joined.job.key);
        },
      };
    },
  };
}

const defaults = new Map<string, CharacterStills>();
/**
 * The cache for an avatar outside any `AgentAvatarProvider`. It can draw on web; on native the
 * drawing surface is the provider's, so it only answers from nothing.
 */
export function defaultCharacterStills(
  runtimeUrl: string,
  backend: StillBackend | null,
): CharacterStills {
  let stills = defaults.get(runtimeUrl);
  if (!stills) {
    stills = createCharacterStills({ runtimeUrl, backend });
    defaults.set(runtimeUrl, stills);
  }
  return stills;
}
