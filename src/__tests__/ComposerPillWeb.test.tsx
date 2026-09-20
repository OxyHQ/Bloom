/**
 * @jest-environment jsdom
 *
 * `ComposerPill`'s Enter key, on the platform where it is a key.
 *
 * The decision is about a DOM keydown: the handler reads `shiftKey` and
 * `isComposing` off `event.nativeEvent`, which only exists once
 * react-native-web has made a synthetic event out of a real one, and the whole
 * branch is behind `IS_WEB`. Under the native preset that guard is false, so
 * `ComposerPanel.test.tsx` cannot reach any of this — the same reason
 * `ChatComposer.test.tsx` renders into a real document, and the same shape.
 *
 * What is pinned:
 *
 * - **Shift+Enter breaks the line.** The handler used to read only the key, so
 *   the most-used key combination in a composer sent a half-written message.
 *   `ComposerPanelBase` has always had the clause; the pill did not, and two
 *   composers in one family disagreeing about Enter was a difference nobody
 *   chose.
 * - **Enter alone still sends**, which is the half that was already right and
 *   is the easiest thing to break while fixing the other.
 * - **An input method's Enter is the input method's.** Accepting a candidate
 *   in Japanese, Chinese or Korean fires Enter with `isComposing`, and sending
 *   there posts a half-composed word.
 * - **A turn in flight takes neither.** `busy` stops Enter submitting, because
 *   the send control has become a stop control and Enter must not reach past
 *   it.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ComposerPill } from '../composer-panel';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
  });
}

/** The pill's field, by the accessible name it publishes. */
function field(): HTMLElement {
  const found = container.querySelector('[aria-label="Message"]');
  if (!found) throw new Error('the composer field is not in the document');
  return found as HTMLElement;
}

function keyDown(element: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  });
}

describe('ComposerPill — Enter on web', () => {
  it('sends on Enter', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPill defaultValue="hi" onSubmit={onSubmit} />);

    keyDown(field(), 'Enter');

    expect(onSubmit).toHaveBeenCalledWith('hi');
  });

  it('breaks the line on Shift+Enter instead of sending', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPill defaultValue="hi" onSubmit={onSubmit} />);

    keyDown(field(), 'Enter', { shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('leaves an input method\'s Enter to the input method', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPill defaultValue="hi" onSubmit={onSubmit} />);

    // `isComposing` is not in `KeyboardEventInit`; it is read off the event.
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(event, 'isComposing', { value: true });
      field().dispatchEvent(event);
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not send while a turn is in flight', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPill defaultValue="hi" onSubmit={onSubmit} busy onStop={() => {}} />);

    keyDown(field(), 'Enter');

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
