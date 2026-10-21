/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
let mockWidth = 1000;
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: mockWidth, height: 800, scale: 1, fontScale: 1 }),
}));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const native = jest.requireActual('react-native-web');
  return {
    ...base,
    __esModule: true,
    default: {
      ...base.default,
      View: native.View,
      Text: native.Text,
      ScrollView: native.ScrollView,
    },
  };
});
import { Dialog, useDialogControl } from '../dialog/index.web';
import type { DialogControlProps } from '../dialog/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resetOverlayStack } from '../overlay/stack';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let controls: Pick<DialogControlProps, 'open' | 'close'>;
let closed: jest.Mock;
function Fixture() {
  const control = useDialogControl();
  controls = control;
  return (
    <Dialog
      control={control}
      presentation="fullscreen"
      placement={{ base: 'bottom', md: 'right' }}
      label="Version history"
      scrollable={false}
      contentPadding={0}
      onClose={closed}
    >
      <input aria-label="Find version" />
      <button>Restore version</button>
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
}
function flush() {
  for (let i = 0; i < 8; i++) act(() => jest.advanceTimersByTime(100));
}
beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  mockWidth = 1000;
  closed = jest.fn();
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
it('owns viewport geometry and preserves the modal, draft and focus through responsive resize', () => {
  renderFixture();
  act(() => controls.open());
  flush();
  const panel = document.querySelector('[role="dialog"]') as HTMLElement;
  expect(panel.getAttribute('aria-label')).toBe('Version history');
  expect(getComputedStyle(panel).width).toBe('100%');
  expect(getComputedStyle(panel).height).toBe('100%');
  expect(getComputedStyle(panel).maxHeight).toBe('100%');
  expect(getComputedStyle(panel).maxWidth).toBe('');
  const input = panel.querySelector('input')!;
  input.value = 'Keep this query';
  input.focus();
  for (const width of [320, 640, 1000]) {
    mockWidth = width;
    renderFixture();
    flush();
    expect(document.querySelector('[role="dialog"]')).toBe(panel);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Keep this query');
  }
  act(() =>
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  flush();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(closed).toHaveBeenCalledTimes(1);
});
