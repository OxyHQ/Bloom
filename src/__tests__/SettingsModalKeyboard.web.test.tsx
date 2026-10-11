/** @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { TextInput } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SettingsModal } from '../settings-modal';
import { resetOverlayStack } from '../overlay/stack';
import { pushFloatingEscape } from '../floating/escape-stack';
import { RiSettings6Line } from '../icons/remix/RiSettings6Line';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let opener: HTMLInputElement;

beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  opener = document.createElement('input');
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
const flush = () =>
  act(() => {
    jest.runOnlyPendingTimers();
  });
function mount(onClose = jest.fn(), guard?: () => boolean) {
  function Controlled() {
    const [open, setOpen] = React.useState(true);
    return (
      <SettingsModal
        open={open}
        initialView="page"
        onBeforeLeave={guard}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        groups={[
          {
            label: 'Settings',
            items: [{ key: 'general', page: 'general', label: 'General', icon: RiSettings6Line }],
          },
        ]}
        pages={{
          general: {
            title: 'General',
            content: <TextInput accessibilityLabel="Setting" testID="field" />,
          },
        }}
      />
    );
  }
  act(() =>
    root.render(
      <BloomThemeProvider mode="light">
        <Controlled />
      </BloomThemeProvider>,
    ),
  );
  flush();
  flush();
  return onClose;
}
function pressEscape() {
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
  flush();
}
function field() {
  return document.querySelector<HTMLInputElement>('[data-testid="field"]')!;
}

it('takes focus from the underlying input, closes from an RN text field and restores focus', () => {
  const onClose = mount();
  expect(document.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
  field().focus();
  pressEscape();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(opener);
});

it('runs the leave guard once when Escape comes from an RN text field', () => {
  const guard = jest.fn(() => false);
  const onClose = mount(jest.fn(), guard);
  field().focus();
  pressEscape();
  expect(guard).toHaveBeenCalledTimes(1);
  expect(guard).toHaveBeenCalledWith('close');
  expect(onClose).not.toHaveBeenCalled();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(document.activeElement).toBe(field());
});

it('leaves the first Escape to an anchored select layer and closes settings on the next', () => {
  const onClose = mount();
  // Exercise the same shared Escape ownership used by Select's FloatingPanel.
  const option = document.createElement('button');
  document.body.appendChild(option);
  let release = () => {};
  const closeSelect = jest.fn(() => {
    release();
    option.remove();
    field().focus();
  });
  release = pushFloatingEscape(closeSelect);
  try {
    option.focus();
    pressEscape();
    expect(closeSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(field());
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  } finally {
    release();
    option.remove();
  }
});

it('closes on Escape pressed before the enter frame, instead of the enter reopening it', () => {
  const onClose = jest.fn();
  function Controlled() {
    const [open, setOpen] = React.useState(true);
    return (
      <SettingsModal
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        groups={[
          {
            label: 'Settings',
            items: [{ key: 'general', page: 'general', label: 'General', icon: RiSettings6Line }],
          },
        ]}
        pages={{ general: { title: 'General', content: null } }}
      />
    );
  }
  // Mounted and in the DOM, but the enter frame has not run yet.
  act(() =>
    root.render(
      <BloomThemeProvider mode="light">
        <Controlled />
      </BloomThemeProvider>,
    ),
  );
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  act(() =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  flush();
  flush();
  flush();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
