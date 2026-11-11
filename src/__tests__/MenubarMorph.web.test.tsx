/**
 * @jest-environment jsdom
 */

/**
 * A menu bar's ONE menu surface on the web (`menubar/viewport.tsx`, `Menubar.web.tsx`): moving to
 * another menu while one is open changes the open panel into the next menu. The panel is never
 * closed and opened again: the same element takes the next menu's name, place and size, as CSS
 * transitions on the menu motion, while the menu it leaves stays inert and hidden from assistive
 * technology until it has faded; at once with Reduce Motion. Against the DOM react-native-web
 * really produces (jsdom lays nothing out, so sizes are its zeros: what is checked is which
 * element, which attributes and which transitions).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

let mockReducedMotion = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReducedMotion,
}));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '../menubar/index.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

const chosen = jest.fn();
beforeEach(() => chosen.mockClear());

function Bar() {
  return (
    <Menubar>
      <MenubarMenu value="file">
        <MenubarTrigger testID="file">File</MenubarTrigger>
        <MenubarContent label="File">
          <MenubarItem onPress={() => chosen('New')}>New</MenubarItem>
          <MenubarItem onPress={() => chosen('Open')}>Open</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger testID="edit">Edit</MenubarTrigger>
        <MenubarContent label="Edit">
          <MenubarItem onPress={() => chosen('Undo')}>Undo</MenubarItem>
          <MenubarItem onPress={() => chosen('Redo')}>Redo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function mount() {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <Bar />
      </BloomThemeProvider>,
    );
  });
  wait(0);
}

function wait(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

const trigger = (testID: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${testID}"] [aria-haspopup]`) as HTMLElement;
const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]'));
/** The layer a row is in: the element carrying the layer's opacity transition. */
function layerOf(text: string): HTMLElement | null {
  const row = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
    (element) => element.textContent?.includes(text),
  );
  let node: HTMLElement | null = row ?? null;
  while (node && node.style.transitionProperty !== 'opacity') node = node.parentElement;
  return node;
}

/** The browser ending (or cancelling) the panel's own transitions of `properties`. */
function transitions(
  panel: HTMLElement,
  kind: 'transitionend' | 'transitioncancel',
  properties: string[],
) {
  act(() => {
    for (const property of properties) {
      const event = new Event(kind, { bubbles: true });
      Object.defineProperty(event, 'propertyName', { value: property });
      panel.dispatchEvent(event);
    }
  });
}

function pointerOver(testID: string) {
  act(() => {
    const event = new MouseEvent('pointermove', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    trigger(testID).dispatchEvent(event);
  });
}

function press(key: string) {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
  });
}

