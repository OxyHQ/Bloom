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

it.each(['button', 'href', 'asChild'] as const)('forwards %s focus and keyboard events without replacing preview cleanup', mode => {
  const focus = jest.fn(), blur = jest.fn(), down = jest.fn(), up = jest.fn();
  const childFocus = jest.fn(), childBlur = jest.fn(), childDown = jest.fn(), childUp = jest.fn();
  const pressIn = jest.fn(), pressOut = jest.fn();
  act(() => root.render(<Button href={mode === 'href' ? '#destination' : undefined} asChild={mode === 'asChild'}
    onFocus={focus} onBlur={blur} onKeyDown={down} onKeyUp={up} onPressIn={pressIn} onPressOut={pressOut}>
    {mode === 'asChild' ? <a href="#destination" onFocus={childFocus} onBlur={childBlur} onKeyDown={childDown} onKeyUp={childUp}>Choice</a> : 'Choice'}
  </Button>));
  const host = container.querySelector('button, a') as HTMLElement;
  act(() => host.focus());
  expect(focus).toHaveBeenCalledTimes(1);
  act(() => host.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
  expect(down).toHaveBeenCalledTimes(1); expect(pressIn).toHaveBeenCalledTimes(1);
  act(() => host.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true })));
  expect(up).toHaveBeenCalledTimes(1); expect(pressOut).toHaveBeenCalledTimes(1);
  act(() => host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  act(() => host.blur());
  expect(blur).toHaveBeenCalledTimes(1); expect(pressOut).toHaveBeenCalledTimes(2);
  if (mode === 'asChild') {
    expect(childFocus).toHaveBeenCalledTimes(1); expect(childBlur).toHaveBeenCalledTimes(1);
    expect(childDown).toHaveBeenCalledTimes(2); expect(childUp).toHaveBeenCalledTimes(1);
  }
});

it.each(['button', 'child'] as const)('honors keyboard cancellation from the %s and still completes an active preview', source => {
  const pressIn = jest.fn(), pressOut = jest.fn();
  const cancel: React.KeyboardEventHandler<HTMLElement> = event => event.preventDefault();
  const ui = (cancelDown: boolean) => <Button asChild={source === 'child'} onPressIn={pressIn} onPressOut={pressOut}
    onKeyDown={source === 'button' && cancelDown ? cancel : undefined} onKeyUp={cancel}>
    {source === 'child' ? <a href="#destination" onKeyDown={cancelDown ? cancel : undefined}>Choice</a> : 'Choice'}
  </Button>;
  act(() => root.render(ui(true)));
  const host = container.querySelector('button, a')!;
  act(() => host.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })));
  expect(pressIn).not.toHaveBeenCalled();
  act(() => root.render(ui(false)));
  act(() => host.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })));
  expect(pressIn).toHaveBeenCalledTimes(1);
  act(() => host.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true })));
  expect(pressOut).toHaveBeenCalledTimes(1);
});

it.each(['button', 'href', 'asChild'] as const)('composes %s non-touch hover with pointer cancellation and clears after disabling', mode => {
  const enter = jest.fn(), leave = jest.fn(), childEnter = jest.fn(), childLeave = jest.fn(), hold = jest.fn();
  const ui = (disabled = false) => <Button disabled={disabled} href={mode === 'href' ? '#destination' : undefined}
    asChild={mode === 'asChild'} onHoverIn={enter} onHoverOut={leave} onLongPress={hold}>
    {mode === 'asChild' ? <a href="#destination" onPointerEnter={childEnter} onPointerLeave={childLeave}>Choice</a> : 'Choice'}
  </Button>;
  act(() => root.render(ui()));
  const host = container.querySelector('button, a')!;
  pointer(host, 'pointerover', { pointerType: 'touch', relatedTarget: null });
  pointer(host, 'pointerout', { pointerType: 'touch', relatedTarget: document.body });
  expect(enter).not.toHaveBeenCalled(); expect(leave).not.toHaveBeenCalled();
  pointer(host, 'pointerover', { pointerType: 'mouse', relatedTarget: null });
  expect(enter).toHaveBeenCalledTimes(1);
  pointer(host, 'pointerdown', { pointerType: 'mouse' });
  pointer(host, 'pointerout', { pointerType: 'mouse', relatedTarget: document.body });
  expect(leave).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(500)); expect(hold).not.toHaveBeenCalled();
  act(() => root.render(ui(true)));
  pointer(host, 'pointerover', { pointerType: 'mouse', relatedTarget: null });
  pointer(host, 'pointerout', { pointerType: 'mouse', relatedTarget: document.body });
  expect(enter).toHaveBeenCalledTimes(1); expect(leave).toHaveBeenCalledTimes(2);
  if (mode === 'asChild') { expect(childEnter).toHaveBeenCalledTimes(3); expect(childLeave).toHaveBeenCalledTimes(3); }
});
