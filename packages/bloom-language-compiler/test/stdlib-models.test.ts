/**
 * @jest-environment node
 *
 * `@Model`'s store (stdlib/Bloom/models.ts) on Bloom's data layer: records kept by their
 * unique field and listed once in insertion order, changed and removed by key, sorted by a
 * field (a `Date` by its seconds), and an `Action`'s optimistic change rolled back when it fails.
 */
import {
  actionMake,
  compareBy,
  keyName,
  modelAll,
  modelDelete,
  modelGet,
  modelInsert,
  modelRegister,
  modelUpdate,
} from '../stdlib/Bloom/models';

type Note = { slug: string; text: string; createdAt: { timeIntervalSince1970: number } };

const note = (slug: string, text: string, at: number): Note => ({
  slug,
  text,
  createdAt: { timeIntervalSince1970: at },
});

describe('@Model store', () => {
  const notes = modelRegister<Note>('Note', 'slug', false);

  it('keeps records by key, each listed once, in insertion order', () => {
    modelInsert(notes, [note('a', 'first', 3), note('b', 'second', 1)]);
    modelInsert(notes, [note('a', 'first, edited', 3), note('c', 'third', 2)]);
    expect(modelAll(notes).map((n) => n.slug)).toEqual(['a', 'b', 'c']);
    expect(modelGet(notes, 'a')?.text).toBe('first, edited');
  });

  it('updates and deletes by key', () => {
    expect(modelUpdate(notes, 'b', (n) => ({ ...n, text: 'changed' }))).toBe(true);
    expect(modelGet(notes, 'b')?.text).toBe('changed');
    expect(modelUpdate(notes, 'missing', (n) => n)).toBe(false);
    expect(modelDelete(notes, 'c')).toBe(true);
    expect(modelAll(notes).map((n) => n.slug)).toEqual(['a', 'b']);
  });

  it('sorts by a field, a Date by its seconds', () => {
    const all = [note('x', 'x', 5), note('y', 'y', 1), note('z', 'z', 9)];
    expect([...all].sort(compareBy('createdAt', false)).map((n) => n.slug)).toEqual([
      'y',
      'x',
      'z',
    ]);
    expect([...all].sort(compareBy('createdAt', true)).map((n) => n.slug)).toEqual(['z', 'x', 'y']);
    expect([...all].sort(compareBy('slug', true)).map((n) => n.slug)).toEqual(['z', 'y', 'x']);
    expect(keyName('createdAt')).toBe('createdAt');
    expect(keyName(undefined)).toBeUndefined();
  });

  it("rolls an action's optimistic change back when it fails", async () => {
    modelInsert(notes, [note('p', 'before', 1)]);
    const rename = actionMake<string, void>(
      'rename',
      (text) => {
        modelUpdate(notes, 'p', (n) => ({ ...n, text }));
      },
      async () => {
        expect(modelGet(notes, 'p')?.text).toBe('after');
        throw new Error('refused');
      },
    );
    // The rejection reaches `Action.run`, which gives `none` for it (Data.bloom).
    await expect(rename('after')).rejects.toThrow('refused');
    expect(modelGet(notes, 'p')?.text).toBe('before');
  });
});
