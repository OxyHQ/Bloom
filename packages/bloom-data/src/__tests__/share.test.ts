import { changedPaths, merge, share } from '../share';

describe('share', () => {
  it('returns the previous value when deep-equal', () => {
    const prev = { a: 1, b: { c: [1, 2] } };
    expect(share(prev, { a: 1, b: { c: [1, 2] } })).toBe(prev);
  });

  it('keeps the identity of every unchanged part', () => {
    const prev = { a: { x: 1 }, b: { y: [1] } };
    const next = share(prev, { a: { x: 2 }, b: { y: [1] } });
    expect(next).not.toBe(prev);
    expect(next.b).toBe(prev.b);
    expect(next.a).toEqual({ x: 2 });
  });

  it('treats a key that becomes undefined as a change', () => {
    const prev: Record<string, unknown> = { a: 1 };
    expect(share(prev, { a: 1, b: undefined })).not.toBe(prev);
  });
});

describe('changedPaths', () => {
  const paths = (
    a: Record<string, unknown> | undefined,
    b: Record<string, unknown> | undefined,
  ) => {
    const out: string[] = [];
    changedPaths(a, b && share(a, b), out);
    return out.sort();
  };

  it('reports one and two levels deep', () => {
    const prev = { title: 't', engagement: { likes: 1, boosts: 0 } };
    expect(paths(prev, { title: 't', engagement: { likes: 2, boosts: 0 } })).toEqual([
      'engagement',
      'engagement.likes',
    ]);
  });

  it('reports a nested object arriving, with its keys and presence', () => {
    expect(paths({ a: 1 }, { a: 1, engagement: { likes: 1 } })).toEqual([
      '#keys',
      'engagement',
      'engagement.#keys',
      'engagement.likes',
      'engagement?',
    ]);
  });

  it('reports nothing for an equal value', () => {
    const prev = { a: { b: 1 } };
    expect(paths(prev, { a: { b: 1 } })).toEqual([]);
  });
});

describe('merge', () => {
  it('merges plain objects at any depth, replaces arrays, skips undefined', () => {
    const base = { a: { b: { c: 1, d: 2 } }, list: [1, 2], keep: 'x' };
    const merged = merge(base, { a: { b: { c: 3 } }, list: [9], keep: undefined });
    expect(merged).toEqual({ a: { b: { c: 3, d: 2 } }, list: [9], keep: 'x' });
  });

  it('returns the base when nothing changes', () => {
    const base = { a: { b: 1 } };
    expect(merge(base, { a: { b: 1 } })).toBe(base);
  });
});
