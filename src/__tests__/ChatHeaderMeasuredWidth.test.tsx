import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ChatHeader } from '../chat-screen/ChatHeader';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

describe('ChatHeader measured width', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the header host width and switches back after a resize', () => {
    mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ChatHeader title="Ana" onPressBack={() => {}} testID="header" />
      </BloomThemeProvider>,
    );
    const header = screen.getByTestId('header');
    const paddingLeft = () =>
      StyleSheet.flatten(header.props.style as Parameters<typeof StyleSheet.flatten>[0])
        ?.paddingLeft;

    expect(screen.queryByTestId('header-back')).toBeNull();
    expect(paddingLeft()).toBe(16);

    act(() => {
      fireEvent(header, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 640, height: 60 } },
      });
    });

    expect(screen.getByTestId('header-back')).toBeTruthy();
    expect(paddingLeft()).toBe(12);

    act(() => {
      fireEvent(header, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 1280, height: 60 } },
      });
    });

    expect(screen.queryByTestId('header-back')).toBeNull();
    expect(paddingLeft()).toBe(16);
  });
});
