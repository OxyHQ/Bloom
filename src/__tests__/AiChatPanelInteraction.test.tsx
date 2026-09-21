/** @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { View } from 'react-native';
import { usePanelInteraction } from '../ai-chat/use-panel-interaction';
import { acquireOverlayRank, registerOverlayRank, releaseOverlayRank, resetOverlayStack } from '../overlay/stack';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
let opener: HTMLButtonElement;
function Harness({ open = true, modal = true, close }: { open?: boolean; modal?: boolean; close: () => void }) {
  const ref = usePanelInteraction(open, modal, close);
  return <View ref={ref}><button id="first">First</button><button disabled>Disabled</button><button id="last">Last</button><div style={{ display: 'none' }}><button>Hidden descendant</button></div></View>;
}
beforeEach(() => {
  resetOverlayStack();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  opener = document.createElement('button'); document.body.appendChild(opener); opener.focus();
});
afterEach(() => { act(() => root.unmount()); host.remove(); opener.remove(); resetOverlayStack(); });
function key(value: string, shiftKey = false) { act(() => { document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true })); }); }
it('moves focus inside, wraps both directions and restores the opener', () => {
  const close = jest.fn(); act(() => root.render(<Harness close={close} />));
  expect(document.activeElement?.id).toBe('first');
  key('Tab', true); expect(document.activeElement?.id).toBe('last');
  key('Tab'); expect(document.activeElement?.id).toBe('first');
  act(() => opener.focus()); expect(document.activeElement?.id).toBe('first');
  key('Escape'); expect(close).toHaveBeenCalledTimes(1);
  act(() => root.render(<Harness close={close} open={false} />)); expect(document.activeElement).toBe(opener);
});
it('desktop Escape closes without moving or trapping focus', () => {
  const close = jest.fn(); act(() => root.render(<Harness close={close} modal={false} />));
  expect(document.activeElement).toBe(opener); key('Escape'); expect(close).toHaveBeenCalledTimes(1);
});
it('yields focus and Escape to a live overlay and resumes after it closes', () => {
  const close = jest.fn(); act(() => root.render(<Harness close={close} />));
  const rank = acquireOverlayRank(); registerOverlayRank(rank);
  act(() => opener.focus()); expect(document.activeElement).toBe(opener);
  key('Escape'); expect(close).not.toHaveBeenCalled();
  releaseOverlayRank(rank); key('Escape'); expect(close).toHaveBeenCalledTimes(1);
});
it('does not double-close when an inner popup consumes Escape on document', () => {
  const close = jest.fn(); act(() => root.render(<Harness close={close} />));
  const inner = (event: KeyboardEvent) => event.stopPropagation();
  document.addEventListener('keydown', inner); key('Escape'); document.removeEventListener('keydown', inner);
  expect(close).not.toHaveBeenCalled(); key('Escape'); expect(close).toHaveBeenCalledTimes(1);
});
