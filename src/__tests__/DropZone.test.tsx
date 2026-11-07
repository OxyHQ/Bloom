/**
 * `DropZone` on native: the platform's drop target, with what it accepts and
 * its actions (its preferred one first), when the adapter reports
 * `drag-and-drop`; a plain view that takes nothing otherwise. And
 * `usePlatformDrag`, null without the capability.
 */
import type React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';

import { act } from 'react';

import { DropZone, useWindowDrag } from '../drop-zone';
import {
  offeredKinds,
  dropData,
  chosenAction,
  orderedActions,
  takesFileTypes,
  uriList,
} from '../drop-zone/shared';
import {
  PlatformSurfaceProvider,
  usePlatformDrag,
  usePlatformDropTarget,
} from '../platform-surface/context';
import type {
  DragCancelReason,
  PlatformDrag,
  PlatformDragRequest,
  PlatformDropTargetProps,
  PlatformSurfaceAdapter,
  PlatformWindowDragEvent,
} from '../platform-surface/types';

const received: PlatformDropTargetProps[] = [];
function DropTarget(props: PlatformDropTargetProps) {
  received.push(props);
  return <>{props.children}</>;
}
const drag: PlatformDrag = { start: async () => 'copy' };
const ADAPTER: PlatformSurfaceAdapter = {
  platform: 'test',
  capabilities: new Set(['drag-and-drop']),
  DropTarget,
  drag,
};

function on(adapter: PlatformSurfaceAdapter | null) {
  return ({ children }: { children: React.ReactNode }) => (
    <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>
  );
}

beforeEach(() => {
  received.length = 0;
});

describe('DropZone (native)', () => {
  it('is the platform’s drop target, its preferred action first', () => {
    const onDrop = jest.fn();
    const { getByText } = render(
      <DropZone
        accept={['files']}
        actions={['copy', 'move']}
        preferredAction="move"
        onDrop={onDrop}
      >
        <Text>Papelera</Text>
      </DropZone>,
      { wrapper: on(ADAPTER) },
    );
    expect(getByText('Papelera')).toBeTruthy();
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ accept: ['files'], actions: ['move', 'copy'], onDrop });
  });

  it('hands the platform the file types it takes', () => {
    render(
      <DropZone
        accept={['files']}
        acceptFileTypes={['image/*', 'application/pdf']}
        onDrop={() => {}}
      >
        <Text>Vista previa</Text>
      </DropZone>,
      { wrapper: on(ADAPTER) },
    );
    expect(received[0]).toMatchObject({ acceptFileTypes: ['image/*', 'application/pdf'] });
  });

  it('hands the platform the folder files dropped on it go into', () => {
    render(
      <DropZone
        accept={['files']}
        actions={['move', 'copy']}
        folder="file:///home/ana/Documents"
        onDrop={() => {}}
      >
        <Text>Documentos</Text>
      </DropZone>,
      { wrapper: on(ADAPTER) },
    );
    expect(received[0]).toMatchObject({
      folder: 'file:///home/ana/Documents',
      actions: ['move', 'copy'],
    });
  });

  it('is a view that takes nothing without the capability', () => {
    const { getByText } = render(
      <DropZone accept={['files']} onDrop={() => {}}>
        <Text>Sin plataforma</Text>
      </DropZone>,
      { wrapper: on({ platform: 'phone', capabilities: new Set() }) },
    );
    expect(getByText('Sin plataforma')).toBeTruthy();
    expect(received).toHaveLength(0);
  });

  it('usePlatformDrag is the adapter’s drag with the capability, null without it', () => {
    expect(renderHook(() => usePlatformDrag(), { wrapper: on(ADAPTER) }).result.current).toBe(drag);
    expect(renderHook(() => usePlatformDrag()).result.current).toBeNull();
  });

  it('hands the adapter an application dragged, its vanishing and why it dropped nothing', async () => {
    const requests: PlatformDragRequest[] = [];
    const adapter: PlatformSurfaceAdapter = {
      ...ADAPTER,
      drag: {
        start: async (request) => {
          requests.push(request);
          request.onCancel?.('not-accepted');
          return null;
        },
      },
    };
    const platformDrag = renderHook(() => usePlatformDrag(), { wrapper: on(adapter) }).result
      .current;
    const reasons: DragCancelReason[] = [];
    const action = await platformDrag?.start({
      data: { other: { 'application/x-oxyos-application': 'so.oxy.inbox' } },
      actions: ['move'],
      vanish: true,
      onCancel: (reason) => reasons.push(reason),
    });
    expect(action).toBeNull();
    expect(requests[0]).toMatchObject({
      data: { other: { 'application/x-oxyos-application': 'so.oxy.inbox' } },
      vanish: true,
    });
    expect(reasons).toEqual(['not-accepted']);
  });

  it('an adapter reporting drag-and-drop without its parts throws', () => {
    const broken: PlatformSurfaceAdapter = {
      platform: 'broken',
      capabilities: new Set(['drag-and-drop']),
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePlatformDropTarget(), { wrapper: on(broken) })).toThrow(
      /reports 'drag-and-drop' without a DropTarget and a drag/,
    );
  });
});

