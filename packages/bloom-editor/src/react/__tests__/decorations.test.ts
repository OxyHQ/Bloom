import { BlockDecorations } from '../decorations';

describe('BlockDecorations', () => {
  it('replaces decorations and tells subscribers', () => {
    const store = new BlockDecorations();
    const calls: number[] = [];
    const unsubscribe = store.subscribe(() => calls.push(1));
    store.set(new Map([['b1', { color: '#f00', label: 'Ana' }]]));
    expect(store.get('b1')).toEqual({ color: '#f00', label: 'Ana' });
    expect(store.get('b2')).toBeUndefined();
    unsubscribe();
    store.set(new Map());
    expect(calls).toHaveLength(1);
    expect(store.get('b1')).toBeUndefined();
  });
});
