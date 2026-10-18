import { ScrollOffsetStore, deriveScrollKey } from '../scroll/store';

describe('deriveScrollKey', () => {
  it('returns null when there is no content to anchor against', () => {
    expect(deriveScrollKey(null)).toBeNull();
    expect(deriveScrollKey(null, 'feed')).toBeNull();
    expect(deriveScrollKey('', 'feed')).toBeNull();
  });

  it('keys on the content alone when there is no sub-key', () => {
    expect(deriveScrollKey('/@alice')).toBe('/@alice\0');
  });

  it('separates two different contents', () => {
    // The sharpest case is a query-only change, because that is where
    // expo-router RECYCLES one route object: `search?q=cats` -> `search?q=dogs`
    // keeps a single route key and swaps only params, so without the content id
    // the two searches would share an offset.
    expect(deriveScrollKey('search?"q":"cats"')).not.toBe(deriveScrollKey('search?"q":"dogs"'));
  });

  it('separates scrollables that share one content', () => {
    const posts = deriveScrollKey('/@alice', 'posts');
    const media = deriveScrollKey('/@alice', 'media');
    expect(posts).not.toBe(media);
  });

  it('gives ONE key to one content, whatever entry it was reached through', () => {
    // The deliberate trade: an offset belongs to what the user was looking at,
    // not to the history slot. That is what makes a tab press restore, and it
    // is also why the same content in two live entries shares an offset.
    expect(deriveScrollKey('index?')).toBe(deriveScrollKey('index?'));
  });

  it('composes a fixed two-field key so no two identities collapse', () => {
    expect(deriveScrollKey('a')).toBe('a\0');
    expect(deriveScrollKey('a', 'b')).toBe('a\0b');
    expect(deriveScrollKey('a', 'b')).not.toBe(deriveScrollKey('a\0b'));
  });

  it('treats an empty sub-key the same as no sub-key', () => {
    expect(deriveScrollKey('a', '')).toBe(deriveScrollKey('a'));
  });
});

describe('ScrollOffsetStore', () => {
  it('distinguishes an unseen key from one deliberately saved at the top', () => {
    // This is the whole reason callers ask `has` rather than `read() > 0`: both
    // read 0, and only one of them must be reset to the top.
    const store = new ScrollOffsetStore();
    store.save('seen', 0);
    expect(store.read('seen')).toBe(0);
    expect(store.has('seen')).toBe(true);
    expect(store.read('unseen')).toBe(0);
    expect(store.has('unseen')).toBe(false);
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

describe('portable scroll snapshots', () => {
  it('round trips JSON including zero, composite keys and prototype-like route names', () => {
    const store = new ScrollOffsetStore(JSON.parse('{"__proto__":12,"route%00feed":120,"top":0}'));
    const restored = new ScrollOffsetStore(JSON.parse(JSON.stringify(store.snapshot())));
    expect(restored.read('__proto__')).toBe(12);
    expect(restored.read('route\0feed')).toBe(120);
    expect(restored.has('top')).toBe(true);
  });
  it('rejects nonfinite values and bounds the most recently updated entries', () => {
    const store = new ScrollOffsetStore({ nan: NaN, infinite: Infinity, bounce: -20 });
    expect(store.snapshot()).toEqual({ bounce: 0 });
    for (let i = 0; i < 256; i++) store.save(`route-${i}`, i);
    store.save('route-0', 1);
    store.save('new', 2);
    expect(store.size).toBe(256);
    expect(store.has('bounce')).toBe(false);
    expect(store.has('route-1')).toBe(false);
    expect(store.read('route-0')).toBe(1);
  });
  it('notifies only changes, unsubscribes, and keeps snapshots detached', () => {
    const store = new ScrollOffsetStore();
    const listener = jest.fn();
    const remove = store.subscribe(listener);
    store.save('route', 4);
    const snapshot = store.snapshot();
    store.save('route', 4);
    expect(listener).toHaveBeenCalledTimes(1);
    store.save('route', 8);
    expect(snapshot.route).toBe(4);
    remove();
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

it('encodes separators and percent signs without emitting SQL-incompatible control keys', () => {
  const store = new ScrollOffsetStore();
  store.save('panel:entry\0screen%tab', 44);
  expect(store.snapshot()).toEqual({ 'panel%3Aentry%00screen%25tab': 44 });
  expect(Object.keys(store.snapshot()).every((key) => !/[\x00-\x1f]/.test(key))).toBe(true);
  const restored = new ScrollOffsetStore(store.snapshot());
  expect(restored.read('panel:entry\0screen%tab')).toBe(44);
  expect(new ScrollOffsetStore({ '%broken': 2 }).size).toBe(0);
});