describe("a menu bar's one panel changing from one menu into the next (web)", () => {
  it('keeps the one panel, named for the new menu, moving and resizing as CSS transitions', () => {
    mount();
    act(() => trigger('file').click());
    wait(200);
    expect(panels()).toHaveLength(1);
    const panel = panels()[0] as HTMLElement;
    expect(panel.getAttribute('aria-label')).toBe('File');
    // At rest: sized by its menu, no transition of its place.
    expect(panel.style.width).toBe('');
    expect(panel.style.transitionProperty).toBe('box-shadow');

    pointerOver('edit');
    // The same element, now Edit's menu; changing, its place and size transition.
    expect(panels()).toEqual([panel]);
    expect(panel.getAttribute('aria-label')).toBe('Edit');
    expect(panel.style.transitionProperty).toBe('box-shadow, left, top, width, height');
    expect(panel.style.transitionTimingFunction).toContain('cubic-bezier(0,0,0.2,1)');
    expect(panel.style.width).not.toBe('');
    expect(panel.style.height).not.toBe('');
    // File's rows go on showing as they fade, out of reach; Edit's are in.
    const leaving = layerOf('New') as HTMLElement;
    expect(leaving.hasAttribute('inert')).toBe(true);
    expect(leaving.getAttribute('aria-hidden')).toBe('true');
    expect(leaving.style.opacity).toBe('0');
    expect(leaving.style.transitionDuration).toBe('150ms');
    const open = layerOf('Undo') as HTMLElement;
    expect(open.hasAttribute('inert')).toBe(false);
    expect(open.style.opacity).toBe('1');

    // However long it takes: it rests only when its transitions have ended, never on a timer.
    wait(1000);
    expect(layerOf('New')).not.toBeNull();
    expect(panel.style.transitionProperty).toBe('box-shadow, left, top, width, height');
    // A row's own transition ending is not the panel's.
    transitions(layerOf('Undo') as HTMLElement, 'transitionend', ['opacity']);
    expect(layerOf('New')).not.toBeNull();
    // Once its size has transitioned: File's rows gone, the panel at rest on Edit's menu.
    transitions(panel, 'transitionend', ['width']);
    expect(layerOf('New')).not.toBeNull();
    transitions(panel, 'transitionend', ['height', 'left']);
    expect(layerOf('New')).toBeNull();
    expect(panels()).toEqual([panel]);
    expect(panel.style.width).toBe('');
    expect(panel.style.transitionProperty).toBe('box-shadow');
  });

  it('from the keys: → changes the panel into the next menu, its first row focused', () => {
    mount();
    trigger('file').focus();
    press('ArrowDown');
    wait(200);
    expect(document.activeElement?.textContent).toContain('New');
    const panel = panels()[0];
    press('ArrowRight');
    wait(0);
    expect(panels()).toEqual([panel]);
    expect(document.activeElement?.textContent).toContain('Undo');
    // The rows of the menu it left are no rows of the menu: ↓ stays in Edit's.
    press('ArrowDown');
    expect(document.activeElement?.textContent).toContain('Redo');
    press('ArrowDown');
    expect(document.activeElement?.textContent).toContain('Undo');
  });

  it('with Reduce Motion changes at once, still one panel', () => {
    mockReducedMotion = true;
    mount();
    act(() => trigger('file').click());
    wait(200);
    const panel = panels()[0];
    pointerOver('edit');
    wait(0);
    expect(panels()).toEqual([panel]);
    expect(layerOf('New')).toBeNull();
    expect((layerOf('Undo') as HTMLElement).style.opacity).toBe('1');
    expect(panel?.style.transitionDuration.startsWith('0ms')).toBe(true);
  });

  it('rests once its transitions are cancelled, as when they end', () => {
    mount();
    act(() => trigger('file').click());
    wait(200);
    const panel = panels()[0] as HTMLElement;
    pointerOver('edit');
    expect(layerOf('New')).not.toBeNull();
    transitions(panel, 'transitioncancel', ['left', 'width', 'height']);
    expect(layerOf('New')).toBeNull();
    expect(panel.style.transitionProperty).toBe('box-shadow');
  });

  it("rests at once when the new menu is at the old one's place and size: no transition runs", () => {
    // The panel's place and size the same throughout (the new menu as big as the old, under a
    // title at the same place): the browser runs no transition of them, so no transitionend will
    // come, and nothing may wait for one.
    const same = new Set(['left', 'top', 'width', 'height']);
    const read = CSSStyleDeclaration.prototype.getPropertyValue;
    const values = jest
      .spyOn(CSSStyleDeclaration.prototype, 'getPropertyValue')
      .mockImplementation(function (this: CSSStyleDeclaration, property: string) {
        return same.has(property) ? '100px' : read.call(this, property);
      });
    try {
      mount();
      act(() => trigger('file').click());
      wait(200);
      const panel = panels()[0] as HTMLElement;
      pointerOver('edit');
      expect(panels()).toEqual([panel]);
      expect(panel.getAttribute('aria-label')).toBe('Edit');
      expect(layerOf('New')).toBeNull();
      expect(panel.style.transitionProperty).toBe('box-shadow');
      expect((layerOf('Undo') as HTMLElement).style.opacity).toBe('1');
    } finally {
      values.mockRestore();
    }
  });
});
