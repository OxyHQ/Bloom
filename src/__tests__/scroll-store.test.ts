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
    expect(deriveScrollKey('search?"q":"cats"')).not.toBe(
      deriveScrollKey('search?"q":"dogs"'),
    );
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
