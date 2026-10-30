/**
 * What a `Menubar` knows of its declaration: every mounted menu, submenu, item
 * and separator, registered by the part that declares it (`declared.tsx`).
 *
 * From it the bar
 *  - DESCRIBES itself to a platform that shows the menus in a bar of its own
 *    (`describe()`, the `menu-bar` capability, OxyOS ADR 0021);
 *  - runs the item the platform reports chosen (`activate(id)`);
 *  - finds the item whose shortcut a key press is (`shortcutFor`), on every
 *    platform.
 *
 * ORDER. Entries register from effects, which run in mount order, not in
 * declaration order: an item mounted later between two others registers last.
 * So each entry carries its `path`, its position in the declaration (one index
 * per container: the bar, a menu's content, a group, a submenu's content),
 * and the description sorts by it. Entries at the same path (several rendered
 * by one custom component) keep the order they registered in.
 *
 * Changes are coalesced: however many entries change in one commit, listeners
 * hear once, after it (a microtask).
 */
import { type Chord, chordText, matchesChord } from '../kbd/chord';
import type { PlatformKeyEvent, PlatformMenu, PlatformMenuItem } from '../platform-surface/types';

export type MenuEntryKind = 'menu' | 'submenu' | 'item' | 'separator';

export interface MenuEntry {
  /** Bloom's id for it, stable while it is mounted, unique in the window. */
  readonly id: string;
  readonly kind: MenuEntryKind;
  /** The menu or submenu it is in; null for a menu. */
  readonly parent: string | null;
  /** Its position in the declaration. */
  readonly path: readonly number[];
  readonly label: string;
  /** Its own state; a disabled menu or submenu disables everything in it too. */
  readonly enabled: boolean;
  readonly shortcut: Chord | null;
  /** Check and radio items only. */
  readonly checked?: boolean;
  /** Its menu stays open after it runs (an in-window menu). */
  readonly keepOpen?: boolean;
  /** Runs the item as a press on its row would. Commands only. */
  readonly run?: () => void;
}

interface Stored extends MenuEntry {
  /** Registration order, for entries at the same path. */
  readonly seq: number;
}

let nextSeq = 0;
let nextId = 0;

/** A new entry id, unique in the window. */
export function nextMenuEntryId(): string {
  nextId += 1;
  return `bloom-menu-${nextId}`;
}

function samePath(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameEntry(a: MenuEntry, b: MenuEntry): boolean {
  return (
    a.kind === b.kind &&
    a.parent === b.parent &&
    samePath(a.path, b.path) &&
    a.label === b.label &&
    a.enabled === b.enabled &&
    (a.shortcut ? chordText(a.shortcut) : '') === (b.shortcut ? chordText(b.shortcut) : '') &&
    a.checked === b.checked &&
    a.keepOpen === b.keepOpen &&
    a.run === b.run
  );
}

function compare(a: Stored, b: Stored): number {
  const length = Math.min(a.path.length, b.path.length);
  for (let index = 0; index < length; index++) {
    const difference = (a.path[index] ?? 0) - (b.path[index] ?? 0);
    if (difference !== 0) return difference;
  }
  if (a.path.length !== b.path.length) return a.path.length - b.path.length;
  return a.seq - b.seq;
}

export class MenubarRegistry {
  private readonly entries = new Map<string, Stored>();
  private readonly listeners = new Set<() => void>();
  private scheduled = false;

  /** Adds or updates an entry. An unchanged one is not a change. */
  set(entry: MenuEntry): void {
    const current = this.entries.get(entry.id);
    if (current && sameEntry(current, entry)) return;
    this.entries.set(entry.id, { ...entry, seq: current?.seq ?? nextSeq++ });
    this.changed();
  }

  delete(id: string): void {
    if (this.entries.delete(id)) this.changed();
  }

  /** Calls `listener` once after each commit that changed an entry. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private changed(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      for (const listener of [...this.listeners]) listener();
    });
  }

  private childrenOf(parent: string): Stored[] {
    return [...this.entries.values()].filter((entry) => entry.parent === parent).sort(compare);
  }

  /**
   * Whether an entry can be chosen now: it and every menu and submenu it is in
   * are enabled, and each of those is mounted (an entry whose menu has no
   * trigger is not shown, so it is not live either).
   */
  private live(entry: Stored): boolean {
    let current: Stored | undefined = entry;
    while (current) {
      if (!current.enabled) return false;
      if (current.parent === null) return current.kind === 'menu';
      current = this.entries.get(current.parent);
    }
    return false;
  }

  private describeItems(parent: string, enabled: boolean): PlatformMenuItem[] {
    return this.childrenOf(parent).flatMap((entry): PlatformMenuItem[] => {
      const live = enabled && entry.enabled;
      switch (entry.kind) {
        case 'separator':
          return [{ kind: 'separator' }];
        case 'submenu':
          return [
            {
              kind: 'submenu',
              id: entry.id,
              label: entry.label,
              enabled: live,
              items: this.describeItems(entry.id, live),
            },
          ];
        case 'item':
          return [
            {
              kind: 'item',
              id: entry.id,
              label: entry.label,
              enabled: live,
              ...(entry.shortcut ? { shortcut: chordText(entry.shortcut) } : null),
              ...(entry.checked === undefined ? null : { checked: entry.checked }),
            },
          ];
        default:
          return [];
      }
    });
  }

  /** The bar's menus, as `PlatformMenuBar.setMenus` takes them. */
  describe(): PlatformMenu[] {
    return [...this.entries.values()]
      .filter((entry) => entry.kind === 'menu' && entry.parent === null)
      .sort(compare)
      .map((menu) => ({
        id: menu.id,
        label: menu.label,
        items: this.describeItems(menu.id, menu.enabled),
      }));
  }

  /**
   * Runs the item with this id when it is live; returns it, or null when there
   * is no such item or it cannot be chosen (and nothing ran).
   */
  activate(id: string): MenuEntry | null {
    const entry = this.entries.get(id);
    if (entry?.kind !== 'item' || !entry.run || !this.live(entry)) return null;
    entry.run();
    return entry;
  }

  /**
   * The first item, in declaration order, whose shortcut the key press is and
   * that can be chosen now; null when there is none.
   */
  shortcutFor(event: PlatformKeyEvent, apple: boolean): MenuEntry | null {
    const candidates = [...this.entries.values()]
      .filter(
        (entry) =>
          entry.kind === 'item' &&
          entry.shortcut !== null &&
          entry.run !== undefined &&
          matchesChord(entry.shortcut, event, apple),
      )
      .sort(compare);
    return candidates.find((entry) => this.live(entry)) ?? null;
  }
}
