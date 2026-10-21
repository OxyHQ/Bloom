/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
let mockWidth = 1000;
let mockHeight = 800;
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: mockWidth, height: mockHeight, scale: 1, fontScale: 1 }),
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
import BottomSheet from '../bottom-sheet/BottomSheet.web';
import { Screen, ScreenScrollView } from '../screen/index.web';
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
  mockHeight = 800;
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

it('keeps closed and open dialog theme scopes out of the caller flex layout', () => {
  function LayoutFixture() {
    const first = useDialogControl();
    const second = useDialogControl();
    controls = first;
    return (
      <div data-layout="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div data-content="">Workspace</div>
        <Dialog control={first} frame={{ key: 'blue-frame', colorPreset: 'blue' }} label="First">
          <input aria-label="Scoped draft" />
        </Dialog>
        <Dialog control={second} label="Second">
          <button>Another dialog</button>
        </Dialog>
      </div>
    );
  }
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <LayoutFixture />
      </BloomThemeProvider>,
    ),
  );
  const layout = container.querySelector('[data-layout]')!;
  expect(layout.children).toHaveLength(1);
  act(() => controls.open());
  flush();
  expect(layout.children).toHaveLength(1);
  const panel = document.querySelector('[role="dialog"][aria-label="First"]') as HTMLElement;
  expect(panel).not.toBeNull();
  expect(panel.style.getPropertyValue('--primary')).not.toBe('');
  act(() => controls.close());
  flush();
  expect(layout.children).toHaveLength(1);
});

it('gives a portaled flex screen one bounded viewport and preserves its focused draft through resize', () => {
  const draw = () =>
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BottomSheet
            open
            detached
            sizing="fill"
            scrollable={false}
            accessibilityLabel="Flex screen"
          >
            <Screen scroll="none">
              <ScreenScrollView>
                <input aria-label="Message draft" />
              </ScreenScrollView>
            </Screen>
          </BottomSheet>
        </BloomThemeProvider>,
      ),
    );
  draw();
  flush();
  const panel = document.querySelector('[role="dialog"][aria-label="Flex screen"]') as HTMLElement;
  expect(getComputedStyle(panel).height).toBe('768px');
  expect(panel.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  const input = panel.querySelector('input')!;
  input.value = 'Unsaved message';
  input.focus();
  for (const [width, height] of [
    [320, 600],
    [1000, 900],
  ] as const) {
    mockWidth = width;
    mockHeight = height;
    draw();
    draw();
    flush();
    expect(document.querySelector('[role="dialog"][aria-label="Flex screen"]')).toBe(panel);
    expect(getComputedStyle(panel).height).toBe(`${height - 32}px`);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Unsaved message');
    expect(panel.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  }
});
