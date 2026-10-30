/**
 * @jest-environment jsdom
 */

/**
 * `ContextMenu`'s controlled form on WEB: the caller owns the anchor, and there
 * may be no trigger at all (a menu opened by code — a toolbar button's handler,
 * a right-click forwarded from somewhere that is not the DOM, a shortcut).
 *
 * What is pinned: the menu is open exactly while `anchor` is non-null and sits
 * AT it; focus lands on the PANEL with no row active, as a desktop menu opened
 * from code does, and ↓ / ↑ reach the first / last row; every dismissal
 * asks the caller to clear the anchor (and nothing closes until it does); focus
 * returns to the element that held it before the open; a trigger in this form
 * reports its point instead of opening on its own; sub-menus keep their keys.
 * The real-browser half (outside press through hit testing, placement against
 * the viewport) is `scripts/verify-web-keyboard.mjs`.
 */
import type React from 'react';
import { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Pressable, Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  type ContextMenuAnchor,
} from '../context-menu/index.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

function render(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
  flush();
}

function flush() {
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

function press(key: string) {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
  act(() => {
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }),
    );
  });
  flush();
}

const focusedName = () => document.activeElement?.getAttribute('aria-label') ?? null;
const panelHasFocus = () =>
  document.activeElement === document.querySelector('[data-testid="panel"]');
const menuPanels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]'));
const rowNamed = (name: string) =>
  document.querySelector<HTMLElement>(`[role="menuitem"][aria-label="${name}"]`);

const calls = {
  open: jest.fn(),
  anchor: jest.fn(),
  rename: jest.fn(),
  archive: jest.fn(),
};
beforeEach(() => {
  for (const fn of Object.values(calls)) fn.mockClear();
});

/**
 * The Astro shape: a button whose handler opens a menu at a point, and no
 * `ContextMenuTrigger` anywhere. `follow` decides whether the caller honours
 * the menu's request to clear the anchor.
 */