describe('useWindowDrag (native)', () => {
  function watched() {
    const listeners = new Set<(event: PlatformWindowDragEvent) => void>();
    const adapter: PlatformSurfaceAdapter = {
      ...ADAPTER,
      drag: {
        start: async () => null,
        watchWindow: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
    };
    const tell = (event: PlatformWindowDragEvent) =>
      act(() => {
        for (const listener of listeners) listener(event);
      });
    return { adapter, listeners, tell };
  }

  it('follows the platform’s drags over the window, with the latest handlers', () => {
    const { adapter, listeners, tell } = watched();
    const told: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ tag }: { tag: string }) =>
        useWindowDrag({
          onEnter: () => told.push(`${tag} enter`),
          onExit: (dropped) => told.push(`${tag} exit ${dropped}`),
        }),
      { wrapper: on(adapter), initialProps: { tag: 'a' } },
    );
    expect(listeners.size).toBe(1);
    tell({ type: 'enter' });
    tell({ type: 'exit', dropped: false });
    // New handlers each render, not memoised: the window is watched once, the latest told.
    rerender({ tag: 'b' });
    expect(listeners.size).toBe(1);
    tell({ type: 'enter' });
    tell({ type: 'exit', dropped: true });
    expect(told).toEqual(['a enter', 'a exit false', 'b enter', 'b exit true']);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('tells nothing without a platform drag or without its watchWindow', () => {
    const onEnter = jest.fn();
    expect(() => renderHook(() => useWindowDrag({ onEnter }))).not.toThrow();
    expect(() =>
      renderHook(() => useWindowDrag({ onEnter }), { wrapper: on(ADAPTER) }),
    ).not.toThrow();
    expect(onEnter).not.toHaveBeenCalled();
  });
});

describe('the drop’s content and action', () => {
  it('reads the kinds a drag offers and the content of those accepted', () => {
    expect(offeredKinds(['files', 'text'], ['text/uri-list', 'text/html'])).toEqual(['files']);
    expect(offeredKinds(['image/png', 'html'], ['IMAGE/PNG', 'text/html'])).toEqual([
      'image/png',
      'html',
    ]);
    expect(uriList('# a comment\r\nfile:///home/ana/a%20b.txt\r\nhttps://oxy.so\n')).toEqual([
      'file:///home/ana/a%20b.txt',
      'https://oxy.so',
    ]);
    expect(
      dropData(['files', 'url', 'text'], {
        'text/uri-list': 'file:///home/ana/a%20b.txt\nhttps://oxy.so\n',
        'text/plain;charset=utf-8': 'hola',
        'text/html': '<b>no</b>',
      }),
    ).toEqual({
      files: [{ name: 'a b.txt', uri: 'file:///home/ana/a%20b.txt' }],
      urls: ['https://oxy.so'],
      text: 'hola',
      other: {},
    });
  });

  it('takes files only of the types it names, when it names them', () => {
    // Absent: any files, even of no declared type.
    expect(takesFileTypes(undefined, [])).toBe(true);
    expect(takesFileTypes(undefined, ['image/png'])).toBe(true);
    // Every file must be of a type named, exactly or by its group; case and parameters ignored.
    expect(takesFileTypes(['image/*', 'application/pdf'], ['IMAGE/PNG', 'application/pdf'])).toBe(
      true,
    );
    expect(takesFileTypes(['text/plain'], ['text/plain; charset=utf-8'])).toBe(true);
    expect(takesFileTypes(['image/*'], ['image/png', 'text/plain'])).toBe(false);
    // Files whose types the source does not declare are not taken by a target that names some.
    expect(takesFileTypes(['image/*'], [])).toBe(false);
    expect(
      offeredKinds(
        ['files'],
        ['text/uri-list', 'application/x-oxyos-files'],
        ['text/markdown'],
        ['text/markdown'],
      ),
    ).toEqual(['files']);
    expect(
      offeredKinds(['files', 'text'], ['text/uri-list', 'text/plain'], ['image/png'], ['text/*']),
    ).toEqual(['text']);
  });

  it('chooses the action as a Mac does', () => {
    expect(orderedActions(undefined, undefined)).toEqual(['copy']);
    expect(chosenAction(['move', 'copy'], ['copy', 'move', 'link'])).toBe('move');
    expect(chosenAction(['move', 'copy'], ['copy'])).toBe('copy');
    expect(chosenAction(['move', 'copy'], ['copy', 'move'], { altKey: true })).toBe('copy');
    expect(chosenAction(['move', 'copy'], ['copy', 'move'], { metaKey: true })).toBe('move');
    expect(
      chosenAction(['move', 'copy'], ['copy', 'move'], { altKey: true, metaKey: true }),
    ).toBeNull();
  });
});
