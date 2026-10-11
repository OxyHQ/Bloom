/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      backgroundSecondary: '#eeeeee',
      backgroundTertiary: '#dddddd',
      textTertiary: '#888888',
      border: '#999999',
      card: '#ffffff',
      background: '#ffffff',
      text: '#17251e',
      textSecondary: '#65716a',
      tertiary: '#123456',
      tertiaryForeground: '#ffffff',
      primary: '#166534',
      primaryForeground: '#ffffff',
      negative: '#991b1b',
      negativeForeground: '#ffffff',
      primarySubtle: 'rgba(22,101,52,0.13)',
      primarySubtleForeground: '#14532d',
    },
  }),
}));
import { Button } from '../button/Button.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

import { MicButton, SendButton, StopButton } from '../composer-panel/ComposerControls';
import { ComposerButtonContext } from '../composer-panel/context';
const palette = { iconPrimary: '#111111', accent500: '#166534' };
it('renders all controls through actual Button with preserved size and callbacks', () => {
  const mic = jest.fn(),
    send = jest.fn(),
    stop = jest.fn();
  act(() =>
    root.render(
      <ComposerButtonContext.Provider value={Button}>
        <MicButton listening label="Mic" onToggle={mic} palette={palette} />
        <SendButton disabled={false} label="Send" onPress={send} />
        <StopButton label="Stop" onPress={stop} />
      </ComposerButtonContext.Provider>,
    ),
  );
  const buttons = container.querySelectorAll('button');
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    expect(button.className).toContain('bloom-btn--surface');
    expect(button.style.width).toBe('36px');
    expect(button.style.height).toBe('36px');
    act(() => button.click());
  }
  expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true');
  expect(mic).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalledTimes(1);
});
it('keeps stop usable while send is disabled', () => {
  const send = jest.fn(),
    stop = jest.fn();
  act(() =>
    root.render(
      <ComposerButtonContext.Provider value={Button}>
        <SendButton disabled label="Send" onPress={send} />
        <StopButton label="Stop" onPress={stop} />
      </ComposerButtonContext.Provider>,
    ),
  );
  const [sendButton, stopButton] = container.querySelectorAll('button');
  expect(sendButton!.disabled).toBe(true);
  expect(sendButton!.getAttribute('aria-disabled')).toBe('true');
  expect(stopButton!.disabled).toBe(false);
  act(() => {
    sendButton!.click();
    stopButton!.click();
  });
  expect(send).not.toHaveBeenCalled();
  expect(stop).toHaveBeenCalledTimes(1);
});
