import type {
  PlatformKeyboard,
  PlatformKeyEvent,
  PlatformMenu,
  PlatformMenuBar,
  PlatformMenuItem,
  PlatformSurfaceAdapter,
} from '../../platform-surface/types';

export interface FakeMenuBar extends PlatformMenuBar {
  setMenus: jest.Mock<void, [readonly PlatformMenu[]]>;
  /** The menus it was last given. */
  readonly menus: readonly PlatformMenu[];
  /** The person choosing an item in the platform's bar. */
  choose(id: string): void;
  /** The id of the item (or submenu) with this label, searched depth first. */
  idOf(label: string): string;
  /** How many listeners `onActivate` has now. */
  readonly listeners: number;
}

/** A platform's menu bar, recording what Bloom gives it. */
export function fakeMenuBar(): FakeMenuBar {
  const listeners = new Set<(id: string) => void>();
  const setMenus = jest.fn<void, [readonly PlatformMenu[]]>();
  const find = (items: readonly PlatformMenuItem[], label: string): string | undefined => {
    for (const item of items) {
      if (item.kind === 'separator') continue;
      if (item.label === label) return item.id;
      if (item.kind === 'submenu') {
        const inner = find(item.items, label);
        if (inner) return inner;
      }
    }
    return undefined;
  };
  const bar: FakeMenuBar = {
    setMenus,
    get menus() {
      const calls = setMenus.mock.calls;
      return calls[calls.length - 1]?.[0] ?? [];
    },
    onActivate(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    choose(id) {
      for (const listener of [...listeners]) listener(id);
    },
    idOf(label) {
      for (const menu of bar.menus) {
        if (menu.label === label) return menu.id;
        const id = find(menu.items, label);
        if (id) return id;
      }
      throw new Error(`No menu item labelled ${label}`);
    },
    get listeners() {
      return listeners.size;
    },
  };
  return bar;
}

export interface FakeKeyboard extends PlatformKeyboard {
  /** A key press in the window; returns whether Bloom took it. */
  press(event: Partial<PlatformKeyEvent> & { key: string }): boolean;
}

/** A native host's key source. */
export function fakeKeyboard(): FakeKeyboard {
  const listeners = new Set<(event: PlatformKeyEvent) => boolean>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    press(event) {
      const full: PlatformKeyEvent = {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...event,
      };
      return [...listeners].some((listener) => listener(full));
    },
  };
}

/** An adapter reporting `menu-bar` (and, given one, supplying the keys). */
export function menuBarAdapter(
  menuBar: PlatformMenuBar | undefined,
  keyboard?: PlatformKeyboard,
): PlatformSurfaceAdapter {
  return {
    platform: 'test',
    capabilities: new Set(menuBar ? ['menu-bar'] : []),
    ...(menuBar ? { menuBar } : null),
    ...(keyboard ? { keyboard } : null),
  };
}
