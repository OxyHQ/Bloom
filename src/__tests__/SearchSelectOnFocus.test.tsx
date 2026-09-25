/**
 * `Search` selects its query on a PRESSED focus, and never through RN's
 * `selectTextOnFocus` (OxyHQ/Mention#1126).
 *
 * On Android that prop does not select on focus. It arms a one-shot flag and
 * calls `selectAll()` on the input's next layout while focused. An autofocused
 * search lays nothing out after focusing until the first keystroke mounts the
 * clear button and pads the input for it, so that layout selected everything
 * and the second keystroke replaced the query: "mention" typed in one burst
 * came out as "on". Jest cannot run that layout, so these tests pin the
 * contract that replaces it. The prop is gone, a press-driven focus selects
 * once in `onFocus`, and a programmatic focus selects nothing.
 */
import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Search } from '../search';

const setSelection = jest.fn();

function renderSearch(props: Partial<React.ComponentProps<typeof Search>> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <Search value="mention" onChangeText={() => {}} testID="search" {...props} />
    </BloomThemeProvider>,
    { createNodeMock: () => ({ setSelection, focus: jest.fn(), blur: jest.fn() }) },
  );
}

beforeEach(() => {
  setSelection.mockClear();
  Platform.OS = 'android';
});

afterEach(() => {
  Platform.OS = 'ios';
});

describe('Search select-on-focus', () => {
  it('never hands the input RN selectTextOnFocus', () => {
    const { getByTestId } = renderSearch();
    expect(getByTestId('search').props.selectTextOnFocus).toBeUndefined();
  });

  it('selects the whole query once when a press focuses it', () => {
    const { getByTestId } = renderSearch();
    const input = getByTestId('search');
    fireEvent(input, 'pressIn', {});
    fireEvent(input, 'focus', {});
    expect(setSelection).toHaveBeenCalledTimes(1);
    expect(setSelection).toHaveBeenCalledWith(0, 'mention'.length);

    // A later focus that no press started (a return from the background, a
    // `ref.focus()`) must not select again.
    fireEvent(input, 'blur', {});
    fireEvent(input, 'focus', {});
    expect(setSelection).toHaveBeenCalledTimes(1);
  });

  it('selects nothing on a programmatic focus, such as autoFocus', () => {
    const { getByTestId } = renderSearch({ autoFocus: true });
    fireEvent(getByTestId('search'), 'focus', {});
    expect(setSelection).not.toHaveBeenCalled();
  });

  it('keeps the caller onFocus and onPressIn', () => {
    const onFocus = jest.fn();
    const onPressIn = jest.fn();
    const { getByTestId } = renderSearch({ onFocus, onPressIn });
    const input = getByTestId('search');
    fireEvent(input, 'pressIn', {});
    fireEvent(input, 'focus', {});
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('does not select on web, which never did', () => {
    Platform.OS = 'web';
    const { getByTestId } = renderSearch();
    const input = getByTestId('search');
    fireEvent(input, 'pressIn', {});
    fireEvent(input, 'focus', {});
    expect(setSelection).not.toHaveBeenCalled();
  });
});
