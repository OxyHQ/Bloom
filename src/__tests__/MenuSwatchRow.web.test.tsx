/**
 * @jest-environment jsdom
 */

/**
 * A menu's row of colour swatches on WEB (`floating/menu-swatch-row.tsx`),
 * through the DOM react-native-web really produces: each swatch a
 * `menuitemcheckbox` named by its name and checked by its state; the row one
 * stop for the menu's ↓ and ↑ (`menu-keyboard.ts`) with ← and → its own,
 * mirrored right to left; a press calls `onSelect` and closes the menu unless
 * `keepOpen`; the caption under the row says what the focused swatch does.
 *
 * Keys are dispatched on `document.activeElement`, so a key that moved focus
 * to the wrong element fails the next assertion.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSwatchRow,
  DropdownMenuTrigger,
} from '../dropdown-menu/index.web';
import type { DropdownMenuSwatch } from '../dropdown-menu/index.web';
import {
  ContextMenu,
  ContextMenuSwatchRow,
  ContextMenuTrigger,
  ContextMenuContent,
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
  document.documentElement.removeAttribute('dir');
  jest.useRealTimers();
});

function flush() {
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
  flush();
}

/** A key on whatever holds focus, plus the Enter a real `<button>` trigger adds (jsdom does not). */
function press(key: string) {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const isButton = target.tagName === 'BUTTON';
  act(() => {
    const down = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(down);
    if (isButton && key === 'Enter' && !down.defaultPrevented) target.click();
  });
  act(() => {
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }),
    );
  });
  flush();
}

const trigger = () =>
  document.querySelector<HTMLElement>('[data-testid="menu"] [aria-haspopup]') as HTMLElement;
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';
const focusedName = () => document.activeElement?.getAttribute('aria-label') ?? null;
const swatch = (name: string) =>
  document.querySelector<HTMLElement>(`[role="menuitemcheckbox"][aria-label="${name}"]`);

const SWATCHES: DropdownMenuSwatch[] = [
  { key: 'red', color: '#ff3b30', name: 'Red', state: 'on', caption: 'Remove Red' },
  { key: 'orange', color: '#ff9500', name: 'Orange', state: 'off', caption: 'Add Orange' },
  { key: 'yellow', color: '#ffcc00', name: 'Yellow', state: 'mixed', caption: 'Add Yellow' },
  { key: 'green', color: '#34c759', name: 'Green', state: 'off', disabled: true },
  { key: 'blue', color: '#007aff', name: 'Blue', state: 'off', caption: 'Add Blue' },
];

