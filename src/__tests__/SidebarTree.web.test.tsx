/**
 * @jest-environment jsdom
 *
 * The page tree in a real document: rows are HTML drag sources and targets,
 * `hover` actions carry the hook their stylesheet reveals on hover and focus,
 * and keyboard moves (Alt+Shift+Arrow) report the same drops a drag does.
 *
 * Rendered through react-native-web: the drag events and the `data-*` hooks
 * exist only on the DOM nodes react-native-web leaves.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';
import { Sidebar } from '../sidebar';
import type { SidebarTree, SidebarTreeDrop } from '../sidebar';
import { displayShortcut } from '../sidebar/shortcuts';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const MIME = 'application/x-bloom-sidebar-row';

const TREE: SidebarTree[] = [
  {
    key: 'private',
    label: 'Private',
    actionsVisibility: 'hover',
    actions: <Text>Add page</Text>,
    items: [
      {
        key: 'roadmap',
        label: 'Roadmap',
        draggable: true,
        actionsVisibility: 'hover',
        actions: <Text>More</Text>,
      },
      { key: 'notes', label: 'Notes', draggable: true },
    ],
  },
  { key: 'shared', label: 'Shared', droppable: false, items: [{ key: 'theirs', label: 'Theirs' }] },
];

let root: Root;
let host: HTMLDivElement;
let drops: SidebarTreeDrop[];

function mount(tree: SidebarTree[] = TREE) {
  drops = [];
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Sidebar tree={tree} onTreeItemDrop={(drop) => drops.push(drop)} showThemeToggle={false} />
      </BloomThemeProvider>,
    ),
  );
}

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const byTestId = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

/** jsdom has no DragEvent: an Event carrying what the listeners read. */
function drag(node: HTMLElement, type: string, clientY = 0) {
  const data = new Map<string, string>();
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    dataTransfer: unknown;
    clientY: number;
  };
  Object.defineProperty(event, 'clientY', { value: clientY });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types: [MIME],
      setData: (format: string, value: string) => data.set(format, value),
      getData: (format: string) => data.get(format) ?? '',
      effectAllowed: 'none',
      dropEffect: 'none',
    },
  });
  act(() => {
    node.dispatchEvent(event);
  });
  return event;
}

/** A row 30px tall at the top of the page, so `clientY` is the place in it. */
function place(node: HTMLElement) {
  node.getBoundingClientRect = () =>
    ({ top: 0, height: 30, bottom: 30, left: 0, right: 200, width: 200, x: 0, y: 0 }) as DOMRect;
}

describe('Sidebar page tree on the web', () => {
  it('drags a row onto another and reports where it landed', () => {
    mount();
    const notes = byTestId('sidebar-tree-row-notes');
    const roadmap = byTestId('sidebar-tree-row-roadmap');
    place(roadmap);
    expect(notes.getAttribute('draggable')).toBe('true');
    drag(notes, 'dragstart');
    // The top quarter: before it.
    const over = drag(roadmap, 'dragover', 3);
    expect(over.defaultPrevented).toBe(true);
    drag(roadmap, 'drop', 3);
    expect(drops).toHaveLength(1);
    expect(drops[0]).toMatchObject({
      item: { key: 'notes' },
      target: { key: 'roadmap' },
      position: 'before',
    });
  });

  it('refuses a read-only section: the browser is never told it may drop there', () => {
    mount();
    const theirs = byTestId('sidebar-tree-row-theirs');
    place(theirs);
    drag(byTestId('sidebar-tree-row-notes'), 'dragstart');
    expect(drag(theirs, 'dragover', 15).defaultPrevented).toBe(false);
    drag(theirs, 'drop', 15);
    expect(drops).toHaveLength(0);
    // Not draggable: no drag source.
    expect(theirs.getAttribute('draggable')).toBeNull();
  });

  it("lands a row inside a section dropped on the section's label", () => {
    mount();
    const label = byTestId('sidebar-tree-label-private');
    place(label);
    drag(byTestId('sidebar-tree-row-roadmap'), 'dragstart');
    drag(label, 'dragover', 10);
    drag(label, 'drop', 10);
    expect(drops[0]).toMatchObject({ item: { key: 'roadmap' }, position: 'inside' });
    expect(drops[0]!.target).toBeUndefined();
  });

  it('moves the focused row with Alt+Shift+Arrow', () => {
    mount();
    const notes = byTestId('sidebar-tree-row-notes');
    const target = notes.querySelector<HTMLElement>('[aria-label="Notes"]')!;
    act(() => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowUp',
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(drops[0]).toMatchObject({
      item: { key: 'notes' },
      target: { key: 'roadmap' },
      position: 'before',
    });
    // Announced for screen readers.
    expect(byTestId('sidebar-tree-announcer').textContent).toBe('Notes moved');
  });

  it('marks hover-revealed actions for the stylesheet, on rows and section labels', () => {
    mount();
    const roadmap = byTestId('sidebar-tree-row-roadmap');
    expect(roadmap.getAttribute('data-bloom-sidebar-row')).toBe('hover');
    expect(roadmap.querySelector('[data-bloom-sidebar-row-actions]')?.textContent).toBe('More');
    expect(byTestId('sidebar-tree-row-notes').getAttribute('data-bloom-sidebar-row')).toBe(
      'always',
    );
    expect(byTestId('sidebar-tree-label-private').getAttribute('data-bloom-sidebar-row')).toBe(
      'hover',
    );
  });
});

describe('Mod shortcuts', () => {
  const platform = Object.getOwnPropertyDescriptor(window.navigator, 'platform');
  afterEach(() => {
    if (platform) Object.defineProperty(window.navigator, 'platform', platform);
  });
  const on = (value: string) =>
    Object.defineProperty(window.navigator, 'platform', { value, configurable: true });

  it('spells Mod for the platform, and leaves any other label as written', () => {
    on('MacIntel');
    expect(displayShortcut('Mod+K')).toBe('⌘K');
    expect(displayShortcut('Mod+Shift+P')).toBe('⌘⇧P');
    on('Win32');
    expect(displayShortcut('Mod+K')).toBe('Ctrl+K');
    expect(displayShortcut('Mod+Shift+P')).toBe('Ctrl+Shift+P');
    expect(displayShortcut('⌥⌃1')).toBe('⌥⌃1');
  });
});
