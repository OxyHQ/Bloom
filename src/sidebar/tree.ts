import type { SidebarTree, SidebarTreeDrop, SidebarTreeItem } from './types';

/**
 * The tree's rows as data: search, the place of each row, and which drops
 * make sense. Pure, so the rules read (and test) apart from any gesture.
 */

/** A section's identity among several (`key`, else its label). */
export function sectionKey(section: SidebarTree): string {
  return section.key ?? section.label;
}

/** Whether a row has a disclosure: it has rows under it, or says it can. */
export function isExpandable(item: SidebarTreeItem): boolean {
  return Boolean(item.items?.length) || item.expandable === true;
}

/** Whether any row of these, at any depth, has a disclosure. */
export function anyExpandable(items: ReadonlyArray<SidebarTreeItem>): boolean {
  return items.some((item) => isExpandable(item) || anyExpandable(item.items ?? []));
}

function matches(label: string, query: string): boolean {
  return label.toLocaleLowerCase().includes(query);
}

/**
 * The rows a quick search keeps: a row whose label matches keeps everything
 * under it; otherwise it stays, holding only its matching descendants, when
 * any of them match. `query` is already trimmed and lower-cased.
 */
export function filterTreeItems(
  items: ReadonlyArray<SidebarTreeItem>,
  query: string,
): ReadonlyArray<SidebarTreeItem> {
  if (!query) return items;
  return items.flatMap((item) => {
    if (matches(item.label, query)) return [item];
    const kept = filterTreeItems(item.items ?? [], query);
    return kept.length ? [{ ...item, items: kept }] : [];
  });
}

/** Where one row sits: its section, its parent row and its siblings. */
export interface TreePlace {
  item: SidebarTreeItem;
  section: SidebarTree;
  parent?: SidebarTreeItem;
  siblings: ReadonlyArray<SidebarTreeItem>;
  index: number;
  /** Keys of every row above it, nearest first. */
  ancestors: ReadonlyArray<string>;
}

/** Every row of every section by key. Folders' rows are not part of it: they do not move. */
export function indexTree(sections: ReadonlyArray<SidebarTree>): Map<string, TreePlace> {
  const places = new Map<string, TreePlace>();
  const walk = (
    items: ReadonlyArray<SidebarTreeItem>,
    section: SidebarTree,
    parent: SidebarTreeItem | undefined,
    ancestors: ReadonlyArray<string>,
  ) => {
    items.forEach((item, index) => {
      places.set(item.key, { item, section, parent, siblings: items, index, ancestors });
      if (item.items?.length) walk(item.items, section, item, [item.key, ...ancestors]);
    });
  };
  for (const section of sections) walk(section.items ?? [], section, undefined, []);
  return places;
}

/**
 * Whether `source` may land at `position` of `targetKey` (or, with no target,
 * inside the section `targetSection`). A row never lands on itself or inside
 * its own descendants; nothing lands in a section that is not `droppable`; and
 * nothing lands INSIDE a row that is not.
 */
export function canDrop(
  places: Map<string, TreePlace>,
  sourceKey: string,
  targetKey: string | undefined,
  targetSection: SidebarTree,
  position: SidebarTreeDrop['position'],
): boolean {
  const source = places.get(sourceKey);
  if (!source || source.item.draggable !== true) return false;
  if (targetSection.droppable === false) return false;
  if (targetKey === undefined) return position === 'inside';
  if (targetKey === sourceKey) return false;
  const target = places.get(targetKey);
  if (!target) return false;
  if (target.ancestors.includes(sourceKey)) return false;
  if (position === 'inside' && target.item.droppable === false) return false;
  return true;
}

/**
 * The place a pointer at `fraction` of a row's height names: the top quarter
 * is before it, the bottom quarter after it and the middle inside it — or, for
 * a row nothing can go inside, the top half before and the bottom half after.
 */
export function dropPositionAt(
  fraction: number,
  insideAllowed: boolean,
): SidebarTreeDrop['position'] {
  if (!insideAllowed) return fraction < 0.5 ? 'before' : 'after';
  if (fraction < 0.25) return 'before';
  if (fraction > 0.75) return 'after';
  return 'inside';
}

export type TreeMove = 'up' | 'down' | 'in' | 'out';

/**
 * The drop each keyboard / accessibility move means for the row `key`: up and
 * down pass a sibling, in nests it under the sibling above (at the end), out
 * puts it right after its parent. A move that is not possible is absent.
 */
export function treeMoves(
  places: Map<string, TreePlace>,
  key: string,
): Partial<Record<TreeMove, SidebarTreeDrop>> {
  const place = places.get(key);
  if (!place || place.item.draggable !== true) return {};
  const { item, section, siblings, index, parent } = place;
  const drop = (target: SidebarTreeItem, position: SidebarTreeDrop['position']) =>
    canDrop(places, key, target.key, section, position)
      ? { item, from: section, target, position, section }
      : undefined;
  const above = siblings[index - 1];
  const below = siblings[index + 1];
  const moves: Partial<Record<TreeMove, SidebarTreeDrop>> = {
    up: above ? drop(above, 'before') : undefined,
    down: below ? drop(below, 'after') : undefined,
    in: above ? drop(above, 'inside') : undefined,
    out: parent ? drop(parent, 'after') : undefined,
  };
  for (const move of Object.keys(moves) as TreeMove[]) if (!moves[move]) delete moves[move];
  return moves;
}
