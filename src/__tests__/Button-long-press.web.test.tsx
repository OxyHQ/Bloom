/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: {
    backgroundSecondary: '#eeeeee', backgroundTertiary: '#dddddd', textTertiary: '#888888', border: '#999999', card: '#ffffff', background: '#ffffff', text: '#17251e', textSecondary: '#65716a',
    primary: '#166534', primaryForeground: '#ffffff', negative: '#991b1b', negativeForeground: '#ffffff',
    primarySubtle: 'rgba(22,101,52,0.13)', primarySubtleForeground: '#14532d',
  } }),
}));
import { Button } from '../button/Button.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { jest.useFakeTimers(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
function pointer(target: Element | Document, type: string, fields: Record<string, unknown> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { button: 0, pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 5, clientY: 5, ...fields });
  act(() => { target.dispatchEvent(event); });
}
it('holds, forwards its original pointer event, and suppresses the release click', () => {
  const hold = jest.fn(); const press = jest.fn(); const parent = jest.fn();
  act(() => root.render(<div onClick={parent}><Button onLongPress={hold} onPress={press}>Hold</Button></div>));
  const button = container.querySelector('button')!;
  pointer(button, 'pointerdown');
  act(() => jest.advanceTimersByTime(449)); expect(hold).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1)); expect(hold).toHaveBeenCalledTimes(1);
  expect(hold.mock.calls[0][0].nativeEvent.pointerType).toBe('touch');
  pointer(document, 'pointerup');
  act(() => { button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); });
  expect(press).not.toHaveBeenCalled(); expect(parent).not.toHaveBeenCalled();
  act(() => button.click()); expect(press).toHaveBeenCalledTimes(1);
});
it.each(['pointerup', 'pointercancel', 'move', 'scroll', 'disabled', 'unmount'])('cancels a pending hold on %s', reason => {
  const hold = jest.fn();
  act(() => root.render(<Button onLongPress={hold}>Hold</Button>));
  pointer(container.querySelector('button')!, 'pointerdown');
  if (reason === 'move') pointer(document, 'pointermove', { clientX: 20 });
  else if (reason === 'disabled') act(() => root.render(<Button disabled onLongPress={hold}>Hold</Button>));
  else if (reason === 'unmount') act(() => root.render(null));
  else act(() => document.dispatchEvent(new Event(reason, { bubbles: true })));
  // Pointer IDs identify which pointer released/cancelled.
  if (reason === 'pointerup' || reason === 'pointercancel') pointer(document, reason);
  act(() => jest.advanceTimersByTime(500)); expect(hold).not.toHaveBeenCalled();
});
it('composes asChild handlers and preserves a short anchor tap', () => {
  const hold = jest.fn(); const press = jest.fn(); const child = jest.fn();
  act(() => root.render(<Button asChild onLongPress={hold} onPress={press}><a onClick={child}>Link</a></Button>));
  const anchor = container.querySelector('a')!;
  pointer(anchor, 'pointerdown'); pointer(document, 'pointerup');
  act(() => { anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); });
  expect(child).toHaveBeenCalledTimes(1); expect(press).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(500)); expect(hold).not.toHaveBeenCalled();
});

it.each(['pointerup', 'pointercancel', 'leave', 'blur', 'disabled', 'loading'])('balances preview once on %s without activating', reason => {
  const pressIn = jest.fn(), pressOut = jest.fn(), press = jest.fn();
  const ui = (disabled=false, loading=false) => <Button disabled={disabled} loading={loading} onPressIn={pressIn} onPressOut={pressOut} onPress={press}>Preview</Button>;
  act(() => root.render(ui()));
  const button = container.querySelector('button')!;
  pointer(button, 'pointerdown'); expect(pressIn).toHaveBeenCalledTimes(1);
  if (reason === 'disabled' || reason === 'loading') act(() => root.render(ui(reason === 'disabled', reason === 'loading')));
  else if (reason === 'leave') pointer(button, 'pointerout', { relatedTarget: document.body });
  else if (reason === 'blur') act(() => window.dispatchEvent(new Event('blur')));
  else pointer(document, reason);
  pointer(document, 'pointerup');
  expect(pressOut).toHaveBeenCalledTimes(1); expect(press).not.toHaveBeenCalled();
});
it.each([' ', 'Enter'])('previews keyboard %s without repeat duplication or synthetic activation', key => {
  const pressIn = jest.fn(), pressOut = jest.fn(), press = jest.fn();
  act(() => root.render(<Button onPressIn={pressIn} onPressOut={pressOut} onPress={press}>Preview</Button>));
  const button = container.querySelector('button')!;
  act(() => { button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles:true })); button.dispatchEvent(new KeyboardEvent('keydown', { key, repeat:true, bubbles:true })); });
  expect(pressIn).toHaveBeenCalledTimes(1);
  act(() => button.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles:true })));
  expect(pressOut).toHaveBeenCalledTimes(1); expect(press).not.toHaveBeenCalled();
});
it('does not end a preview when its long-press timer fires', () => {
  const pressOut = jest.fn(), hold = jest.fn();
  act(() => root.render(<Button onPressOut={pressOut} onLongPress={hold}>Hold</Button>));
  pointer(container.querySelector('button')!, 'pointerdown'); act(() => jest.advanceTimersByTime(450));
  expect(hold).toHaveBeenCalledTimes(1); expect(pressOut).not.toHaveBeenCalled();
  pointer(document, 'pointerup'); expect(pressOut).toHaveBeenCalledTimes(1);
});
