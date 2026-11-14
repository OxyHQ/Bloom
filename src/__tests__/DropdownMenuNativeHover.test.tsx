/**
 * The native `DropdownMenu` with `activation="hover"` in a platform's popup (a desktop with a
 * pointer, OxyOS): the pointer resting on the trigger opens it after `openDelay`; leaving the
 * trigger and the panel closes it after `closeDelay` unless it comes back; a key used in the
 * panel keeps it open; the popup goes on tracking the trigger; a touch, or a phone's sheet,
 * never opens it by hover. The trigger's own press is unchanged.
 */
import { Pressable, Text, View } from 'react-native';
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

function adapter(): PlatformSurfaceAdapter {
  return {
    platform: 'test',
    capabilities: new Set(['popup-surface']),
    PopupSurface: (props) => {
      last = props;
      return <View testID="platform-popup">{props.children}</View>;
    },
  };
}

const mouse = { nativeEvent: { pointerType: 'mouse' } };
const touch = { nativeEvent: { pointerType: 'touch' } };

function draw(platform: PlatformSurfaceAdapter | undefined, zoom = jest.fn()) {
  const onOpenChange = jest.fn();
  const fill = jest.fn();
  const screen = render(
    <BloomProvider mode="light" platform={platform}>
      <DropdownMenu activation="hover" openDelay={500} closeDelay={150} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Pressable testID="zoom" accessibilityLabel="Zoom" onPress={zoom}>
            <Text>Zoom</Text>
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent label="Window layouts" testID="layouts">
          <DropdownMenuItem onPress={fill}>Fill</DropdownMenuItem>
          <DropdownMenuItem onPress={() => undefined}>Center</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BloomProvider>,
  );
  const wrapper = () => {
    const control = screen.getByTestId('zoom');
    return control.parent?.parent ?? control;
  };
  /** The panel's surface: the popup's content, where the pointer comes onto it. */
  const panel = () => {
    const surface = screen.getByTestId('platform-popup').children[0];
    if (typeof surface === 'string' || !surface) throw new Error('no panel');
    return surface;
  };
  return { screen, onOpenChange, fill, zoom, wrapper, panel };
}

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
  last = null;
});
afterEach(() => {
  jest.useRealTimers();
});

it('opens as the pointer rests on the trigger for openDelay, and tracks the trigger while open', () => {
  const { screen, wrapper } = draw(adapter());
  fireEvent(wrapper(), 'pointerEnter', mouse);
  advance(499);
  expect(screen.queryByText('Fill')).toBeNull();
  advance(1);
  expect(screen.getByText('Fill')).toBeTruthy();
  expect(last?.role).toBe('menu');
  expect(last?.label).toBe('Window layouts');
  expect(last?.trackingRef).toBe(last?.anchorRef);
});

it('opens nothing when the pointer only passes over the trigger', () => {
  const { screen, wrapper, onOpenChange } = draw(adapter());
  fireEvent(wrapper(), 'pointerEnter', mouse);
  advance(200);
  fireEvent(wrapper(), 'pointerLeave', mouse);
  advance(1000);
  expect(screen.queryByText('Fill')).toBeNull();
  expect(onOpenChange).not.toHaveBeenCalled();
});

it('stays open while the pointer crosses onto the panel, and closes once it leaves both', () => {
  const { screen, wrapper, panel } = draw(adapter());
  fireEvent(wrapper(), 'pointerEnter', mouse);
  advance(500);
  fireEvent(wrapper(), 'pointerLeave', mouse);
  advance(100);
  fireEvent(panel(), 'pointerEnter', mouse);
  advance(1000);
  expect(screen.getByText('Fill')).toBeTruthy();
  fireEvent(panel(), 'pointerLeave', mouse);
  advance(149);
  expect(screen.getByText('Fill')).toBeTruthy();
  advance(1);
  expect(screen.queryByText('Fill')).toBeNull();
});

it('stays open once a key is used in the panel, the pointer gone', () => {
  const { screen, wrapper } = draw(adapter());
  fireEvent(wrapper(), 'pointerEnter', mouse);
  advance(500);
  act(() => last?.onKey?.('ArrowDown'));
  fireEvent(wrapper(), 'pointerLeave', mouse);
  advance(1000);
  expect(screen.getByText('Fill')).toBeTruthy();
});

it('runs a row chosen from it and closes', () => {
  const { screen, wrapper, fill } = draw(adapter());
  fireEvent(wrapper(), 'pointerEnter', mouse);
  advance(500);
  fireEvent.press(screen.getByText('Fill'));
  advance(500);
  expect(fill).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Fill')).toBeNull();
});

it("keeps the trigger's own press, and a long press still opens it", () => {
  const { screen, zoom } = draw(adapter());
  fireEvent.press(screen.getByTestId('zoom'));
  expect(zoom).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Fill')).toBeNull();
  act(() => {
    fireEvent(screen.getByTestId('zoom'), 'longPress');
  });
  expect(screen.getByText('Fill')).toBeTruthy();
});

it('a menu opened by a long press does not close as the pointer leaves', () => {
  const { screen, wrapper } = draw(adapter());
  act(() => {
    fireEvent(screen.getByTestId('zoom'), 'longPress');
  });
  fireEvent(wrapper(), 'pointerLeave', mouse);
  advance(1000);
  expect(screen.getByText('Fill')).toBeTruthy();
});

it('never opens by a touch resting, nor by hover where it is a phone’s sheet', () => {
  const popup = draw(adapter());
  fireEvent(popup.wrapper(), 'pointerEnter', touch);
  advance(1000);
  expect(popup.screen.queryByText('Fill')).toBeNull();
  popup.screen.unmount();

  const sheet = draw(undefined);
  fireEvent(sheet.wrapper(), 'pointerEnter', mouse);
  advance(1000);
  expect(sheet.onOpenChange).not.toHaveBeenCalled();
});
