import {
  anyExpandable,
  canDrop,
  dropPositionAt,
  filterTreeItems,
  indexTree,
  treeMoves,
} from '../sidebar/tree';
import type { SidebarTree, SidebarTreeItem } from '../sidebar';

const row = (key: string, extra: Partial<SidebarTreeItem> = {}): SidebarTreeItem => ({
  key,
  label: key,
  draggable: true,
  ...extra,
});

const PRIVATE: SidebarTree = {
  key: 'private',
  label: 'Private',
  items: [
    row('roadmap', { items: [row('q1', { items: [row('jan')] }), row('q2')] }),
    row('notes'),
    row('locked', { draggable: false, droppable: false }),
  ],
};
const SHARED: SidebarTree = {
  key: 'shared',
  label: 'Shared',
  droppable: false,
  items: [row('theirs', { draggable: false })],
};
const places = indexTree([PRIVATE, SHARED]);

describe('sidebar tree model', () => {
  it('keeps the rows a query matches, with every ancestor that leads to them', () => {
    const kept = filterTreeItems(PRIVATE.items ?? [], 'jan');
    expect(kept.map((item) => item.key)).toEqual(['roadmap']);
    expect(kept[0]!.items!.map((item) => item.key)).toEqual(['q1']);
    expect(kept[0]!.items![0]!.items!.map((item) => item.key)).toEqual(['jan']);
    // A matching row keeps everything under it.
    expect(filterTreeItems(PRIVATE.items ?? [], 'road')[0]!.items).toHaveLength(2);
    expect(filterTreeItems(PRIVATE.items ?? [], '')).toBe(PRIVATE.items);
  });

  it('knows a nesting section at any depth', () => {
    expect(anyExpandable(PRIVATE.items ?? [])).toBe(true);
    expect(anyExpandable([row('a'), row('b', { expandable: true })])).toBe(true);
    expect(anyExpandable(SHARED.items ?? [])).toBe(false);
  });

  it('indexes every row with its section, parent, siblings and ancestors', () => {
    const jan = places.get('jan')!;
    expect(jan.section.key).toBe('private');
    expect(jan.parent?.key).toBe('q1');
    expect(jan.ancestors).toEqual(['q1', 'roadmap']);
    expect(places.get('notes')!.index).toBe(1);
  });

  it('never lands a row on itself, inside its descendants, in a read-only section or inside a closed row', () => {
    expect(canDrop(places, 'roadmap', 'roadmap', PRIVATE, 'inside')).toBe(false);
    expect(canDrop(places, 'roadmap', 'jan', PRIVATE, 'after')).toBe(false);
    expect(canDrop(places, 'notes', 'theirs', SHARED, 'before')).toBe(false);
    expect(canDrop(places, 'notes', 'locked', PRIVATE, 'inside')).toBe(false);
    expect(canDrop(places, 'notes', 'locked', PRIVATE, 'before')).toBe(true);
    expect(canDrop(places, 'jan', 'notes', PRIVATE, 'inside')).toBe(true);
    // Not draggable: nothing moves it.
    expect(canDrop(places, 'locked', 'notes', PRIVATE, 'after')).toBe(false);
    // A section's label takes a row inside it, and only inside.
    expect(canDrop(places, 'jan', undefined, PRIVATE, 'inside')).toBe(true);
    expect(canDrop(places, 'jan', undefined, PRIVATE, 'before')).toBe(false);
    expect(canDrop(places, 'jan', undefined, SHARED, 'inside')).toBe(false);
  });

  it('splits a row in quarters, or halves when nothing can go inside it', () => {
    expect(dropPositionAt(0.1, true)).toBe('before');
    expect(dropPositionAt(0.5, true)).toBe('inside');
    expect(dropPositionAt(0.9, true)).toBe('after');
    expect(dropPositionAt(0.4, false)).toBe('before');
    expect(dropPositionAt(0.6, false)).toBe('after');
  });

  it('turns the four keyboard moves into drops, leaving out the impossible ones', () => {
    const q2 = treeMoves(places, 'q2');
    expect(q2.up).toMatchObject({ target: { key: 'q1' }, position: 'before' });
    expect(q2.in).toMatchObject({ target: { key: 'q1' }, position: 'inside' });
    expect(q2.out).toMatchObject({ target: { key: 'roadmap' }, position: 'after' });
    expect(q2.down).toBeUndefined();
    const roadmap = treeMoves(places, 'roadmap');
    expect(Object.keys(roadmap)).toEqual(['down']);
    // `notes` cannot nest under `locked` (not droppable), but can pass it.
    expect(treeMoves(places, 'notes').down).toMatchObject({ target: { key: 'locked' } });
    expect(treeMoves(places, 'theirs')).toEqual({});
  });
});
