/** @jest-environment jsdom */
import React, { act, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
let mockWidth = 1000;
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: mockWidth, height: 800, scale: 1, fontScale: 1 }),
}));
jest.mock('../bottom-sheet', () => jest.requireActual('../bottom-sheet/index.web'));
import { Dialog, useDialogControl } from '../dialog/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resetOverlayStack } from '../overlay/stack';
import type { DialogControlProps } from '../dialog/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let opener: HTMLButtonElement;
let controls: Pick<DialogControlProps, 'open' | 'close'>;
let onClose: jest.Mock;
let mounted: jest.Mock;
let unmounted: jest.Mock;
type Mode = 'imperative' | 'controlled' | 'startOpen';
let mode: Mode;
beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  mockWidth = 1000;
  onClose = jest.fn();
  mounted = jest.fn();
  unmounted = jest.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  opener = document.createElement('button');
  opener.textContent = 'Open';
  document.body.appendChild(opener);
  opener.focus();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  opener.remove();
  resetOverlayStack();
  jest.useRealTimers();
});
function flush() {
  for (let i = 0; i < 8; i++) act(() => jest.advanceTimersByTime(100));
}
function Draft() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    mounted();
    return unmounted;
  }, []);
  return (
    <>
      <input aria-label="Draft" />
      <button onClick={() => setCount(count + 1)}>Edits {count}</button>
    </>
  );
}
function Fixture() {
  const control = useDialogControl();
  const [open, setOpen] = useState(false);
  controls = {
    open: mode === 'controlled' ? () => setOpen(true) : control.open,
    close: control.close,
  };
  return (
    <Dialog
      control={control}
      open={mode === 'controlled' ? open : undefined}
      startOpen={mode === 'startOpen'}
      placement={{ base: 'bottom', md: 'center' }}
      title="Edit draft"
      testID="responsive-dialog"
      onClose={() => {
        onClose();
        if (mode === 'controlled') setOpen(false);
      }}
    >
      <Draft />
    </Dialog>
  );
}
function renderFixture() {
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <Fixture />
      </BloomThemeProvider>,
    ),
  );
  flush();
}
function resize(width: number) {
  mockWidth = width;
  renderFixture();
}
function dialog() {
  return document.querySelector('[role="dialog"]') as HTMLElement;
}
function bodyInput() {
  return document.querySelector('[aria-label="Draft"]') as HTMLInputElement;
}
function isBottom() {
  return (
    document
      .querySelector('[data-testid="responsive-dialog"], [testid="responsive-dialog"]')
      ?.getAttribute('role') !== 'dialog'
  );
}
function escape() {
  act(() =>
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  flush();
}

it.each(['imperative', 'controlled', 'startOpen'] as const)(
  '%s keeps the open renderer, draft, focus and scroll; reopen picks the current viewport',
  (selected) => {
    mode = selected;
    renderFixture();
    if (mode !== 'startOpen') {
      act(() => controls.open());
      flush();
    }
    const panel = dialog();
    const input = bodyInput();
    expect(panel).not.toBeNull();
    expect(isBottom()).toBe(false);
    input.value = 'draft@example.test';
    act(() => input.focus());
    const scroller = [...panel.querySelectorAll<HTMLElement>('*')].find((n) =>
      ['auto', 'scroll'].includes(getComputedStyle(n).overflowY),
    );
    expect(scroller).toBeDefined();
    scroller!.scrollTop = 45;
    const increment = [...panel.querySelectorAll('button')].find(
      (n) => n.textContent === 'Edits 0',
    )!;
    act(() => increment.click());
    resize(320);
    resize(640);
    expect(dialog()).toBe(panel);
    expect(bodyInput()).toBe(input);
    expect(input.value).toBe('draft@example.test');
    expect(panel.textContent).toContain('Edits 1');
    expect(document.activeElement).toBe(input);
    expect(scroller!.scrollTop).toBe(45);
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    const callback = jest.fn();
    act(() => controls.close(callback));
    flush();
    expect(dialog()).toBeNull();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
    resize(320);
    expect(dialog()).toBeNull();
    act(() => controls.open());
    flush();
    expect(dialog()).not.toBeNull();
    expect(isBottom()).toBe(true);
    expect(bodyInput().value).toBe('');
    const bottom = dialog();
    resize(1000);
    expect(dialog()).toBe(bottom);
    expect(isBottom()).toBe(true);
    act(() => bodyInput().focus());
    escape();
    expect(dialog()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(2);
    act(() => controls.open());
    flush();
    expect(dialog()).not.toBeNull();
    expect(isBottom()).toBe(false);
  },
);

it('keeps the session until a center exit completes and permits a callback to reopen at the new placement', () => {
  mode = 'imperative';
  renderFixture();
  act(() => controls.open());
  flush();
  const panel = dialog();
  resize(320);
  act(() => controls.close(() => controls.open()));
  expect(dialog()).toBe(panel);
  flush();
  expect(dialog()).not.toBeNull();
  expect(isBottom()).toBe(true);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('releases the responsive session after backdrop dismissal exactly once', () => {
  mode = 'imperative';
  renderFixture();
  act(() => controls.open());
  flush();
  resize(320);
  const backdrop = document.querySelector('[aria-label="Dismiss dialog"]') as HTMLElement;
  expect(backdrop).not.toBeNull();
  act(() => backdrop.click());
  flush();
  expect(dialog()).toBeNull();
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => controls.open());
  flush();
  expect(dialog()).not.toBeNull();
  expect(isBottom()).toBe(true);
});
