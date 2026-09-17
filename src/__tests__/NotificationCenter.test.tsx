import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { NotificationCenter } from '../notification-center';
import type { NotificationCenterItem } from '../notification-center';
import { resolveButtonRamps } from '../button/shared';
import { resolvedStyle } from './support/rendered-style';

const ITEMS: NotificationCenterItem[] = [
  {
    id: 'a',
    category: 'mentions',
    group: 'Today',
    title: 'Livia mentioned you',
    description: 'Review?',
    timestamp: '2m',
    unread: true,
    avatar: { initials: 'LS', name: 'Livia Saris', color: 'pink' },
    actions: [{ id: 'reply', label: 'Reply', variant: 'primary' }],
  },
  { id: 'b', category: 'system', group: 'Today', title: 'Backup', description: 'Ready', timestamp: '18m', unread: true, status: 'success' },
  { id: 'c', category: 'activity', group: 'Today', title: 'Joined', description: 'Sea', timestamp: '1h' },
];

function renderCenter(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('NotificationCenter', () => {
  it('keeps the section and card geometry', () => {
    const screen = renderCenter(<NotificationCenter testID="nc" notifications={ITEMS} />);
    expect(resolvedStyle(screen.getByTestId('nc').props.style)).toMatchObject({
      maxWidth: 430,
      borderRadius: 24,
      borderWidth: 1,
      overflow: 'hidden',
    });
    expect(resolvedStyle(screen.getByTestId('notification-a').props.style)).toMatchObject({
      borderRadius: 10,
      padding: 12,
      gap: 12,
    });
    expect(resolvedStyle(screen.getByTestId('notification-b-disc').props.style)).toMatchObject({
      width: 40,
      height: 40,
    });
  });

  it('paints the neutral tokens from the ramps in dark mode', () => {
    const screen = renderCenter(<NotificationCenter testID="nc" notifications={ITEMS} />, 'dark');
    const { neutral } = resolveButtonRamps(buildTheme('teal', 'dark'));
    const section = resolvedStyle(screen.getByTestId('nc').props.style);
    expect(section.backgroundColor).toBe(neutral[900]);
    expect(section.borderColor).toBe(neutral[700]);
    expect(resolvedStyle(screen.getByTestId('notification-a').props.style).backgroundColor).toBe(neutral[800]);
  });

  it('counts unread, names the unread dot, and marks all read', () => {
    const onMarkAllRead = jest.fn();
    const screen = renderCenter(<NotificationCenter notifications={ITEMS} onMarkAllRead={onMarkAllRead} />);
    expect(screen.getByText('2 unread')).toBeTruthy();
    expect(screen.getByTestId('notification-a-unread').props.accessibilityLabel).toBe('Unread');
    fireEvent.press(screen.getByText('Mark all read'));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    expect(screen.getByText('No unread notifications')).toBeTruthy();
    expect(screen.queryByTestId('notification-a-unread')).toBeNull();
  });

  it('an action marks its notification read and reports both ids', () => {
    const onAction = jest.fn();
    const screen = renderCenter(<NotificationCenter notifications={ITEMS} onAction={onAction} />);
    fireEvent.press(screen.getByText('Reply'));
    expect(onAction).toHaveBeenCalledWith('a', 'reply');
    expect(screen.getByText('1 unread')).toBeTruthy();
  });

  it('filters by tab with counts, and shows the empty state', () => {
    const onTabChange = jest.fn();
    const screen = renderCenter(
      <NotificationCenter testID="nc" notifications={ITEMS} onTabChange={onTabChange} />,
    );
    const system = screen.getByTestId('nc-tab-system');
    expect(system.props.role).toBe('tab');
    expect(system.props['aria-selected']).toBe(false);
    fireEvent.press(system);
    expect(onTabChange).toHaveBeenCalledWith('system');
    expect(screen.queryByTestId('notification-a')).toBeNull();
    expect(screen.getByTestId('notification-b')).toBeTruthy();

    const empty = renderCenter(<NotificationCenter testID="e" notifications={[]} />);
    expect(resolvedStyle(empty.getByTestId('e-empty').props.style)).toMatchObject({ minHeight: 256 });
    expect(empty.getByText('You’re all caught up.')).toBeTruthy();
  });
});
