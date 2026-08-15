/**
 * Two controls whose defects are silent rather than visual.
 *
 * `Switch` is the canonical case of the web accessibility-state rule: it must
 * carry `aria-checked` (which react-native-web reads and RN folds back into
 * `accessibilityState`) and must let its `disabled` PROP carry the disabled
 * state, because `Pressable` appends its own `aria-disabled` after spreading
 * the caller's props and would overwrite a hand-written one.
 *
 * `Search` shows the clear button only when there is something to clear — a
 * clear button on an empty field is a dead target, and one missing on a full
 * field strands the user with no way back to the unfiltered list.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Switch } from '../switch';
import { Search } from '../search';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Switch', () => {
  it('announces its state through aria-checked, the spelling both platforms read', () => {
    const off = renderWithTheme(<Switch value={false} onValueChange={() => {}} testID="s" />);
    expect(off.getByTestId('s').props['aria-checked']).toBe(false);

    const on = renderWithTheme(<Switch value onValueChange={() => {}} testID="s" />);
    expect(on.getByTestId('s').props['aria-checked']).toBe(true);
  });

  it('carries the switch role', () => {
    const { getByTestId } = renderWithTheme(
      <Switch value={false} onValueChange={() => {}} testID="s" />,
    );
    expect(getByTestId('s').props.role).toBe('switch');
  });

  it('toggles to the opposite of its current value', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Switch value onValueChange={onValueChange} testID="s" />,
    );
    fireEvent.press(getByTestId('s'));
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('does not fire when disabled, and says so on the prop Pressable owns', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Switch value={false} onValueChange={onValueChange} disabled testID="s" />,
    );
    // The state must travel on `disabled`: react-native-web's Pressable appends
    // its own `aria-disabled` AFTER the caller's props, so a hand-written one is
    // silently overwritten.
    expect(getByTestId('s').props.disabled).toBe(true);
    fireEvent.press(getByTestId('s'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('Search', () => {
  it('shows no clear button for an empty query', () => {
    const { queryByTestId } = renderWithTheme(<Search value="" onChangeText={() => {}} />);
    expect(queryByTestId('searchTextInputClearBtn')).toBeNull();
  });

  it('shows the clear button once there is something to clear', () => {
    const { getByTestId } = renderWithTheme(<Search value="bloom" onChangeText={() => {}} />);
    expect(getByTestId('searchTextInputClearBtn')).toBeTruthy();
  });

  it('reports the clear press to the caller rather than clearing itself', () => {
    // `Search` is controlled: clearing its own value would fight the caller's
    // state and leave the list filtered by a query the field no longer shows.
    const onClearText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Search value="bloom" onChangeText={() => {}} onClearText={onClearText} />,
    );
    fireEvent.press(getByTestId('searchTextInputClearBtn'));
    expect(onClearText).toHaveBeenCalledTimes(1);
  });

  it('labels itself Search by default and takes an override', () => {
    const fallback = renderWithTheme(<Search value="" onChangeText={() => {}} />);
    expect(fallback.getAllByPlaceholderText('Search').length).toBeGreaterThan(0);

    const custom = renderWithTheme(
      <Search value="" label="Find a person" onChangeText={() => {}} />,
    );
    expect(custom.getAllByPlaceholderText('Find a person').length).toBeGreaterThan(0);
  });
});
