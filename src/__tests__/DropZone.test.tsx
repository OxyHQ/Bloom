/**
 * `DropZone` on native: the platform's drop target, with what it accepts and
 * its actions (its preferred one first), when the adapter reports
 * `drag-and-drop`; a plain view that takes nothing otherwise. And
 * `usePlatformDrag`, null without the capability.
 */
import type React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DropZone } from '../drop-zone';
import { offeredKinds, dropData, chosenAction, orderedActions, uriList } from '../drop-zone/shared';
import {
  PlatformSurfaceProvider,
  usePlatformDrag,
  usePlatformDropTarget,
} from '../platform-surface/context';
import type {
  PlatformDrag,
  PlatformDropTargetProps,
  PlatformSurfaceAdapter,
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
