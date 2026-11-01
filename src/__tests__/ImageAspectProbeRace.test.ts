import {
  DEFAULT_ASPECT_RATIO,
  getAspectRatio,
  getIntrinsicSize,
  setAspectRatio,
} from '../image-aspect-ratio-cache';
import { fetchAspectRatioForOwner } from '../image-aspect-ratio-cache/aspect-ratio-cache';

const mockPending = new Map<
  string,
  Array<{
    resolve: (size: { width: number; height: number }) => void;
    reject: (error: Error) => void;
  }>
>();
let mockThrowUri: string | undefined;

jest.mock('../image', () => ({
  getImageSize: (uri: string) => {
    if (uri === mockThrowUri) throw new Error('synchronous probe failure');
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const pending = mockPending.get(uri) ?? [];
      pending.push({ resolve, reject });
      mockPending.set(uri, pending);
    });
  },
}));

it('does not cache an older same-URI measurement after a newer probe finishes', async () => {
  const uri = 'https://example.test/same-image-probe-race';
  let olderOpeningIsCurrent = true;
  const older = fetchAspectRatioForOwner(uri, () => olderOpeningIsCurrent);
  olderOpeningIsCurrent = false;
  const newer = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[1]?.resolve({ width: 300, height: 300 });
  await newer;
  pending[0]?.resolve({ width: 400, height: 100 });
  await older;
  expect(getAspectRatio(uri)).toBe(1);
  expect(getIntrinsicSize(uri)).toEqual({ width: 300, height: 300 });
});

it('does not cache an old failure over a newer successful opening', async () => {
  const uri = 'https://example.test/stale-failing-image-probe';
  let olderOpeningIsCurrent = true;
  const older = fetchAspectRatioForOwner(uri, () => olderOpeningIsCurrent);
  olderOpeningIsCurrent = false;
  const newer = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[1]?.resolve({ width: 300, height: 300 });
  await newer;
  pending[0]?.reject(new Error('stale probe failed'));
  await older;
  expect(getAspectRatio(uri)).toBe(1);
  expect(getIntrinsicSize(uri)).toEqual({ width: 300, height: 300 });
});

it('does not overwrite an already-settled measurement from another live viewer', async () => {
  const uri = 'https://example.test/two-live-viewers';
  const earlier = fetchAspectRatioForOwner(uri, () => true);
  const later = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[1]?.resolve({ width: 300, height: 300 });
  await later;
  pending[0]?.resolve({ width: 400, height: 100 });
  await earlier;
  expect(getAspectRatio(uri)).toBe(1);
  expect(getIntrinsicSize(uri)).toEqual({ width: 300, height: 300 });
});

it('does not overwrite an explicit ratio set while a probe is pending', async () => {
  const uri = 'https://example.test/explicit-ratio-during-probe';
  const probe = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 1) throw new Error('Expected an image probe');
  setAspectRatio(uri, 1.5);
  pending[0]?.resolve({ width: 400, height: 100 });
  await probe;
  expect(getAspectRatio(uri)).toBe(1.5);
  expect(getIntrinsicSize(uri)).toBeUndefined();
});

it('allows an earlier success until a newer successful probe replaces it', async () => {
  const uri = 'https://example.test/older-success-first';
  const older = fetchAspectRatioForOwner(uri, () => true);
  const newer = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[0]?.resolve({ width: 400, height: 100 });
  expect(await older).toBe(4);
  expect(getAspectRatio(uri)).toBe(4);
  pending[1]?.resolve({ width: 300, height: 300 });
  expect(await newer).toBe(1);
  expect(getAspectRatio(uri)).toBe(1);
  expect(getIntrinsicSize(uri)).toEqual({ width: 300, height: 300 });
});

it('allows an earlier fallback until a newer successful probe replaces it', async () => {
  const uri = 'https://example.test/older-failure-first';
  const older = fetchAspectRatioForOwner(uri, () => true);
  const newer = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[0]?.reject(new Error('old request failed'));
  expect(await older).toBe(DEFAULT_ASPECT_RATIO);
  expect(getAspectRatio(uri)).toBe(DEFAULT_ASPECT_RATIO);
  pending[1]?.resolve({ width: 300, height: 300 });
  expect(await newer).toBe(1);
  expect(getAspectRatio(uri)).toBe(1);
});

it.each(['before', 'after'] as const)(
  'keeps a valid older measurement when the newer owner closes %s it completes',
  async (when) => {
    const uri = `https://example.test/newer-owner-closes-${when}`;
    let newerIsCurrent = true;
    const older = fetchAspectRatioForOwner(uri, () => true);
    const newer = fetchAspectRatioForOwner(uri, () => newerIsCurrent);
    const pending = mockPending.get(uri);
    if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
    if (when === 'after') {
      pending[0]?.resolve({ width: 400, height: 100 });
      expect(await older).toBe(4);
      expect(getAspectRatio(uri)).toBe(4);
    }
    newerIsCurrent = false;
    pending[1]?.resolve({ width: 300, height: 300 });
    expect(await newer).toBe(1);
    if (when === 'before') {
      expect(getAspectRatio(uri)).toBeUndefined();
      pending[0]?.resolve({ width: 400, height: 100 });
      expect(await older).toBe(4);
    }
    expect(getAspectRatio(uri)).toBe(4);
    expect(getIntrinsicSize(uri)).toEqual({ width: 400, height: 100 });
  },
);

