import { ScrollOffsetStore, deriveScrollKey } from '../scroll/store';

describe('deriveScrollKey', () => {
  it('returns null when there is no route key', () => {
    expect(deriveScrollKey(undefined)).toBeNull();
    expect(deriveScrollKey(undefined, 'feed')).toBeNull();
  });

  it('returns the route key verbatim when no sub-key is given', () => {
    expect(deriveScrollKey('Home-abc')).toBe('Home-abc');
  });

  it('treats an empty sub-key the same as no sub-key', () => {
    expect(deriveScrollKey('Home-abc', '')).toBe('Home-abc');
  });

  it('composes route key and sub-key for multiple lists on one route', () => {
    const a = deriveScrollKey('Profile-xyz', 'posts');
    const b = deriveScrollKey('Profile-xyz', 'media');
    expect(a).not.toBe(b);
    expect(a).toBe('Profile-xyz\0posts');
  });

  it('does not collide across routes that share a sub-key', () => {
    expect(deriveScrollKey('A', 'feed')).not.toBe(deriveScrollKey('B', 'feed'));
  });
});

describe('ScrollOffsetStore', () => {
  it('reads 0 for an unseen key so callers can restore unconditionally', () => {
    const store = new ScrollOffsetStore();
    expect(store.read('missing')).toBe(0);
    expect(store.has('missing')).toBe(false);
  });

  it('saves and reads an offset back', () => {
    const store = new ScrollOffsetStore();
    store.save('k', 420);
    expect(store.read('k')).toBe(420);
    expect(store.has('k')).toBe(true);
    expect(store.size).toBe(1);
  });

  it('keeps offsets independent per key', () => {
    const store = new ScrollOffsetStore();
    store.save('a', 100);
    store.save('b', 250);
    expect(store.read('a')).toBe(100);
    expect(store.read('b')).toBe(250);
    expect(store.size).toBe(2);
  });

  it('overwrites the offset on subsequent saves', () => {
    const store = new ScrollOffsetStore();
    store.save('k', 100);
    store.save('k', 300);
    expect(store.read('k')).toBe(300);
    expect(store.size).toBe(1);
  });

  it('clamps negative offsets to 0 (e.g. rubber-band overscroll)', () => {
    const store = new ScrollOffsetStore();
    store.save('k', -50);
    expect(store.read('k')).toBe(0);
  });

  it('forgets a single key', () => {
    const store = new ScrollOffsetStore();
    store.save('a', 1);
    store.save('b', 2);
    store.forget('a');
    expect(store.has('a')).toBe(false);
    expect(store.read('b')).toBe(2);
    expect(store.size).toBe(1);
  });

  it('clears every key', () => {
    const store = new ScrollOffsetStore();
    store.save('a', 1);
    store.save('b', 2);
    store.clear();
    expect(store.size).toBe(0);
    expect(store.has('a')).toBe(false);
  });
});