function Imperative({
  initial = null,
  follow = true,
  withSub = false,
}: {
  initial?: ContextMenuAnchor | null;
  follow?: boolean;
  withSub?: boolean;
}) {
  const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(initial);
  return (
    <>
      <Pressable
        testID="opener"
        accessibilityLabel="Opener"
        onPress={() => setAnchor({ x: 40, y: 60 })}
      >
        <Text>Open menu</Text>
      </Pressable>
      <Pressable
        testID="move"
        accessibilityLabel="Move"
        onPress={() => setAnchor({ x: 200, y: 120 })}
      >
        <Text>Move menu</Text>
      </Pressable>
      <ContextMenu
        anchor={anchor}
        onOpenChange={calls.open}
        onAnchorChange={(next) => {
          calls.anchor(next);
          if (follow) setAnchor(next);
        }}
      >
        <ContextMenuContent testID="panel">
          <ContextMenuItem onPress={calls.rename}>Rename</ContextMenuItem>
          <ContextMenuItem onPress={calls.archive}>Archive</ContextMenuItem>
          {withSub ? (
            <ContextMenuSub>
              <ContextMenuSubTrigger testID="sub-trigger">Move to</ContextMenuSubTrigger>
              <ContextMenuSubContent testID="sub-panel">
                <ContextMenuItem>Inbox</ContextMenuItem>
                <ContextMenuItem>Spam</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}

function focusOpener(testID = 'opener') {
  const el = document.querySelector<HTMLElement>(`[data-testid="${testID}"]`) as HTMLElement;
  act(() => el.focus());
  return el;
}

function clickOpener(testID = 'opener') {
  const el = focusOpener(testID);
  act(() => el.click());
  flush();
  return el;
}

describe('ContextMenu (web) — controlled by `anchor`, no trigger', () => {
  it('renders nothing while the anchor is null', () => {
    render(<Imperative />);
    expect(menuPanels()).toHaveLength(0);
  });

  it('opens AT the anchor point with focus on the panel, no row active', () => {
    render(<Imperative />);
    clickOpener();
    const panel = document.querySelector<HTMLElement>('[data-testid="panel"]');
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute('role')).toBe('menu');
    // jsdom lays nothing out, so the panel holds its pre-measurement position:
    // the anchor itself, with the context menu's zero side offset.
    expect(panel?.style.left).toBe('40px');
    expect(panel?.style.top).toBe('60px');
    expect(panelHasFocus()).toBe(true);
    expect(panel?.getAttribute('tabindex')).toBe('-1');
    expect(calls.open).not.toHaveBeenCalled();
    press('ArrowDown');
    expect(focusedName()).toBe('Rename');
  });

  it('accepts a rect anchor as well as a point', () => {
    render(<Imperative initial={{ top: 10, bottom: 30, left: 50, right: 90 }} />);
    const panel = document.querySelector<HTMLElement>('[data-testid="panel"]');
    expect(panel?.style.left).toBe('50px');
    expect(panel?.style.top).toBe('30px');
    expect(panelHasFocus()).toBe(true);
  });

  it('runs the menu keys, and Escape asks the caller to clear the anchor', () => {
    render(<Imperative />);
    const opener = clickOpener();
    press('ArrowUp');
    expect(focusedName()).toBe('Archive');
    press('ArrowDown');
    expect(focusedName()).toBe('Rename');
    press('Escape');
    expect(calls.open).toHaveBeenLastCalledWith(false);
    expect(calls.anchor).toHaveBeenLastCalledWith(null);
    expect(document.activeElement).toBe(opener);
  });

  it('Tab closes it and restores focus to where it was before the open', () => {
    render(<Imperative />);
    const opener = clickOpener();
    expect(panelHasFocus()).toBe(true);
    press('Tab');
    expect(calls.anchor).toHaveBeenLastCalledWith(null);
    expect(document.activeElement).toBe(opener);
  });

  it('a row activates and closes the menu through the caller', () => {
    render(<Imperative />);
    clickOpener();
    press('ArrowDown');
    press('ArrowDown');
    press(' ');
    expect(calls.archive).toHaveBeenCalledTimes(1);
    expect(calls.rename).not.toHaveBeenCalled();
    expect(calls.open).toHaveBeenLastCalledWith(false);
    expect(calls.anchor).toHaveBeenLastCalledWith(null);
  });

  it('stays open until the caller clears the anchor — the anchor is the one fact', () => {
    render(<Imperative initial={{ x: 40, y: 60 }} follow={false} />);
    expect(panelHasFocus()).toBe(true);
    press('Escape');
    expect(calls.anchor).toHaveBeenLastCalledWith(null);
    expect(document.querySelector('[data-testid="panel"]')).not.toBeNull();
  });

  it('a new anchor while open moves the menu and re-takes focus', () => {
    render(<Imperative />);
    clickOpener();
    press('ArrowUp');
    expect(focusedName()).toBe('Archive');
    clickOpener('move');
    const panel = document.querySelector<HTMLElement>('[data-testid="panel"]');
    expect(panel?.style.left).toBe('200px');
    expect(panelHasFocus()).toBe(true);
  });

  it('opens with no focused element and leaves focus alone on close', () => {
    render(<Imperative initial={{ x: 5, y: 5 }} />);
    expect(panelHasFocus()).toBe(true);
    press('Escape');
    expect(calls.anchor).toHaveBeenLastCalledWith(null);
    expect(document.activeElement).toBe(document.body);
  });

  it('a sub-menu flies out from the keyboard exactly as in the right-click form', () => {
    render(<Imperative withSub />);
    clickOpener();
    press('End');
    expect(focusedName()).toBe('Move to');
    press('ArrowRight');
    expect(document.querySelector('[data-testid="sub-panel"]')).not.toBeNull();
    expect(focusedName()).toBe('Inbox');
    press('ArrowLeft');
    expect(focusedName()).toBe('Move to');
    press('Escape');
    expect(calls.anchor).toHaveBeenLastCalledWith(null);
  });
});

describe('ContextMenu (web) — controlled, with a trigger', () => {
  function WithTrigger({ follow = true }: { follow?: boolean }) {
    const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(null);
    return (
      <ContextMenu
        anchor={anchor}
        onOpenChange={calls.open}
        onAnchorChange={(next) => {
          calls.anchor(next);
          if (follow) setAnchor(next);
        }}
      >
        <Pressable testID="elsewhere" accessibilityLabel="Elsewhere">
          <Text>Elsewhere</Text>
        </Pressable>
        <ContextMenuTrigger testID="area" label="Canvas">
          <Text>Right-click here</Text>
        </ContextMenuTrigger>
        <ContextMenuContent testID="panel">
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  const rightClick = () => {
    const trigger = document.querySelector<HTMLElement>(
      '[data-testid="area"] [aria-haspopup]',
    ) as HTMLElement;
    act(() => {
      trigger.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 30,
          clientY: 70,
        }),
      );
    });
    flush();
    return trigger;
  };

  it('a right-click REPORTS its point and opens only once the caller stores it', () => {
    render(<WithTrigger follow={false} />);
    rightClick();
    expect(calls.anchor).toHaveBeenCalledWith({ x: 30, y: 70 });
    expect(calls.open).toHaveBeenCalledWith(true);
    expect(document.querySelector('[data-testid="panel"]')).toBeNull();
  });

  it('stored, it opens at the point and focus returns to the trigger', () => {
    render(<WithTrigger />);
    const trigger = rightClick();
    const panel = document.querySelector<HTMLElement>('[data-testid="panel"]');
    expect(panel?.style.left).toBe('30px');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panelHasFocus()).toBe(true);
    press('Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('with a trigger mounted, focus goes to the TRIGGER, not to where it was before', () => {
    render(<WithTrigger />);
    focusOpener('elsewhere');
    const trigger = rightClick();
    expect(panelHasFocus()).toBe(true);
    press('Escape');
    expect(document.activeElement).toBe(trigger);
  });
});

describe('ContextMenu (web) — uncontrolled stays as it was', () => {
  it('opens on right-click without an anchor prop and reports onAnchorChange', () => {
    render(
      <ContextMenu onOpenChange={calls.open} onAnchorChange={calls.anchor}>
        <ContextMenuTrigger testID="area" label="Canvas">
          <Text>Right-click here</Text>
        </ContextMenuTrigger>
        <ContextMenuContent testID="panel">
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const trigger = document.querySelector<HTMLElement>(
      '[data-testid="area"] [aria-haspopup]',
    ) as HTMLElement;
    act(() => {
      trigger.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 12,
          clientY: 14,
        }),
      );
    });
    flush();
    expect(rowNamed('Rename')).not.toBeNull();
    expect(focusedName()).toBe('Rename');
    expect(calls.open).toHaveBeenLastCalledWith(true);
    expect(calls.anchor).toHaveBeenLastCalledWith({ x: 12, y: 14 });
    press('Escape');
    expect(calls.open).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger);
  });
});

describe('ContextMenu (web) — a trigger inside another', () => {
  it('opens only the inner menu for a right-click on the inner trigger', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger testID="folder" label="Folder">
          <ContextMenu>
            <ContextMenuTrigger testID="item" label="Item">
              <Text>report.pdf</Text>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Rename</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>New Folder</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const item = document.querySelector<HTMLElement>(
      '[data-testid="item"] [aria-haspopup]',
    ) as HTMLElement;
    act(() => {
      item.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 20,
          clientY: 30,
        }),
      );
    });
    flush();
    expect(rowNamed('Rename')).not.toBeNull();
    expect(rowNamed('New Folder')).toBeNull();
    expect(menuPanels()).toHaveLength(1);
  });
});
