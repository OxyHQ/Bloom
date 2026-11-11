import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { NotificationPermissionGate, NotificationsScreen } from '../notifications';
import * as surfaces from '../surfaces';

function Provider({ children }: { children: React.ReactNode }) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      {children}
    </BloomThemeProvider>
  );
}

describe('NotificationsScreen', () => {
  it('draws rows, marks all read, toggles push and falls back to empty and error states', async () => {
    const onPress = jest.fn();
    const onMarkAllRead = jest.fn();
    const onChange = jest.fn();
    const { getByText, getByTestId, queryByText, rerender } = render(
      <NotificationsScreen
        notifications={[
          { id: 'a', title: 'Ana followed you', timestamp: '2m', unread: true },
          { id: 'b', title: 'Welcome' },
        ]}
        onNotificationPress={onPress}
        onMarkAllRead={onMarkAllRead}
        push={{ enabled: false, onChange }}
      />,
      { wrapper: Provider },
    );
    fireEvent.press(getByTestId('notification-a'));
    expect(onPress).toHaveBeenCalledWith('a');
    expect(getByTestId('notification-a-unread')).toBeTruthy();
    fireEvent.press(getByText('Mark all read'));
    expect(onMarkAllRead).toHaveBeenCalled();
    await act(async () => fireEvent(getByTestId('notifications-push-switch'), 'valueChange', true));
    expect(getByText('Push notifications')).toBeTruthy();

    const onRetry = jest.fn();
    rerender(<NotificationsScreen notifications={[]} error onRetry={onRetry} />);
    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
    rerender(<NotificationsScreen notifications={[]} />);
    expect(queryByText('You’re all caught up.')).toBeTruthy();
  });
});

describe('NotificationPermissionGate', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('asks after the delay unless granted or already declined', async () => {
    const present = jest.spyOn(surfaces, 'present').mockResolvedValue('later');
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    const permission = {
      getStatus: jest.fn().mockResolvedValue('undetermined'),
      request: jest.fn(),
    };
    render(<NotificationPermissionGate permission={permission} storage={storage} delayMs={500} />);
    await act(async () => {
      jest.advanceTimersByTime(499);
    });
    expect(present).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(present).toHaveBeenCalledTimes(1);
    expect(store.size).toBe(1); // "Not now" is remembered

    render(<NotificationPermissionGate permission={permission} storage={storage} delayMs={0} />);
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(present).toHaveBeenCalledTimes(1);
  });
});
