import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { MeetingScheduler } from '../date-picker';
import { pressHost } from './support/press-host';

const day = (d: number) => new Date(2026, 8, d);
const iso = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const HOST = { name: 'Maya Collins', email: 'hi@example.com', avatarInitial: 'M' };
const MEETING = {
  title: '30 min intro meeting',
  description: 'Discuss',
  durationMinutes: 30,
  language: 'English',
  conferencing: 'Google meet',
};

function renderScheduler(props: Partial<React.ComponentProps<typeof MeetingScheduler>> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MeetingScheduler host={HOST} meeting={MEETING} timezone="Amsterdam" testID="ms" {...props} />
    </BloomThemeProvider>,
  );
}

describe('MeetingScheduler', () => {
  it('renders the host card, the meeting summary and the timezone when open', () => {
    const { getByText } = renderScheduler({ defaultOpen: true, defaultValue: { date: day(16), time: null } });
    expect(getByText('Maya Collins')).toBeTruthy();
    expect(getByText('hi@example.com')).toBeTruthy();
    expect(getByText('30 min intro meeting')).toBeTruthy();
    expect(getByText('30 minutes')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
    expect(getByText('Amsterdam')).toBeTruthy();
    expect(getByText('Select a time')).toBeTruthy();
  });

  it('generates half-hour slots from 09:00 to 18:30', () => {
    const { getByTestId, queryByTestId } = renderScheduler({ defaultOpen: true });
    expect(getByTestId('ms-slot-09:00')).toBeTruthy();
    expect(getByTestId('ms-slot-18:30')).toBeTruthy();
    expect(queryByTestId('ms-slot-19:00')).toBeNull();
  });

  it('keeps Send disabled until a time is picked, then commits day and time', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderScheduler({
      defaultOpen: true,
      defaultValue: { date: day(16), time: null },
      onChange,
    });
    act(() => {
      fireEvent.press(getByTestId('ms-send'));
    });
    expect(onChange).not.toHaveBeenCalled();
    pressHost(getByTestId('ms-calendar-month-0-day-20'));
    pressHost(getByTestId('ms-slot-14:30'));
    expect(onChange).not.toHaveBeenCalled();
    expect(getByTestId('ms-slot-14:30').props['aria-checked']).toBe(true);
    act(() => {
      fireEvent.press(getByTestId('ms-send'));
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(iso(onChange.mock.calls[0][0].date)).toBe('2026-9-20');
    expect(onChange.mock.calls[0][0].time).toBe('14:30');
  });

  it('switches the slot labels to 12h', () => {
    const { getByLabelText, getByText, queryByText } = renderScheduler({ defaultOpen: true });
    expect(getByText('14:00')).toBeTruthy();
    pressHost(getByLabelText('12h'));
    expect(getByText('2:00 PM')).toBeTruthy();
    expect(queryByText('14:00')).toBeNull();
  });
});
