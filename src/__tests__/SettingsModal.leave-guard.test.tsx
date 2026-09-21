import React, { createRef } from 'react';
import * as RN from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiSettings6Line } from '../icons/remix';
import { SettingsModal } from '../settings-modal';
import type { SettingsModalProps } from '../settings-modal';
import type { DialogControlProps, DialogControlRefProps } from '../dialog/types';
import { pressHost } from './support/press-host';

let mockWeb = false;
let mockAndroidBack: (() => boolean) | undefined;
jest.mock('react-native', () => ({
  __esModule: true,
  ...jest.requireActual('../../__mocks__/react-native'),
  useWindowDimensions: jest.fn(),
  BackHandler: {
    addEventListener: jest.fn((_name, callback) => {
      mockAndroidBack = callback;
      return { remove: jest.fn() };
    }),
  },
}));
jest.mock('../settings-modal/web-css', () => ({
  get IS_WEB() {
    return mockWeb;
  },
  useSettingsWebCss: () => {},
}));
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));
const groups = [
  {
    label: 'Settings',
    items: [
      { key: 'a', label: 'A', page: 'a', icon: RiSettings6Line },
      { key: 'b', label: 'B', page: 'b', icon: RiSettings6Line },
    ],
  },
];
const pages = {
  a: { title: 'A', content: <RN.Text>recovery content</RN.Text> },
  b: { title: 'B', content: <RN.Text>other content</RN.Text> },
};
const ui = (props: Partial<SettingsModalProps>) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    <SettingsModal open groups={groups} pages={pages} testID="settings" {...props} />
  </BloomThemeProvider>
);
const flush = () =>
  act(() => {
    jest.advanceTimersByTime(400);
  });
beforeEach(() => {
  jest.useFakeTimers();
  mockWeb = false;
  mockAndroidBack = undefined;
  jest
    .mocked(RN.useWindowDimensions)
    .mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it.each(['settings-close', 'settings-backdrop'])(
  'vetoes %s once and retries using the latest callback',
  (id) => {
    const blocked = jest.fn(() => false),
      allowed = jest.fn(() => true),
      onClose = jest.fn();
    const view = render(ui({ onBeforeLeave: blocked, onClose }));
    flush();
    pressHost(view.getByTestId(id));
    flush();
    expect(blocked).toHaveBeenCalledTimes(1);
    expect(blocked).toHaveBeenCalledWith('close');
    expect(onClose).not.toHaveBeenCalled();
    expect(view.getByText('recovery content')).toBeTruthy();
    view.rerender(ui({ onBeforeLeave: allowed, onClose }));
    pressHost(view.getByTestId(id));
    expect(allowed).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  },
);
it('vetoes imperative close without running its completion callback', () => {
  const ref = createRef<DialogControlRefProps>();
  const control: DialogControlProps = {
    id: 'settings-guard',
    ref,
    open: () => ref.current?.open(),
    close: (cb) => ref.current?.close(cb),
  };
  const guard = jest.fn(() => false),
    callback = jest.fn(),
    onClose = jest.fn();
  const view = render(ui({ open: undefined, control, onBeforeLeave: guard, onClose }));
  act(() => control.open());
  flush();
  act(() => control.close(callback));
  flush();
  expect(guard).toHaveBeenCalledTimes(1);
  expect(callback).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(view.getByText('recovery content')).toBeTruthy();
  guard.mockReturnValue(true);
  act(() => control.close(callback));
  flush();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(view.queryByText('recovery content')).toBeNull();
});
it('guards a different page but permits selecting the current page', () => {
  const guard = jest.fn(() => false),
    onPageChange = jest.fn();
  const view = render(ui({ onBeforeLeave: guard, onPageChange }));
  flush();
  pressHost(view.getByTestId('settings-nav-a'));
  expect(guard).not.toHaveBeenCalled();
  onPageChange.mockClear();
  pressHost(view.getByTestId('settings-nav-b'));
  expect(guard).toHaveBeenCalledTimes(1);
  expect(guard).toHaveBeenCalledWith('page');
  expect(onPageChange).not.toHaveBeenCalled();
  expect(view.getByText('recovery content')).toBeTruthy();
  guard.mockReturnValue(true);
  pressHost(view.getByTestId('settings-nav-b'));
  expect(view.getByText('other content')).toBeTruthy();
});
it('guards compact back and Android back to navigation, then Android close', () => {
  jest
    .mocked(RN.useWindowDimensions)
    .mockReturnValue({ width: 390, height: 800, scale: 1, fontScale: 1 });
  const guard = jest.fn(() => false),
    onClose = jest.fn();
  const view = render(ui({ initialView: 'page', onBeforeLeave: guard, onClose }));
  flush();
  pressHost(view.getByTestId('settings-header-back'));
  expect(guard).toHaveBeenLastCalledWith('navigation');
  expect(view.getByText('recovery content')).toBeTruthy();
  guard.mockClear();
  act(() => {
    expect(mockAndroidBack?.()).toBe(true);
  });
  expect(guard).toHaveBeenCalledTimes(1);
  expect(guard).toHaveBeenCalledWith('navigation');
  guard.mockReturnValue(true);
  act(() => {
    mockAndroidBack?.();
  });
  expect(view.queryByText('recovery content')).toBeNull();
  guard.mockClear();
  guard.mockReturnValue(false);
  act(() => {
    mockAndroidBack?.();
  });
  expect(guard).toHaveBeenCalledTimes(1);
  expect(guard).toHaveBeenCalledWith('close');
  expect(onClose).not.toHaveBeenCalled();
});
it('guards Escape once', () => {
  mockWeb = true;
  const listeners = new Map<string, (event: unknown) => void>();
  const prior = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      addEventListener: (key: string, fn: (event: unknown) => void) => listeners.set(key, fn),
      removeEventListener: (key: string) => listeners.delete(key),
    },
  });
  try {
    const guard = jest.fn(() => false),
      onClose = jest.fn();
    const view = render(ui({ onBeforeLeave: guard, onClose }));
    flush();
    act(() => listeners.get('keydown')?.({ key: 'Escape', stopPropagation: jest.fn() }));
    expect(guard).toHaveBeenCalledTimes(1);
    expect(guard).toHaveBeenCalledWith('close');
    expect(onClose).not.toHaveBeenCalled();
    expect(view.getByText('recovery content')).toBeTruthy();
    view.unmount();
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: prior });
  }
});
it('does not veto external controlled page/open changes', () => {
  const guard = jest.fn(() => false);
  const view = render(ui({ page: 'a', onBeforeLeave: guard }));
  flush();
  view.rerender(ui({ page: 'b', onBeforeLeave: guard }));
  expect(view.getByText('other content')).toBeTruthy();
  view.rerender(ui({ open: false, page: 'b', onBeforeLeave: guard }));
  flush();
  expect(view.queryByText('other content')).toBeNull();
  expect(guard).not.toHaveBeenCalled();
});