it('keeps the newer failure rather than a later old success', async () => {
  const uri = 'https://example.test/newer-failure-first';
  const older = fetchAspectRatioForOwner(uri, () => true);
  const newer = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[1]?.reject(new Error('new request failed'));
  expect(await newer).toBe(DEFAULT_ASPECT_RATIO);
  pending[0]?.resolve({ width: 400, height: 100 });
  expect(await older).toBe(4);
  expect(getAspectRatio(uri)).toBe(DEFAULT_ASPECT_RATIO);
  expect(getIntrinsicSize(uri)).toBeUndefined();
});

it('keeps the existing success-then-failure cache semantics', async () => {
  const uri = 'https://example.test/older-success-newer-failure';
  const older = fetchAspectRatioForOwner(uri, () => true);
  const newer = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
  pending[0]?.resolve({ width: 300, height: 300 });
  expect(await older).toBe(1);
  expect(getAspectRatio(uri)).toBe(1);
  pending[1]?.reject(new Error('new request failed'));
  expect(await newer).toBe(DEFAULT_ASPECT_RATIO);
  expect(getAspectRatio(uri)).toBe(DEFAULT_ASPECT_RATIO);
  expect(getIntrinsicSize(uri)).toEqual({ width: 300, height: 300 });
});

it('does not overwrite an explicitly set default ratio', async () => {
  const uri = 'https://example.test/explicit-default-during-probe';
  const probe = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 1) throw new Error('Expected an image probe');
  setAspectRatio(uri, DEFAULT_ASPECT_RATIO);
  pending[0]?.resolve({ width: 400, height: 100 });
  await probe;
  expect(getAspectRatio(uri)).toBe(DEFAULT_ASPECT_RATIO);
  expect(getIntrinsicSize(uri)).toBeUndefined();
});

it('does not invalidate a probe for an invalid explicit ratio', async () => {
  const uri = 'https://example.test/invalid-explicit-ratio';
  const probe = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 1) throw new Error('Expected an image probe');
  setAspectRatio(uri, Number.NaN);
  setAspectRatio(uri, 0);
  pending[0]?.resolve({ width: 300, height: 300 });
  expect(await probe).toBe(1);
  expect(getAspectRatio(uri)).toBe(1);
});

it('forgets the in-flight entry only after all probes settle', async () => {
  const uri = 'https://example.test/probe-cleanup';
  const deleteSpy = jest.spyOn(Map.prototype, 'delete');
  try {
    const first = fetchAspectRatioForOwner(uri, () => true);
    const second = fetchAspectRatioForOwner(uri, () => true);
    const pending = mockPending.get(uri);
    if (pending?.length !== 2) throw new Error('Expected two concurrent probes');
    pending[1]?.resolve({ width: 300, height: 300 });
    await second;
    expect(deleteSpy).not.toHaveBeenCalledWith(uri);
    pending[0]?.resolve({ width: 400, height: 100 });
    await first;
    expect(deleteSpy).toHaveBeenCalledWith(uri);
  } finally {
    deleteSpy.mockRestore();
  }
});

it('cleans up an entry when starting a probe throws synchronously', () => {
  const uri = 'https://example.test/synchronous-probe-failure';
  const deleteSpy = jest.spyOn(Map.prototype, 'delete');
  mockThrowUri = uri;
  try {
    expect(() => fetchAspectRatioForOwner(uri, () => true)).toThrow('synchronous probe failure');
    expect(deleteSpy).toHaveBeenCalledWith(uri);
  } finally {
    mockThrowUri = undefined;
    deleteSpy.mockRestore();
  }
});

it('keeps the earlier probe eligible when a newer start throws synchronously', async () => {
  const uri = 'https://example.test/second-probe-throws';
  const older = fetchAspectRatioForOwner(uri, () => true);
  const pending = mockPending.get(uri);
  if (pending?.length !== 1) throw new Error('Expected the first image probe');
  mockThrowUri = uri;
  try {
    expect(() => fetchAspectRatioForOwner(uri, () => true)).toThrow('synchronous probe failure');
    mockThrowUri = undefined;
    pending[0]?.resolve({ width: 300, height: 300 });
    expect(await older).toBe(1);
    expect(getAspectRatio(uri)).toBe(1);
  } finally {
    mockThrowUri = undefined;
  }
});

it('cleans up when an owner check throws after a probe completes', async () => {
  const uri = 'https://example.test/probe-owner-failure';
  const deleteSpy = jest.spyOn(Map.prototype, 'delete');
  try {
    const probe = fetchAspectRatioForOwner(uri, () => {
      throw new Error('owner check failed');
    });
    const pending = mockPending.get(uri);
    if (pending?.length !== 1) throw new Error('Expected an image probe');
    pending[0]?.resolve({ width: 300, height: 300 });
    await expect(probe).rejects.toThrow('owner check failed');
    expect(deleteSpy).toHaveBeenCalledWith(uri);
    expect(getAspectRatio(uri)).toBeUndefined();
  } finally {
    deleteSpy.mockRestore();
  }
});

it('cleans up when a probe result cannot be read', async () => {
  const uri = 'https://example.test/unreadable-probe-result';
  const deleteSpy = jest.spyOn(Map.prototype, 'delete');
  try {
    const probe = fetchAspectRatioForOwner(uri, () => true);
    const pending = mockPending.get(uri);
    if (pending?.length !== 1) throw new Error('Expected an image probe');
    const result = Object.defineProperty({ height: 300 }, 'width', {
      get() {
        throw new Error('unreadable size');
      },
    }) as { width: number; height: number };
    pending[0]?.resolve(result);
    await expect(probe).rejects.toThrow('unreadable size');
    expect(deleteSpy).toHaveBeenCalledWith(uri);
    expect(getAspectRatio(uri)).toBeUndefined();
  } finally {
    deleteSpy.mockRestore();
  }
});
