/**
 * A sidebar tree row's `drop` on native: the row is the platform's drop target
 * (its accepted kinds, actions and `folder` handed to the adapter), lit with
 * the accent while a drag it would take is over it, as Finder lights a sidebar
 * place, and cleared when the drag leaves or drops. In a section and in a
 * folder alike; a row without `drop` is no drop target.
 */
import { act, render } from '@testing-library/react-native';

import { PlatformSurfaceProvider } from '../platform-surface/context';
import type {
  DropTargetDragEvent,
  PlatformDropTargetProps,
  PlatformSurfaceAdapter,
} from '../platform-surface/types';
import { Sidebar, type SidebarTree } from '../sidebar';
import { resolveSidebarPalette } from '../sidebar/palette';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { resolvedStyle } from './support/rendered-style';

const targets = new Map<string, PlatformDropTargetProps>();
function DropTarget(props: PlatformDropTargetProps) {
  targets.set(props.folder ?? '', props);
  return <>{props.children}</>;
}
const ADAPTER: PlatformSurfaceAdapter = {
  platform: 'test',
  capabilities: new Set(['drag-and-drop']),
  DropTarget,
  drag: { start: async () => null },
};

const DOCUMENTS = 'file:///home/ana/Documents';
const DOWNLOADS = 'file:///home/ana/Downloads';
const palette = resolveSidebarPalette(buildTheme('teal', 'light'));

function sections(onDrop: jest.Mock, onDragLeave = jest.fn()): SidebarTree[] {
  return [
    {
      key: 'places',
      label: 'Favourites',
      items: [
        {
          key: 'documents',
          label: 'Documents',
          drop: {
            accept: ['files'],
            actions: ['move', 'copy'],
            folder: DOCUMENTS,
            onDragLeave,
            onDrop,
          },
        },
        { key: 'recents', label: 'Recents' },
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
          items: [
            {
              key: 'downloads',
              label: 'Downloads',
              drop: { accept: ['files'], actions: ['move', 'copy'], folder: DOWNLOADS, onDrop },
            },
          ],
        },
      ],
    },
  ];
}

function mount(tree: SidebarTree[]) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={ADAPTER}>
        <Sidebar tree={tree} showThemeToggle={false} />
      </PlatformSurfaceProvider>
    </BloomThemeProvider>,
  );
}

function target(folder: string): PlatformDropTargetProps {
  const props = targets.get(folder);
  if (!props) throw new Error(`no drop target for ${folder}`);
  return props;
}

const over = (action: DropTargetDragEvent['action']): DropTargetDragEvent => ({
  x: 4,
  y: 4,
  action,
  kinds: ['files'],
  fileTypes: [],
});

const labelColor = (screen: ReturnType<typeof mount>, text: string) =>
  resolvedStyle(screen.getByText(text).props.style).color;

beforeEach(() => targets.clear());

describe('Sidebar tree rows that take drops (native)', () => {
  it('makes a row with `drop` the platform’s drop target, and no other row', () => {
    mount(sections(jest.fn()));
    expect(target(DOCUMENTS)).toMatchObject({ accept: ['files'], actions: ['move', 'copy'] });
    expect(target(DOWNLOADS)).toMatchObject({ accept: ['files'], folder: DOWNLOADS });
    expect([...targets.keys()].sort()).toEqual([DOCUMENTS, DOWNLOADS]);
  });

  it('lights a section row with the accent while a drag it would take is over it', () => {
    const onDrop = jest.fn();
    const onDragLeave = jest.fn();
    const screen = mount(sections(onDrop, onDragLeave));
    const row = () => resolvedStyle(screen.getByTestId('sidebar-tree-row-documents').props.style);
    expect(row().backgroundColor).toBe('transparent');
    expect(labelColor(screen, 'Documents')).toBe(palette.textSecondary);

    act(() => target(DOCUMENTS).onDragEnter?.(over('move')));
    expect(row().backgroundColor).toBe(palette.selected);
    expect(labelColor(screen, 'Documents')).toBe(palette.selectedForeground);
    // A modifier that makes the drag drop nothing puts the light out.
    act(() => target(DOCUMENTS).onDragOver?.(over(null)));
    expect(row().backgroundColor).toBe('transparent');
    act(() => target(DOCUMENTS).onDragOver?.(over('copy')));
    expect(row().backgroundColor).toBe(palette.selected);

    act(() => target(DOCUMENTS).onDragLeave?.());
    expect(row().backgroundColor).toBe('transparent');
    expect(onDragLeave).toHaveBeenCalledTimes(1);

    act(() => target(DOCUMENTS).onDragEnter?.(over('move')));
    const drop = {
      ...over('move'),
      action: 'move' as const,
      data: { files: [], urls: [], other: {} },
    };
    act(() => target(DOCUMENTS).onDrop(drop));
    expect(row().backgroundColor).toBe('transparent');
    expect(labelColor(screen, 'Documents')).toBe(palette.textSecondary);
    expect(onDrop).toHaveBeenCalledWith(drop);
  });

  it('lights a folder’s row the same way', () => {
    const screen = mount(sections(jest.fn()));
    const row = () => resolvedStyle(screen.getByLabelText('Downloads').props.style);
    act(() => target(DOWNLOADS).onDragEnter?.(over('copy')));
    expect(row().backgroundColor).toBe(palette.selected);
    expect(labelColor(screen, 'Downloads')).toBe(palette.selectedForeground);
    act(() => target(DOWNLOADS).onDragLeave?.());
    expect(row().backgroundColor).toBe('transparent');
  });

  it('puts the light out when the row stops taking drops', () => {
    const onDrop = jest.fn();
    const screen = mount(sections(onDrop));
    act(() => target(DOCUMENTS).onDragEnter?.(over('move')));
    const [places, saved] = sections(onDrop);
    const documents = places?.items?.[0];
    if (!places || !saved || !documents?.drop) throw new Error('no Documents row');
    const disabled: SidebarTree[] = [
      { ...places, items: [{ ...documents, drop: { ...documents.drop, disabled: true } }] },
      saved,
    ];
    screen.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PlatformSurfaceProvider value={ADAPTER}>
          <Sidebar tree={disabled} showThemeToggle={false} />
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
    );
    expect(
      resolvedStyle(screen.getByTestId('sidebar-tree-row-documents').props.style).backgroundColor,
    ).toBe('transparent');
  });
});
