/**
 * SKETCH (not built or tested; awaiting the coordinator's decision on the protocol).
 *
 * The zoom control's layouts, as a Mac's green button shows them since macOS 15: the pointer
 * resting on it, or a long press, opens a menu of where the window can go (Fill, Center, the
 * halves, the quarters, the arrangements, Return to Previous Size) and, where the platform has
 * desktops, Move to each other one. The control's own press still zooms. Bloom's menu, so its
 * rows are keyboard-driven (arrows, typeahead, Return) and each is announced by its name.
 *
 * Shown only where the platform lays windows out (`PlatformWindow.layOut`).
 */
import type React from 'react';

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
import { WINDOW_MESSAGES, type WindowMessages } from './messages';
import { useWindow } from './use-window';

/** How long the pointer rests on the control before its layouts show, as a Mac's. */
const LAYOUTS_DWELL_MS = 500;

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
const ARRANGE: readonly PlatformWindowLayout[] = [
  'leftRight',
  'rightLeft',
  'topBottom',
  'bottomTop',
  'quarters',
];

const nameOf = (messages: WindowMessages, layout: PlatformWindowLayout) => messages[layout];

/** `children` (the zoom control) with the window's layouts on hover and long press. */
export function WindowLayouts({ children }: { children: React.ReactElement }) {
  const appWindow = useWindow();
  const { messages } = useMessages(WINDOW_MESSAGES);
  const layOut = appWindow?.layOut;
  if (!layOut) return children;
  const desktops = appWindow.desktops;
  const moveToDesktop = appWindow.moveToDesktop;
  const others =
    desktops && moveToDesktop
      ? Array.from({ length: desktops.count }, (_, index) => index).filter(
          (index) => index !== desktops.current,
        )
      : [];
  const row = (layout: PlatformWindowLayout) => (
    <DropdownMenuItem key={layout} onPress={() => layOut(layout)}>
      {nameOf(messages, layout)}
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu activation="hover" openDelay={LAYOUTS_DWELL_MS}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent label={messages.layouts}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{messages.moveAndResize}</DropdownMenuLabel>
          {MOVE_AND_RESIZE.map(row)}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{messages.fillAndArrange}</DropdownMenuLabel>
          {row('fill')}
          {row('center')}
          {ARRANGE.map(row)}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {row('returnToPrevious')}
        {others.length > 0 ? <DropdownMenuSeparator /> : null}
        {others.map((desktop) => (
          <DropdownMenuItem key={`desktop-${desktop}`} onPress={() => moveToDesktop?.(desktop)}>
            {messages.moveToDesktop(desktop + 1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
