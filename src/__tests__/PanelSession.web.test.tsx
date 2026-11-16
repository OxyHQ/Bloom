/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Dialog } from '../dialog/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  PanelSessionProvider,
  usePanelSessionFocus,
  usePanelSessionState,
} from '../app-shell/panel-session';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
let update: React.Dispatch<React.SetStateAction<string>>;
let mounts = 0;

function Editor({ stateKey = 'draft', initial = '' }: { stateKey?: string; initial?: string }) {
  const [value, setValue] = usePanelSessionState(stateKey, initial);
  const focus = usePanelSessionFocus<HTMLInputElement>(stateKey);
  update = setValue;
  // Native TextInput/RNW may report the newly mounted controlled value's end
  // selection before the retained focus request runs. It is not the user's
  // previous selection and must not replace the outgoing host's record.
  React.useLayoutEffect(() => {
    focus.onSelectionChange({
      nativeEvent: { selection: { start: value.length, end: value.length } },
    });
  }, []);
  React.useEffect(() => {
    mounts += 1;
  }, []);
  return (
    <input
      ref={focus.ref}
      value={value}
      readOnly
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      onSelect={(event) =>
        focus.onSelectionChange({
          nativeEvent: {
            selection: {
              start: event.currentTarget.selectionStart ?? 0,
              end: event.currentTarget.selectionEnd ?? 0,
            },
          },
        })
      }
    />
  );
}
function render(mode: 'inline' | 'floating', active = true, stateKey = 'draft', initial = '') {
  act(() =>
    root.render(
      <PanelSessionProvider presentation={mode} active={active}>
        {active ? (
          <div key={mode}>
            <Editor stateKey={stateKey} initial={initial} />
          </div>
        ) : null}
      </PanelSessionProvider>,
    ),
  );
}
const input = () => host.querySelector('input')!;
const frame = () => act(() => jest.runOnlyPendingTimers());

beforeEach(() => {
  jest.useFakeTimers();
  mounts = 0;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.replaceChildren();
  jest.useRealTimers();
});

it('retains registered drafts across actual subtree remounts, close/reopen and updater calls', () => {
  render('inline');
  act(() => update('draft'));
  render('floating');
  expect(mounts).toBe(2);
  expect(input().value).toBe('draft');
  act(() => update((previous) => `${previous}!`));
  render('inline', false);
  render('inline');
  expect(input().value).toBe('draft!');
});
it('initializes each new domain key from its own initial value and isolates panel owners', () => {
  render('inline', true, 'a', 'first');
  act(() => update('edited'));
  render('inline', true, 'b', 'second');
  expect(input().value).toBe('second');
  render('floating', true, 'a', 'ignored');
  expect(input().value).toBe('edited');
  act(() =>
    root.render(
      <PanelSessionProvider key="new-panel" presentation="inline" active>
        <Editor initial="new" />
      </PanelSessionProvider>,
    ),
  );
  expect(input().value).toBe('new');
});
it('restores the focused text input and selection when presentation changes', () => {
  render('inline', true, 'draft', 'draft text');
  const previous = input();
  act(() => previous.focus());
  act(() => {
    previous.setSelectionRange(2, 6);
    previous.dispatchEvent(new Event('select', { bubbles: true }));
    document.dispatchEvent(new Event('selectionchange'));
  });
  render('floating');
  expect(input()).not.toBe(previous);
  frame();
  expect(document.activeElement).toBe(input());
  expect(input().selectionStart).toBe(2);
  expect(input().selectionEnd).toBe(6);
  render('inline');
  frame();
  expect(document.activeElement).toBe(input());
});
it('does not steal focus when the user chooses another destination during adaptation', () => {
  render('inline');
  act(() => input().focus());
  render('floating');
  const other = document.createElement('button');
  document.body.append(other);
  act(() => other.focus());
  frame();
  expect(document.activeElement).toBe(other);
});
it('cancels pending focus after user interaction, closing, and explicit blur', () => {
  render('inline');
  act(() => input().focus());
  render('floating');
  document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  frame();
  expect(document.activeElement).not.toBe(input());
  act(() => input().focus());
  render('inline');
  render('inline', false);
  frame();
  render('floating');
  frame();
  expect(document.activeElement).not.toBe(input());
  act(() => {
    input().focus();
    input().blur();
  });
  render('inline');
  frame();
  expect(document.activeElement).not.toBe(input());
});

it('restores the registered editor through the real Dialog focus boundary, before its first button', () => {
  function Surface({ floating }: { floating: boolean }) {
    const editor = <Editor initial="actual dialog draft" />;
    return (
      <BloomThemeProvider mode="light">
        <PanelSessionProvider presentation={floating ? 'floating' : 'inline'} active>
          {floating ? (
            <Dialog startOpen label="Inspector" placement="end" scrollable={false}>
              <button type="button">First dialog button</button>
              {editor}
            </Dialog>
          ) : (
            <div>{editor}</div>
          )}
        </PanelSessionProvider>
      </BloomThemeProvider>
    );
  }
  act(() => root.render(<Surface floating={false} />));
  act(() => input().focus());
  act(() => update('unsent inspector comment'));
  act(() => root.render(<Surface floating />));
  frame();
  const modalInput = document.querySelector('[role="dialog"] input') as HTMLInputElement;
  expect(modalInput).not.toBeNull();
  expect(modalInput.value).toBe('unsent inspector comment');
  expect(document.activeElement).toBe(modalInput);
  act(() => root.render(<Surface floating={false} />));
  frame();
  expect(input().value).toBe('unsent inspector comment');
  expect(document.activeElement).toBe(input());
});
