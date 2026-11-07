/**
 * @jest-environment jsdom
 */

/**
 * WEB: a row inside a menubar menu's sub-menu is chosen by a mouse press, as a
 * browser delivers one: `pointerdown` and `mousedown`, then `pointerup`,
 * `mouseup` and `click`, all on the row.
 *
 * The menubar's panel is the one NON-modal menu surface (no backdrop), so it
 * dismisses on an outside `pointerdown` heard on the document. The sub-menu's
 * flyout is a panel of its own, in its own portal, and so outside the bar's
 * panel's DOM: a press on one of its rows used to read as outside, close the
 * whole menu before the click, and leave the row's activation with nothing to
 * run on. A context menu's sub-menu never hit this: a modal menu dismisses
 * through its backdrop, which the flyout sits above.
 *
 * Dispatched events reach the document's capture listener and React's root
 * exactly as real ones do; what they cannot do is hit-test, which
 * `scripts/verify-menubar-submenu-press.mjs` covers in a real browser.
 */
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../menubar/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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

function settle() {
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

const onTag = jest.fn();
const onSort = jest.fn();
const onHidden = jest.fn();

beforeEach(() => {
  onTag.mockClear();
  onSort.mockClear();
  onHidden.mockClear();
});

function App({ onValueChange }: { onValueChange?: (value?: string) => void }) {
  const [sort, setSort] = useState('name');
  const [hidden, setHidden] = useState(false);
  return (
    <Menubar defaultValue="view" onValueChange={onValueChange}>
      <MenubarMenu value="view">
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>As Icons</MenubarItem>
          <MenubarSub defaultOpen>
            <MenubarSubTrigger>Sort By</MenubarSubTrigger>
            <MenubarSubContent testID="sort-sub">
              <MenubarRadioGroup
                value={sort}
                onValueChange={(next) => {
                  onSort(next);
                  setSort(next);
                }}
              >
                <MenubarRadioItem value="name">Name</MenubarRadioItem>
                <MenubarRadioItem value="size">Size</MenubarRadioItem>
              </MenubarRadioGroup>
              <MenubarCheckboxItem
                checked={hidden}
                onCheckedChange={(next) => {
                  onHidden(next);
                  setHidden(next);
                }}
              >
                Hidden Files
              </MenubarCheckboxItem>
              <MenubarItem onPress={onTag}>Red</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
  settle();
}

/** The sub-menu's row with this label. */
function subRow(label: string): HTMLElement {
  const sub = document.querySelector('[data-testid="sort-sub"]');
  if (!sub) throw new Error('the sub-menu is not open');
  const row = [...sub.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find((node) =>
    node.textContent?.trim().startsWith(label),
  );
  if (!row) throw new Error(`no "${label}" row in the sub-menu`);
  return row;
}

/**
 * A pointer event. jsdom has no `PointerEvent`, so it is the `MouseEvent` it
 * extends, carrying the pointer's own fields.
 */
function pointerEvent(type: string, init: MouseEventInit): MouseEvent {
  const event = new MouseEvent(type, init);
  for (const [key, value] of Object.entries({
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  })) {
    Object.defineProperty(event, key, { value });
  }
  return event;
}

/**
 * A primary-button mouse press on `target`, in the order and with the event
 * types a browser sends. Off the window's corner, where jsdom's zero-sized
 * boxes put every anchor, so no anchor's geometry excuses it.
 */
function mousePress(target: HTMLElement) {
  const at = { bubbles: true, cancelable: true, composed: true, clientX: 320, clientY: 240 };
  const send = (event: Event) =>
    act(() => {
      target.dispatchEvent(event);
    });
  send(pointerEvent('pointerdown', { ...at, button: 0, buttons: 1 }));
  send(new MouseEvent('mousedown', { ...at, button: 0, buttons: 1 }));
  send(pointerEvent('pointerup', { ...at, button: 0, buttons: 0 }));
  send(new MouseEvent('mouseup', { ...at, button: 0, buttons: 0 }));
  send(new MouseEvent('click', { ...at, button: 0, buttons: 0, detail: 1 }));
}

describe('a menubar sub-menu row chosen with the mouse (web)', () => {
  it('runs a radio row: View › Sort By › Size checks Size', () => {
    const onValueChange = jest.fn();
    mount(<App onValueChange={onValueChange} />);
    mousePress(subRow('Size'));
    expect(onSort).toHaveBeenCalledWith('size');
    // Choosing it closes the menu, as a row in the menu itself does.
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  });

  it('runs a checkbox row', () => {
    mount(<App />);
    mousePress(subRow('Hidden Files'));
    expect(onHidden).toHaveBeenCalledWith(true);
  });

  it('runs a plain row: File › Tags › Red', () => {
    mount(<App />);
    mousePress(subRow('Red'));
    expect(onTag).toHaveBeenCalledTimes(1);
  });

  it('still closes the menu on a press outside both panels', () => {
    const onValueChange = jest.fn();
    mount(<App onValueChange={onValueChange} />);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    act(() => {
      outside.dispatchEvent(
        pointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: 600,
          clientY: 500,
        }),
      );
    });
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    outside.remove();
  });
});
