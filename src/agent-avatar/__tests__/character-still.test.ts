import { resolveAvatarCharacter } from '../character';
import {
  createCharacterStills,
  stillBucket,
  stillKey,
  type StillBackend,
  type StillJob,
} from '../character-still';
import type { BloomThemeStorage } from '../../theme/persistence';

const URI = (n: string) => `data:image/png;base64,${n}`;
const blue = resolveAvatarCharacter({ preset: 'blue_beret' });
const alfred = resolveAvatarCharacter({ preset: 'alfred' });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function deferredBackend() {
  const jobs: { job: StillJob; resolve(uri: string | null): void }[] = [];
  let active = 0;
  let peak = 0;
  const backend: StillBackend = (job) =>
    new Promise((resolve) => {
      active++;
      peak = Math.max(peak, active);
      jobs.push({
        job,
        resolve: (uri) => {
          active--;
          resolve(uri);
        },
      });
    });
  return { backend, jobs, peak: () => peak };
}

describe('stillKey', () => {
  it('addresses the RESOLVED character: a preset and the same preset written out are one picture', () => {
    const base = blue;
    const written = resolveAvatarCharacter({
      preset: 'blue_beret',
      shape: base.shape,
      eyes: base.eyes,
      eyewear: base.eyewear,
      accessory: base.accessory,
    });
    expect(stillKey(written, 64, 2)).toBe(stillKey(blue, 64, 2));
  });
  it('is independent of the order the caller wrote the fields in', () => {
    const one = resolveAvatarCharacter({ preset: 'alfred', color: 'coral', accessory: 'bow' });
    const two = resolveAvatarCharacter({ accessory: 'bow', color: 'coral', preset: 'alfred' });
    expect(stillKey(one, 64, 1)).toBe(stillKey(two, 64, 1));
  });
  it.each([
    ['another character', alfred, 64, 1],
    ['another size bucket', blue, 128, 1],
    ['another density', blue, 64, 2],
  ])('differs for %s', (_name, character, css, ratio) => {
    expect(stillKey(character, css, ratio)).not.toBe(stillKey(blue, 64, 1));
  });
  it('separates the two paint spellings and an exact colour from a named one', () => {
    const named = resolveAvatarCharacter({ preset: 'blue_beret', color: 'coral' });
    const exact = resolveAvatarCharacter({ preset: 'blue_beret', bodyColor: '#ff7f50' });
    expect(stillKey(named, 64, 1)).not.toBe(stillKey(exact, 64, 1));
  });
});

describe('stillBucket', () => {
  it.each([
    [20, 64],
    [64, 64],
    [65, 128],
    [128, 128],
    [200, 256],
    [900, 256],
  ])('%d renders in the %d bucket', (size, bucket) => {
    expect(stillBucket(size)).toBe(bucket);
  });
});

