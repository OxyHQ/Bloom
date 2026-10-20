import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AiChatResizeHandle } from '../ai-chat/AiChatResizeHandle';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
jest.mock('../styles/platform', () => ({
  ...jest.requireActual('../styles/platform'),
  IS_WEB: true,
}));
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);
describe('shared separator orientations', () => {
  it('uses up/down and dy for a horizontal separator', () => {
    const onResize = jest.fn(),
      onNudge = jest.fn();
    const screen = render(
      <AiChatResizeHandle
        testID="grip"
        orientation="horizontal"
        onResize={onResize}
        onNudge={onNudge}
      />,
      { wrapper },
    );
    const grip = screen.getByTestId('grip');
    expect(grip.props['aria-orientation']).toBe('horizontal');
    fireEvent(grip, 'keyDown', { nativeEvent: { key: 'ArrowDown' } });
    fireEvent(grip, 'keyDown', { nativeEvent: { key: 'ArrowUp' } });
    fireEvent(grip, 'keyDown', { nativeEvent: { key: 'ArrowRight' } });
    expect(onNudge.mock.calls.map((call) => call[0])).toEqual([16, -16]);
    const target = {
      style: { setProperty: jest.fn() },
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
      hasPointerCapture: () => true,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 20 }),
    };
    fireEvent(grip, 'pointerDown', {
      preventDefault: jest.fn(),
      nativeEvent: { clientX: 10, clientY: 20, pointerId: 1 },
      currentTarget: target,
    });
    fireEvent(grip, 'pointerMove', {
      nativeEvent: { clientX: 90, clientY: 65, pointerId: 1 },
      currentTarget: target,
    });
    expect(onResize).toHaveBeenCalledWith(45);
  });
  it('keeps left/right as the default separator contract', () => {
    const onNudge = jest.fn();
    const screen = render(
      <AiChatResizeHandle testID="grip" onResize={() => {}} onNudge={onNudge} />,
      { wrapper },
    );
    const grip = screen.getByTestId('grip');
    expect(grip.props['aria-orientation']).toBe('vertical');
    fireEvent(grip, 'keyDown', { nativeEvent: { key: 'ArrowLeft' } });
    fireEvent(grip, 'keyDown', { nativeEvent: { key: 'ArrowDown' } });
    expect(onNudge.mock.calls.map((call) => call[0])).toEqual([-16]);
  });
});
