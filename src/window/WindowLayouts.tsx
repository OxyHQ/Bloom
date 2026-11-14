/**
 * The zoom control's layouts, as a Mac's green button shows them since macOS 15: the pointer
 * resting on it, a long press, or the screen reader's "Show menu" action on it opens a menu of
 * where the window can go (Move & Resize: the halves and the quarters; Fill & Arrange: Fill,
 * Center and the arrangements of the window with those behind it; Return to Previous Size) and,
 * where the platform has desktops, Move to each other one. The control's own press still zooms.
 *
 * Bloom's `DropdownMenu` (`activation="hover"`): its rows take the arrows, typeahead and Return
 * as any menu's, each named by its label, the menu by its own ("Window layouts").
 *
 * Shown only where the platform lays windows out (the `window-layout` capability) and its adapter
 * imported `@oxy.so/bloom/window/layouts`, which registers it (`layouts-registry.ts`); the
 * platform does it (`PlatformWindow.layOut`, `moveToDesktop`).
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { useMessages } from '../locale/messages';
import type { PlatformWindowLayout } from '../platform-surface/types';
import { WINDOW_MESSAGES } from './messages';
import type { WindowLayoutsProps } from './types';
import { useWindow } from './use-window';

/** How long the pointer rests on the zoom control before its layouts show. */
export const WINDOW_LAYOUTS_OPEN_DELAY = 500;

/** Move & Resize: the halves, then the quarters, as a Mac's menu orders them. */
const MOVE_AND_RESIZE: readonly PlatformWindowLayout[] = [
  'left',
  'right',
  'top',
  'bottom',
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
];
/** Fill & Arrange: Fill and Center, then the arrangements with the windows behind. */
const FILL_AND_ARRANGE: readonly PlatformWindowLayout[] = [
  'fill',
  'center',
  'leftRight',
  'rightLeft',
  'topBottom',
  'bottomTop',
  'quarters',
];

/** `children` (the zoom control) with the window's layouts on hover, long press and "Show menu". */
export function WindowLayouts({ children, style, testID }: WindowLayoutsProps) {
  const appWindow = useWindow();
  const { messages } = useMessages(WINDOW_MESSAGES);
  const layOut = appWindow?.layOut;
  if (!layOut) return children;
  const { desktops, moveToDesktop } = appWindow;
  const others =
    desktops && moveToDesktop
      ? Array.from({ length: desktops.count }, (_, index) => index).filter(
          (index) => index !== desktops.current,
        )
      : [];
  const row = (layout: PlatformWindowLayout) => (
    <DropdownMenuItem
      key={layout}
      testID={testID ? `${testID}-${layout}` : undefined}
      onPress={() => layOut(layout)}
    >
      {messages[layout]}
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu activation="hover" openDelay={WINDOW_LAYOUTS_OPEN_DELAY}>
      <DropdownMenuTrigger asChild style={style}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent label={messages.layouts} testID={testID}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{messages.moveAndResize}</DropdownMenuLabel>
          {MOVE_AND_RESIZE.map(row)}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{messages.fillAndArrange}</DropdownMenuLabel>
          {FILL_AND_ARRANGE.map(row)}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {row('returnToPrevious')}
        {others.length > 0 ? <DropdownMenuSeparator /> : null}
        {others.map((desktop) => (
          <DropdownMenuItem
            key={`desktop-${desktop}`}
            testID={testID ? `${testID}-desktop-${desktop + 1}` : undefined}
            onPress={() => moveToDesktop?.(desktop)}
          >
            {messages.moveToDesktop(desktop + 1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