describe('the still cache', () => {
  it('renders each distinct character once however many rows ask, one render at a time', async () => {
    const { backend, jobs, peak } = deferredBackend();
    const stills = createCharacterStills({ runtimeUrl: 'u', backend });
    const keyA = stillKey(blue, 64, 1);
    const keyB = stillKey(alfred, 64, 1);
    const asked = Array.from({ length: 50 }, (_, i) =>
      i % 2 ? stills.request(keyA, blue, 64, 1) : stills.request(keyB, alfred, 64, 1),
    );
    await flush();
    expect(jobs).toHaveLength(1);
    jobs[0]!.resolve(URI('a'));
    await flush();
    expect(jobs).toHaveLength(2);
    jobs[1]!.resolve(URI('b'));
    const results = await Promise.all(asked.map((request) => request.promise));
    expect(new Set(results).size).toBe(2);
    expect(peak()).toBe(1);
    expect(stills.peek(keyA)).toBeDefined();
    // A later ask is answered from memory, synchronously, with no render.
    expect(await stills.request(keyA, blue, 64, 1).promise).toBe(stills.peek(keyA));
    expect(jobs).toHaveLength(2);
  });

  it('drops a queued render when every row that wanted it is gone, never one already running', async () => {
    const { backend, jobs } = deferredBackend();
    const stills = createCharacterStills({ runtimeUrl: 'u', backend });
    const running = stills.request(stillKey(blue, 64, 1), blue, 64, 1);
    const queued = stills.request(stillKey(alfred, 64, 1), alfred, 64, 1);
    await flush();
    running.cancel();
    queued.cancel();
    expect(await queued.promise).toBeNull();
    jobs[0]!.resolve(URI('a'));
    await running.promise;
    await flush();
    expect(jobs).toHaveLength(1);
    expect(stills.peek(stillKey(blue, 64, 1))).toBe(URI('a'));
    expect(stills.peek(stillKey(alfred, 64, 1))).toBeUndefined();
  });

  it('resolves null, and caches nothing, when there is no way to draw or the draw fails', async () => {
    const key = stillKey(blue, 64, 1);
    const none = createCharacterStills({ runtimeUrl: 'u', backend: null });
    expect(await none.request(key, blue, 64, 1).promise).toBeNull();
    const failing = createCharacterStills({
      runtimeUrl: 'u',
      backend: () => Promise.reject(new Error('gl lost')),
    });
    expect(await failing.request(key, blue, 64, 1).promise).toBeNull();
    expect(failing.peek(key)).toBeUndefined();
  });

  describe('persistence', () => {
    const memoryStorage = () => {
      const data = new Map<string, string>();
      const storage: BloomThemeStorage = {
        getItem: async (key) => data.get(key) ?? null,
        setItem: async (key, value) => void data.set(key, value),
        removeItem: async (key) => void data.delete(key),
      };
      return { data, storage };
    };

    it('writes a drawn still and serves it to the next launch without rendering', async () => {
      const { data, storage } = memoryStorage();
      const key = stillKey(blue, 64, 1);
      const first = createCharacterStills({
        runtimeUrl: 'u',
        storage,
        backend: async () => URI('drawn'),
      });
      await first.request(key, blue, 64, 1).promise;
      await flush();
      expect([...data.keys()].some((stored) => stored.endsWith(key))).toBe(true);

      const backend = jest.fn<Promise<string | null>, [StillJob]>();
      const second = createCharacterStills({ runtimeUrl: 'u', storage, backend });
      expect(await second.request(key, blue, 64, 1).promise).toBe(URI('drawn'));
      expect(backend).not.toHaveBeenCalled();
    });

    it('ignores a stored value that is not a PNG data URI', async () => {
      const { data, storage } = memoryStorage();
      const key = stillKey(blue, 64, 1);
      const seed = createCharacterStills({
        runtimeUrl: 'u',
        storage,
        backend: async () => URI('old'),
      });
      await seed.request(key, blue, 64, 1).promise;
      await flush();
      const storedKey = [...data.keys()].find((stored) => stored.endsWith(key))!;
      data.set(storedKey, 'https://evil.test/x.png');
      const backend = jest.fn(async () => URI('fresh'));
      const stills = createCharacterStills({ runtimeUrl: 'u', storage, backend });
      expect(await stills.request(key, blue, 64, 1).promise).toBe(URI('fresh'));
    });

    it('survives a storage that throws', async () => {
      const storage: BloomThemeStorage = {
        getItem: () => Promise.reject(new Error('denied')),
        setItem: () => Promise.reject(new Error('full')),
      };
      const stills = createCharacterStills({
        runtimeUrl: 'u',
        storage,
        backend: async () => URI('ok'),
      });
      expect(await stills.request(stillKey(blue, 64, 1), blue, 64, 1).promise).toBe(URI('ok'));
    });

    it('keeps at most 96 stored stills, evicting the oldest', async () => {
      const { data, storage } = memoryStorage();
      const stills = createCharacterStills({
        runtimeUrl: 'u',
        storage,
        backend: async (job) => URI(job.key),
      });
      for (let i = 0; i < 100; i++) {
        const character = resolveAvatarCharacter({
          preset: 'blue_beret',
          eyeSpacing: 0.5 + i / 100,
        });
        await stills.request(stillKey(character, 64, 1), character, 64, 1).promise;
        await flush();
      }
      const stored = [...data.keys()].filter((key) => !key.endsWith('index'));
      expect(stored).toHaveLength(96);
    });
  });
});

it('disposes queued requests and ignores a late backend result', async () => {
  const { backend, jobs } = deferredBackend();
  const stills = createCharacterStills({ runtimeUrl: 'u', backend });
  const key = stillKey(blue, 64, 1);
  const first = stills.request(key, blue, 64, 1);
  const second = stills.request(stillKey(alfred, 64, 1), alfred, 64, 1);
  await flush();
  stills.dispose();
  expect(await Promise.all([first.promise, second.promise])).toEqual([null, null]);
  jobs[0]!.resolve(URI('late'));
  await flush();
  expect(stills.peek(key)).toBeUndefined();
  expect(jobs).toHaveLength(1);
  expect(await stills.request(key, blue, 64, 1).promise).toBeNull();
});

it('does not start rendering after disposal during a storage read', async () => {
  let read!: (value: null) => void;
  const backend = jest.fn(async () => URI('unexpected'));
  const stills = createCharacterStills({
    runtimeUrl: 'u',
    backend,
    storage: {
      getItem: () =>
        new Promise((resolve) => {
          read = resolve;
        }),
      setItem() {},
    },
  });
  const request = stills.request(stillKey(blue, 64, 1), blue, 64, 1);
  stills.dispose();
  read(null);
  expect(await request.promise).toBeNull();
  await flush();
  expect(backend).not.toHaveBeenCalled();
});

it('isolates persisted portraits by runtime URL and eye-only identity', async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const key = stillKey(blue, 64, 1);
  const first = createCharacterStills({
    runtimeUrl: 'first',
    storage,
    backend: async () => URI('first'),
  });
  expect(await first.request(key, blue, 64, 1).promise).toBe(URI('first'));
  await flush();
  const second = createCharacterStills({
    runtimeUrl: 'second',
    storage,
    backend: async () => URI('second'),
  });
  expect(await second.request(key, blue, 64, 1).promise).toBe(URI('second'));
  expect(stillKey(blue, 64, 1, 'eyes')).not.toBe(key);
});
