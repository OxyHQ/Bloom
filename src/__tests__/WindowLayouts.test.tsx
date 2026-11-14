/**
 * The zoom control's layouts (`WindowLayouts`, the `window-layout` capability), as a Mac's green
 * button shows them: its long press, the pointer resting on it or the screen reader's "Show
 * menu" opens a menu of the window's layouts and the other desktops; a row lays the window out
 * (`PlatformWindow.layOut`) or moves it (`moveToDesktop`); the control's press still zooms.
 * Without the capability the control is as before.
 */
import { View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomProvider } from '../provider';
import type {
  PlatformSurfaceAdapter,
  PlatformWindowLayout,
  PlatformWindowState,
} from '../platform-surface/types';
import { WindowControls } from '../window';
// The adapter that reports `window-layout` registers the layouts so (OxyOS's does).
import '../window/layouts';
import { fakeWindow } from './support/fake-window';

function platform(
  options: { layouts?: boolean; state?: Partial<PlatformWindowState>; layOut?: boolean } = {},
) {
  const { window } = fakeWindow({ state: options.state });
  const layOut = jest.fn<void, [PlatformWindowLayout]>();
  const moveToDesktop = jest.fn<void, [number]>();
  const adapter: PlatformSurfaceAdapter = {
    platform: 'test',
    capabilities: new Set([
      'window',
      'popup-surface',
      ...(options.layouts === false ? [] : (['window-layout'] as const)),
    ]),
    window: {
      ...window,
      ...(options.layOut === false ? null : { layOut }),
      moveToDesktop,
    },
    PopupSurface: (props) => <View testID="popup">{props.children}</View>,
  };
  return { adapter, window, layOut, moveToDesktop };
}

async function draw(adapter: PlatformSurfaceAdapter) {
  const screen = render(
    <BloomProvider mode="light" platform={adapter}>
      <WindowControls testID="controls" />
    </BloomProvider>,
  );
  // The layouts' module, loaded as the controls mount (`window-layout` only).
  await act(async () => undefined);
  return screen;
}

/** The rows' labels, in the order the menu shows them. */
const ORDER = [
  'Left',
  'Right',
  'Top',
  'Bottom',
  'Top Left',
  'Top Right',
  'Bottom Left',
  'Bottom Right',
  'Fill',
  'Center',
  'Left & Right',
  'Right & Left',
  'Top & Bottom',
  'Bottom & Top',
  'Quarters',
  'Return to Previous Size',
];
const LAYOUTS: PlatformWindowLayout[] = [
  'left',
  'right',
  'top',
  'bottom',
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
  'fill',
  'center',
  'leftRight',
  'rightLeft',
  'topBottom',
  'bottomTop',
  'quarters',
  'returnToPrevious',
];

const open = (screen: Awaited<ReturnType<typeof draw>>) =>
  act(() => {
    fireEvent(screen.getByTestId('controls-zoom'), 'longPress');
  });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('opens on a long press: the halves, quarters, Fill, Center, the arrangements and Return', async () => {
  const { adapter } = platform();
  const screen = await draw(adapter);
  expect(screen.queryByText('Fill')).toBeNull();
  open(screen);
  expect(screen.getByTestId('popup')).toBeTruthy();
  expect(screen.getByText('Move & Resize')).toBeTruthy();
  expect(screen.getByText('Fill & Arrange')).toBeTruthy();
  const shown = ORDER.filter((label) => screen.queryByText(label) !== null);
  expect(shown).toEqual(ORDER);
  // In the menu's order on screen.
  const texts = screen
    .getByTestId('popup')
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => node.props.children as string)
    .filter((text) => ORDER.includes(text));
  expect([...new Set(texts)]).toEqual(ORDER);
});

it.each(LAYOUTS.map((layout, index) => [layout, ORDER[index]] as const))(
  'lays the window out: %s',
  async (layout, label) => {
    const { adapter, layOut, window } = platform();
    const screen = await draw(adapter);
    open(screen);
    fireEvent.press(screen.getByText(label as string));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(layOut.mock.calls).toEqual([[layout]]);
    expect(window.zoom).not.toHaveBeenCalled();
    expect(screen.queryByText('Fill')).toBeNull();
  },
);

