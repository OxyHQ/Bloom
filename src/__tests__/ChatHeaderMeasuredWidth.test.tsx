import { act, fireEvent, render } from '@testing-library/react-native';

import { ChatHeader } from '../chat-screen/ChatHeader';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

let mockIsNative = false;
jest.mock('../chat-screen/shared', () => ({
  ...jest.requireActual('../chat-screen/shared'),
  get IS_NATIVE() {
    return mockIsNative;
  },
}));

describe('ChatHeader measured width', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the header host width and switches back after a resize on web', () => {
    mockIsNative = false;
    mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ChatHeader title="Ana" onPressBack={() => {}} testID="header" />
      </BloomThemeProvider>,
    );
    const header = screen.getByTestId('header-measure');
    expect(screen.queryByTestId('header-back')).toBeNull();

    act(() => {
      fireEvent(header, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 640, height: 60 } },
      });
    });

    expect(screen.getByTestId('header-back')).toBeTruthy();

    act(() => {
      fireEvent(header, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 1280, height: 60 } },
      });
    });

    expect(screen.queryByTestId('header-back')).toBeNull();
  });

  it('shares the identity and secondary row without losing status precedence or selection mode', () => {
    const openProfile = jest.fn();
    const props = {
      title: 'Ana',
      status: 'Online',
      typingLabel: 'Ana is typing',
      connectingLabel: 'Reconnecting',
      onPressHeader: openProfile,
      titleAlign: 'center' as const,
      titleLayout: 'stacked' as const,
      titleAppearance: 'capsule' as const,
      showBack: true,
      onPressBack: jest.fn(),
      backCount: 23,
      testID: 'header',
    };
    const screen = render(
      <BloomThemeProvider mode="light">
        <ChatHeader {...props} connecting />
      </BloomThemeProvider>,
    );
    expect(screen.getByText('Reconnecting')).toBeTruthy();
    expect(screen.queryByText('Ana is typing')).toBeNull();
    expect(screen.queryByText('Online')).toBeNull();
    fireEvent.press(screen.getByTestId('header-identity'));
    expect(openProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByText('23')).toBeTruthy();
    screen.rerender(
      <BloomThemeProvider mode="light">
        <ChatHeader {...props} selectionCount={2} />
      </BloomThemeProvider>,
    );
    expect(screen.queryByTestId('header-identity')).toBeNull();
    expect(screen.queryByText('23')).toBeNull();
    expect(screen.queryByText('Ana is typing')).toBeNull();
    expect(screen.getByText('2 selected')).toBeTruthy();
  });

  it('keeps back on a wide native conversation, which has no list pane beside it', () => {
    mockIsNative = true;
    mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ChatHeader title="Ana" onPressBack={() => {}} testID="header" />
      </BloomThemeProvider>,
    );

    act(() => {
      fireEvent(screen.getByTestId('header-measure'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 1280, height: 60 } },
      });
    });

    expect(screen.getByTestId('header-back')).toBeTruthy();
  });
});
