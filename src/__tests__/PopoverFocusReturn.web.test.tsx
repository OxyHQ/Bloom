/** @jest-environment jsdom */
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Button } from '../button/Button.web';
import { Dialog } from '../dialog/Dialog.web';
import { useDialogControl } from '../dialog/context';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resetOverlayStack } from '../overlay/stack';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetOverlayStack();
  jest.useRealTimers();
});
const flush = () => {
  for (let i = 0; i < 5; i++) act(() => jest.advanceTimersByTime(100));
};
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (node) => node.textContent === name,
  )!;
function click(name: string) {
  act(() => {
    button(name).focus();
    button(name).click();
  });
  flush();
}
function Fixture({ conditional = false }: { conditional?: boolean }) {
  const dialog = useDialogControl();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => dialog.open()}>Open parent</Button>
      <Dialog control={dialog} title="Parent">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button>Filter</Button>
          </PopoverTrigger>
          {(!conditional || open) && (
            <PopoverContent label="Filter options">
              <Button onPress={() => setOpen(false)}>Apply</Button>
              <Button
                onPress={() => {
                  button('Outside').focus();
                  setOpen(false);
                }}
              >
                Move focus outside
              </Button>
            </PopoverContent>
          )}
        </Popover>
        <Button onPress={() => setOpen(false)}>Outside</Button>
      </Dialog>
    </>
  );
}
function mount(conditional: boolean) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light">
        <Fixture conditional={conditional} />
      </BloomThemeProvider>,
    ),
  );
  flush();
  click('Open parent');
  click('Filter');
}
it.each([false, true])(
  'returns focus on Escape inside a parent dialog (conditional=%s)',
  (conditional) => {
    mount(conditional);
    act(() => button('Apply').focus());
    expect(document.activeElement).toBe(button('Apply'));
    act(() =>
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    flush();
    expect(document.querySelector('[aria-label="Filter options"]')).toBeNull();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement).toBe(button('Filter'));
  },
);
it.each([false, true])(
  'returns focus after an action closes the panel (conditional=%s)',
  (conditional) => {
    mount(conditional);
    click('Apply');
    expect(document.activeElement).toBe(button('Filter'));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  },
);
it.each([false, true])(
  'preserves deliberate focus outside the panel (conditional=%s)',
  (conditional) => {
    mount(conditional);
    click('Move focus outside');
    expect(document.activeElement).toBe(button('Outside'));
  },
);

// A NON-modal popover beside a field the user keeps working in (an @-mention
// picker under a text input). With the default backdrop, the first click in the
// field only closed the panel. `modal={false}` lays no backdrop: the outside
// press closes the panel AND the field keeps the focus it was given.
function FieldFixture({ modal }: { modal?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <input aria-label="Message" />
      <Popover open={open} onOpenChange={setOpen} modal={modal}>
        <PopoverTrigger asChild>
          <Button>Mention</Button>
        </PopoverTrigger>
        <PopoverContent label="Mentions">
          <Button>Ada</Button>
        </PopoverContent>
      </Popover>
    </>
  );
}
function mountField(modal?: boolean) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light">
        <FieldFixture modal={modal} />
      </BloomThemeProvider>,
    ),
  );
  flush();
  expect(document.querySelector('[aria-label="Mentions"]')).not.toBeNull();
}
const dismissLayer = () => document.querySelector('[aria-label="Dismiss"]');
it('lays a dismiss backdrop over the app by default', () => {
  mountField();
  expect(dismissLayer()).not.toBeNull();
});
it('with modal={false}, lays no backdrop and an outside press closes it without taking the field', () => {
  mountField(false);
  expect(dismissLayer()).toBeNull();
  const field = document.querySelector<HTMLInputElement>('input[aria-label="Message"]');
  if (!field) throw new Error('the field did not render');
  // Outside the (zero-box, jsdom) anchor, so the press is not the trigger's.
  act(() => {
    field.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 400, clientY: 400 }),
    );
    field.focus();
  });
  flush();
  expect(document.querySelector('[aria-label="Mentions"]')).toBeNull();
  expect(document.activeElement).toBe(field);
});
