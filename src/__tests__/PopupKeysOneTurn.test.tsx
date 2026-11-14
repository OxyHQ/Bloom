/**
 * A menu in a platform's popup takes each key from where the key before it left the highlight,
 * however many keys the platform delivers in one turn. OxyOS delivers the keys read in one
 * compositor turn together (a loaded machine, a person typing ahead): two ↓ before React has
 * rendered the first are two rows down, as on a Mac, not the same row twice. Found by OxyOS's
 * `window-layouts` scenario, where ↓ ↓ Return chose Left instead of Right.
 */
import { Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { BloomProvider } from '../provider';
import type { PlatformSurfaceAdapter, PopupSurfaceProps } from '../platform-surface/types';

let last: PopupSurfaceProps | null = null;

function PopupSurface(props: PopupSurfaceProps) {
  last = props;
  return <View testID="platform-popup">{props.children}</View>;
}

function adapter(): PlatformSurfaceAdapter {
  return { platform: 'test', capabilities: new Set(['popup-surface']), PopupSurface };
}

function draw() {
  const chosen: string[] = [];
  const screen = render(
    <BloomProvider mode="light" platform={adapter()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Text testID="trigger">Layouts</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent label="Window layouts">
          {['Left', 'Right', 'Top', 'Bottom'].map((name) => (
            <DropdownMenuItem key={name} onPress={() => chosen.push(name)}>
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </BloomProvider>,
  );
  fireEvent.press(screen.getByTestId('trigger'));
  return { screen, chosen };
}

beforeEach(() => {
  last = null;
});

it('moves two rows for two ↓ delivered in one turn, and Return chooses the second', () => {
  const { chosen } = draw();
  // Opened by a pointer: no row active, so the first ↓ lands on the first row.
  act(() => {
    last?.onKey?.('ArrowDown');
    last?.onKey?.('ArrowDown');
  });
  act(() => last?.onKey?.('Enter'));
  expect(chosen).toEqual(['Right']);
});

it('takes ↓ ↓ Return in one turn as the three keys they are', () => {
  const { chosen } = draw();
  act(() => {
    last?.onKey?.('ArrowDown');
    last?.onKey?.('ArrowDown');
    last?.onKey?.('Enter');
  });
  expect(chosen).toEqual(['Right']);
});

it('moves back with ↑ from where ↓ left it in the same turn', () => {
  const { chosen } = draw();
  act(() => {
    last?.onKey?.('ArrowDown');
    last?.onKey?.('ArrowDown');
    last?.onKey?.('ArrowDown');
    last?.onKey?.('ArrowUp');
  });
  act(() => last?.onKey?.('Enter'));
  expect(chosen).toEqual(['Right']);
});