it('moves the window to each other desktop, numbered as the person counts them', async () => {
  const { adapter, moveToDesktop } = platform({ state: { desktops: { count: 3, current: 1 } } });
  const screen = await draw(adapter);
  open(screen);
  expect(screen.getByText('Move to Desktop 1')).toBeTruthy();
  expect(screen.queryByText('Move to Desktop 2')).toBeNull();
  fireEvent.press(screen.getByText('Move to Desktop 3'));
  expect(moveToDesktop.mock.calls).toEqual([[2]]);
});

it('offers no desktop where the window is on the only one, or the platform has none', async () => {
  for (const state of [{ desktops: { count: 1, current: 0 } }, {}]) {
    const { adapter } = platform({ state });
    const screen = await draw(adapter);
    open(screen);
    expect(screen.queryByText(/Move to Desktop/)).toBeNull();
    screen.unmount();
  }
});

it("keeps the control's press: it zooms", async () => {
  const { adapter, window, layOut } = platform();
  const screen = await draw(adapter);
  fireEvent.press(screen.getByTestId('controls-zoom'));
  expect(window.zoom).toHaveBeenCalledTimes(1);
  expect(layOut).not.toHaveBeenCalled();
  expect(screen.queryByText('Fill')).toBeNull();
});

it('names its menu and its rows, and anchors at the zoom control’s place', async () => {
  const { adapter } = platform();
  const screen = await draw(adapter);
  const zoom = screen.getByTestId('controls-zoom');
  expect(zoom.props.accessibilityLabel).toBe('Zoom');
  open(screen);
  expect(screen.getByTestId('controls-layouts-fill')).toBeTruthy();
  expect(screen.getByTestId('controls-layouts-returnToPrevious')).toBeTruthy();
  // The trigger's box, where the platform anchors the menu, is the control's own place: the
  // nearest box placed above the control, the third of three 20 px targets across 56 px.
  const flat = (node: typeof zoom | null) =>
    [node?.props.style]
      .flat(4)
      .filter(Boolean)
      .reduce((all: Record<string, unknown>, one) => ({ ...all, ...one }), {});
  let box = zoom.parent;
  while (box && flat(box).position !== 'absolute') box = box.parent;
  expect(flat(box)).toMatchObject({ position: 'absolute', top: 0, insetInlineStart: 36 });
  expect(flat(zoom).position).toBeUndefined();
});

it('is the control as before without the capability', async () => {
  const { adapter, window } = platform({ layouts: false });
  const screen = await draw(adapter);
  act(() => {
    fireEvent(screen.getByTestId('controls-zoom'), 'longPress');
  });
  expect(screen.queryByText('Fill')).toBeNull();
  fireEvent.press(screen.getByTestId('controls-zoom'));
  expect(window.zoom).toHaveBeenCalledTimes(1);
});

it('throws for the capability without a layOut', async () => {
  const { adapter } = platform({ layOut: false });
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  await expect(draw(adapter)).rejects.toThrow(/window-layout/);
});

it('opens as the pointer rests on the zoom control for half a second', async () => {
  const { adapter } = platform();
  const screen = await draw(adapter);
  const zoom = screen.getByTestId('controls-zoom');
  let box = zoom.parent;
  while (box && !box.props.onPointerEnter) box = box.parent;
  if (!box) throw new Error('no hover target');
  fireEvent(box, 'pointerEnter', { nativeEvent: { pointerType: 'mouse' } });
  act(() => {
    jest.advanceTimersByTime(499);
  });
  expect(screen.queryByText('Fill')).toBeNull();
  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(screen.getByText('Fill')).toBeTruthy();
});

it('opens from the screen reader by the zoom control’s “Show menu” action', async () => {
  const { adapter } = platform();
  const screen = await draw(adapter);
  const zoom = screen.getByTestId('controls-zoom');
  expect(zoom.props.accessibilityActions).toEqual(
    expect.arrayContaining([{ name: 'longpress', label: 'Show menu' }]),
  );
  act(() => {
    zoom.props.onAccessibilityAction({ nativeEvent: { actionName: 'longpress' } });
  });
  expect(screen.getByText('Fill')).toBeTruthy();
});
