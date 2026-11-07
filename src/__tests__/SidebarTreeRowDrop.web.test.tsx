/**
 * @jest-environment jsdom
 *
 * A sidebar tree row's `drop` in a real document: the row is an HTML5 drop
 * zone, lit with the accent while another application's drag of files is over
 * it and cleared when it leaves or drops, and the tree's own row drags still
 * land where they did, never on the zone.
 *
 * Rendered through react-native-web, with the drop zone's web fork, as a web
 * bundler resolves it.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../drop-zone', () => jest.requireActual('../drop-zone/index.web'));

import type { DropTargetDropEvent } from '../platform-surface/types';
import { Sidebar } from '../sidebar';
import type { SidebarTree, SidebarTreeDrop } from '../sidebar';
import { resolveSidebarPalette } from '../sidebar/palette';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROW_MIME = 'application/x-bloom-sidebar-row';
const palette = resolveSidebarPalette(buildTheme('teal', 'light'));

let root: Root;
let host: HTMLDivElement;
let treeDrops: SidebarTreeDrop[];
let fileDrops: DropTargetDropEvent[];
let leaves: number;

function tree(): SidebarTree[] {
  const drop = {
    accept: ['files'],
    actions: ['move', 'copy'] as const,
    onDragLeave: () => {
      leaves += 1;
    },
    onDrop: (event: DropTargetDropEvent) => fileDrops.push(event),
  };
  return [
    {
      key: 'places',
      label: 'Favourites',
      items: [
        {
          key: 'documents',
          label: 'Documents',
          draggable: true,
          drop: { ...drop, folder: 'file:///home/ana/Documents' },
        },
        { key: 'recents', label: 'Recents', draggable: true },
      ],
    },
    {
      key: 'saved',
      label: 'Saved',
      folders: [
        {
          key: 'work',
          label: 'Work',
          defaultOpen: true,
          items: [{ key: 'downloads', label: 'Downloads', drop }],
        },
      ],
    },
  ];
}

beforeEach(() => {
  treeDrops = [];
  fileDrops = [];
  leaves = 0;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Sidebar
          tree={tree()}
          onTreeItemDrop={(drop) => treeDrops.push(drop)}
          showThemeToggle={false}
        />
      </BloomThemeProvider>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function byTestId(id: string): HTMLElement {
  const node = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`no ${id}`);
  return node;
}

function byLabel(label: string): HTMLElement {
  const node = host.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  if (!node) throw new Error(`no ${label}`);
  return node;
}

/** jsdom has no DragEvent: an Event carrying what the listeners read. */
function fire(node: HTMLElement, type: string, types: string[], clientY = 15) {
  const data = new Map<string, string>([['text/uri-list', 'file:///home/ana/notes.txt\n']]);
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    clientX: 20,
    clientY,
    altKey: false,
    metaKey: false,
    dataTransfer: {
      types,
      items: [],
      files: [],
      effectAllowed: 'all',
      dropEffect: 'none',
      setData: (format: string, value: string) => data.set(format, value),
      getData: (format: string) => data.get(format) ?? '',
    },
  });
  act(() => {
    node.dispatchEvent(event);
  });
  return event;
}

/** A node 30px tall at the top of the page, so `clientY` is the place in it. */
function place(node: HTMLElement) {
  node.getBoundingClientRect = () =>
    ({ top: 0, height: 30, bottom: 30, left: 0, right: 200, width: 200, x: 0, y: 0 }) as DOMRect;
}

const FILES = ['text/uri-list'];
const lit = (node: HTMLElement) => node.style.backgroundColor;
const colorOf = (color: string) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
};

describe('Sidebar tree rows that take drops (web)', () => {
  it('lights a row under a drag of files, takes the drop and clears the light', () => {
    const row = byTestId('sidebar-tree-row-documents');
    expect(lit(row)).not.toBe(colorOf(palette.selected));
    const entered = fire(row, 'dragenter', FILES);
    expect(entered.defaultPrevented).toBe(true);
    expect(lit(row)).toBe(colorOf(palette.selected));
    fire(row, 'dragover', FILES);
    fire(row, 'drop', FILES);
    expect(fileDrops).toHaveLength(1);
    expect(fileDrops[0]?.data.files).toEqual([
      { name: 'notes.txt', uri: 'file:///home/ana/notes.txt' },
    ]);
    expect(treeDrops).toHaveLength(0);
    expect(lit(row)).not.toBe(colorOf(palette.selected));
  });

  it('clears the light when the drag leaves the row', () => {
    const row = byTestId('sidebar-tree-row-documents');
    fire(row, 'dragenter', FILES);
    fire(row, 'dragleave', FILES);
    expect(leaves).toBe(1);
    expect(lit(row)).not.toBe(colorOf(palette.selected));
  });

  it('lights a folder’s row the same way', () => {
    const row = byLabel('Downloads');
    fire(row, 'dragenter', FILES);
    expect(lit(row)).toBe(colorOf(palette.selected));
    fire(row, 'drop', FILES);
    expect(fileDrops).toHaveLength(1);
    expect(lit(row)).not.toBe(colorOf(palette.selected));
  });

  it('leaves the tree’s own row drags as they were', () => {
    const documents = byTestId('sidebar-tree-row-documents');
    place(documents);
    fire(byTestId('sidebar-tree-row-recents'), 'dragstart', [ROW_MIME]);
    fire(documents, 'dragenter', [ROW_MIME], 3);
    expect(lit(documents)).not.toBe(colorOf(palette.selected));
    expect(fire(documents, 'dragover', [ROW_MIME], 3).defaultPrevented).toBe(true);
    fire(documents, 'drop', [ROW_MIME], 3);
    expect(treeDrops).toHaveLength(1);
    expect(treeDrops[0]).toMatchObject({
      item: { key: 'recents' },
      target: { key: 'documents' },
      position: 'before',
    });
    expect(fileDrops).toHaveLength(0);
    // The zone counts the next drag from nothing: a drag of files still lights and leaves.
    fire(documents, 'dragenter', FILES);
    expect(lit(documents)).toBe(colorOf(palette.selected));
    fire(documents, 'dragleave', FILES);
    expect(lit(documents)).not.toBe(colorOf(palette.selected));
  });
});