function Tags({
  onSelect,
  keepOpen,
  onTags = () => {},
}: {
  onSelect: (key: string) => void;
  keepOpen?: boolean;
  onTags?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger label="Actions" testID="menu">
        <Text>Actions</Text>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onPress={() => {}}>Open</DropdownMenuItem>
        <DropdownMenuSwatchRow
          accessibilityLabel="Tags"
          swatches={SWATCHES}
          onSelect={onSelect}
          keepOpen={keepOpen}
          testID="tags"
        />
        <DropdownMenuItem onPress={onTags}>Tags…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function open() {
  act(() => trigger().focus());
  press('Enter');
  expect(focusedName()).toBe('Open');
}

describe('DropdownMenuSwatchRow (web): what each swatch says', () => {
  it('is a group of menuitemcheckboxes, named, checked true, false or mixed', () => {
    mount(<Tags onSelect={() => {}} />);
    open();
    const group = document.querySelector('[data-testid="tags"]');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Tags');
    const swatches = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="tags"] [role="menuitemcheckbox"]'),
    );
    expect(swatches.map((each) => each.getAttribute('aria-label'))).toEqual([
      'Red',
      'Orange',
      'Yellow',
      'Green',
      'Blue',
    ]);
    expect(swatches.map((each) => each.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'mixed',
      'false',
      'false',
    ]);
    expect(swatch('Green')?.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('DropdownMenuSwatchRow (web): the keys', () => {
  it('↓ and ↑ stop on the row once; ← and → move between its swatches, skipping a disabled one', () => {
    mount(<Tags onSelect={() => {}} />);
    open();
    press('ArrowDown');
    expect(focusedName()).toBe('Red');
    press('ArrowRight');
    expect(focusedName()).toBe('Orange');
    press('ArrowRight');
    press('ArrowRight');
    // Green is disabled.
    expect(focusedName()).toBe('Blue');
    // At the end the row keeps focus where it is.
    press('ArrowRight');
    expect(focusedName()).toBe('Blue');
    press('ArrowDown');
    expect(focusedName()).toBe('Tags…');
    // Back up: the swatch the row last had, not its first.
    press('ArrowUp');
    expect(focusedName()).toBe('Blue');
    press('ArrowLeft');
    expect(focusedName()).toBe('Yellow');
    press('ArrowUp');
    expect(focusedName()).toBe('Open');
  });

  it('mirrors ← and → right to left', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    mount(<Tags onSelect={() => {}} />);
    open();
    press('ArrowDown');
    expect(focusedName()).toBe('Red');
    press('ArrowLeft');
    expect(focusedName()).toBe('Orange');
    press('ArrowRight');
    expect(focusedName()).toBe('Red');
  });

  it.each(['Enter', ' '])('%j presses the focused swatch and closes the menu', (key) => {
    const onSelect = jest.fn();
    mount(<Tags onSelect={onSelect} />);
    open();
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowRight');
    press(key);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('yellow');
    expect(isOpen()).toBe(false);
  });

  it('keepOpen keeps the menu open after a press', () => {
    const onSelect = jest.fn();
    mount(<Tags onSelect={onSelect} keepOpen />);
    open();
    press('ArrowDown');
    press(' ');
    expect(onSelect).toHaveBeenCalledWith('red');
    expect(isOpen()).toBe(true);
  });

  it('a pointer press presses the swatch', () => {
    const onSelect = jest.fn();
    mount(<Tags onSelect={onSelect} />);
    open();
    act(() => swatch('Blue')?.click());
    flush();
    expect(onSelect).toHaveBeenCalledWith('blue');
    expect(isOpen()).toBe(false);
  });

  it('a disabled swatch presses nothing', () => {
    const onSelect = jest.fn();
    mount(<Tags onSelect={onSelect} />);
    open();
    act(() => swatch('Green')?.click());
    flush();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('DropdownMenuSwatchRow (web): the caption', () => {
  const caption = () =>
    document.querySelector('[data-testid="tags"] [aria-hidden="true"]')?.textContent ?? null;

  it('says what the focused swatch does, and nothing while none is', () => {
    mount(<Tags onSelect={() => {}} />);
    open();
    expect(caption()).toBe('');
    press('ArrowDown');
    expect(caption()).toBe('Remove Red');
    press('ArrowRight');
    expect(caption()).toBe('Add Orange');
    press('ArrowDown');
    expect(caption()).toBe('');
  });
});

describe('DropdownMenuSwatchRow (web) in a flyout', () => {
  it('← moves between swatches and closes the flyout only from the first', () => {
    mount(
      <DropdownMenu>
        <DropdownMenuTrigger label="Actions" testID="menu">
          <Text>Actions</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Tags</DropdownMenuSubTrigger>
            <DropdownMenuSubContent testID="sub-panel">
              <DropdownMenuSwatchRow swatches={SWATCHES} onSelect={() => {}} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    act(() => trigger().focus());
    press('Enter');
    expect(focusedName()).toBe('Tags');
    press('ArrowRight');
    expect(focusedName()).toBe('Red');
    press('ArrowRight');
    expect(focusedName()).toBe('Orange');
    press('ArrowLeft');
    expect(focusedName()).toBe('Red');
    expect(document.querySelector('[data-testid="sub-panel"]')).not.toBeNull();
    press('ArrowLeft');
    expect(focusedName()).toBe('Tags');
  });
});

describe('ContextMenuSwatchRow (web)', () => {
  it('is the same row under the ContextMenu prefix', () => {
    const onSelect = jest.fn();
    mount(
      <ContextMenu>
        <ContextMenuTrigger testID="area" label="notes.md">
          <Text>notes.md</Text>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSwatchRow swatches={SWATCHES} onSelect={onSelect} />
        </ContextMenuContent>
      </ContextMenu>,
    );
    const area = document.querySelector<HTMLElement>('[data-testid="area"]') as HTMLElement;
    act(() => {
      area.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 10,
          clientY: 10,
        }),
      );
    });
    flush();
    expect(focusedName()).toBe('Red');
    press('ArrowRight');
    press('Enter');
    expect(onSelect).toHaveBeenCalledWith('orange');
  });
});
