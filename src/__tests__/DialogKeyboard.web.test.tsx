/**
 * @jest-environment jsdom
 */

/**
 * `Dialog` on WEB, from the keyboard: focus in on open, Tab kept inside,
 * focus back on close, and Escape — including from the dialog's own text
 * field, which is where a command palette keeps its focus.
 *
 * What shipped: the dialog listened for Escape on `document`, and
 * react-native-web's `TextInput` stops the propagation of every keydown it
 * gets, so with the caret in the palette's search box Escape did nothing. Focus
 * stayed on the page behind when it opened and was dropped on `<body>` when it
 * closed.
 *
 * Keys are dispatched on `document.activeElement`, never on an element picked
 * by the test, so a focus move that did not happen fails the next assertion.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// Jest resolves no platform forks: the bare `../bottom-sheet` the bottom
// placement imports would be the NATIVE shell (an RN `Modal`). Use the one a
// web bundle gets.
jest.mock('../bottom-sheet', () => jest.requireActual('../bottom-sheet/index.web'));

import { Pressable, Text, TextInput } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Dialog } from '../dialog/Dialog.web';
import { resetOverlayStack } from '../overlay/stack';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let opener: HTMLButtonElement;

beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
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

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  // The initial-focus frame, and anything the content scheduled.
  act(() => jest.runOnlyPendingTimers());
}

function press(key: string, init: KeyboardEventInit = {}) {
  const target = document.activeElement ?? document.body;
  let event!: KeyboardEvent;
  act(() => {
    event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
  });
  // The deferred Escape check runs after dispatch.
  act(() => jest.runOnlyPendingTimers());
  return event;
}

/** A dialog panel by its name (the reanimated mock drops `data-testid`). */
function dialogNamed(name: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(`[role="dialog"][aria-label="${name}"]`);
  if (!node) throw new Error(`no ${name} dialog`);
  return node;
}

function byTestId(id: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`no ${id}`);
  return node;
}

function Controlled({
  onClose,
  dismissOnBackdrop,
  children,
}: {
  onClose?: () => void;
  dismissOnBackdrop?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose?.();
        setOpen(false);
      }}
      dismissOnBackdrop={dismissOnBackdrop}
      placement="center"
      label="Palette"
      testID="dialog">
      {children}
    </Dialog>
  );
}

const Search = () => <TextInput testID="search" accessibilityLabel="Search" />;
const Row = ({ id }: { id: string }) => (
  <Pressable testID={id} accessibilityRole="button" accessibilityLabel={id} onPress={() => undefined}>
    <Text>{id}</Text>
  </Pressable>
);

describe('Dialog.web keyboard and focus', () => {
  it('moves focus into the dialog on open', () => {
    mount(
      <Controlled>
        <Row id="first" />
        <Row id="second" />
      </Controlled>,
    );
    expect(dialogNamed('Palette').contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(byTestId('first'));
  });

  it('keeps focus the content gave itself on mount', () => {
    mount(
      <Controlled>
        <Row id="first" />
        <TextInput testID="search" accessibilityLabel="Search" autoFocus />
      </Controlled>,
    );
    expect(document.activeElement).toBe(byTestId('search'));
  });

  it('closes on Escape from inside its own text field', () => {
    const onClose = jest.fn();
    mount(
      <Controlled onClose={onClose}>
        <Search />
      </Controlled>,
    );
    expect(document.activeElement).toBe(byTestId('search'));
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the element that opened it', () => {
    mount(
      <Controlled>
        <Search />
      </Controlled>,
    );
    press('Escape');
    act(() => jest.runAllTimers());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('wraps Tab and Shift+Tab at its edges', () => {
    mount(
      <Controlled>
        <Search />
        <Row id="last" />
      </Controlled>,
    );
    expect(document.activeElement).toBe(byTestId('search'));
    const back = press('Tab', { shiftKey: true });
    expect(back.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byTestId('last'));
    const forward = press('Tab');
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byTestId('search'));
  });

  it('leaves Escape to a control that keeps it', () => {
    const onClose = jest.fn();
    mount(
      <Controlled onClose={onClose}>
        <TextInput
          testID="search"
          accessibilityLabel="Search"
          onKeyPress={(event) => {
            if (event.nativeEvent.key === 'Escape') event.preventDefault();
          }}
        />
      </Controlled>,
    );
    press('Escape');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores Escape when it may not be dismissed', () => {
    const onClose = jest.fn();
    mount(
      <Controlled onClose={onClose} dismissOnBackdrop={false}>
        <Search />
      </Controlled>,
    );
    press('Escape');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes one layer per Escape: the dialog opened last first', () => {
    const outerClose = jest.fn();
    const innerClose = jest.fn();
    function Nested() {
      const [inner, setInner] = React.useState(false);
      return (
        <Controlled onClose={outerClose}>
          <Pressable testID="open-inner" accessibilityRole="button" accessibilityLabel="Shortcuts" onPress={() => setInner(true)}>
            <Text>Shortcuts</Text>
          </Pressable>
          <Dialog
            open={inner}
            onClose={() => {
              innerClose();
              setInner(false);
            }}
            placement="center"
            label="Shortcuts"
            testID="inner">
            <Search />
          </Dialog>
        </Controlled>
      );
    }
    mount(<Nested />);
    const trigger = byTestId('open-inner');
    expect(document.activeElement).toBe(trigger);
    act(() => trigger.click());
    act(() => jest.runOnlyPendingTimers());
    expect(dialogNamed('Shortcuts').contains(document.activeElement)).toBe(true);
    press('Escape');
    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
    act(() => jest.runAllTimers());
    // Focus went back to the control in the outer dialog that opened it.
    expect(document.activeElement).toBe(trigger);
    press('Escape');
    expect(outerClose).toHaveBeenCalledTimes(1);
  });

  describe('the bottom placement (the shared BottomSheet)', () => {
    function Sheet({ onClose, dismissOnBackdrop }: { onClose: () => void; dismissOnBackdrop?: boolean }) {
      const [open, setOpen] = React.useState(true);
      return (
        <Dialog
          open={open}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          dismissOnBackdrop={dismissOnBackdrop}
          placement="bottom"
          label="Shortcuts">
          <Search />
        </Dialog>
      );
    }

    it('moves focus in, and closes on Escape from its text field', () => {
      const onClose = jest.fn();
      mount(<Sheet onClose={onClose} />);
      const search = byTestId('search');
      expect(document.activeElement).toBe(search);
      press('Escape');
      // The sheet reports the close once its exit has run.
      act(() => jest.runAllTimers());
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(opener);
    });

    it('keeps a sheet that may not be dismissed', () => {
      const onClose = jest.fn();
      mount(<Sheet onClose={onClose} dismissOnBackdrop={false} />);
      press('Escape');
      act(() => jest.runAllTimers());
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
