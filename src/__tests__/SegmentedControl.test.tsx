/**
 * `type` is `SegmentedControl`'s one real decision, and it is an ACCESSIBILITY
 * one wearing visual clothes: `radio` picks a value, `tabs` switches the panel
 * below. The two render identically, so choosing wrong is invisible on screen
 * and wrong in every screen reader.
 *
 * The state spelling follows the role, and that is the part a prop-level test
 * cannot see: ARIA gives `tab` a SELECTED state and `radio` a CHECKED one, so
 * one spelling for both is invalid in one of the two modes — and
 * react-native-web drops `accessibilityState` entirely, so a control that set
 * only that would announce nothing at all on web.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';

function renderControl(
  type: 'radio' | 'tabs',
  value: 'a' | 'b',
  onChange: (next: 'a' | 'b') => void = () => {},
) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <SegmentedControl label="Section" type={type} value={value} onChange={onChange}>
        <SegmentedControlItem value="a" testID="a">
          <SegmentedControlItemText>A</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="b" testID="b">
          <SegmentedControlItemText>B</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
    </BloomThemeProvider>,
  );
}

describe('SegmentedControl', () => {
  it('announces radio segments as checked / unchecked', () => {
    const { getByTestId } = renderControl('radio', 'a');
    expect(getByTestId('a').props.role).toBe('radio');
    expect(getByTestId('a').props['aria-checked']).toBe(true);
    expect(getByTestId('b').props['aria-checked']).toBe(false);
  });

  it('announces tab segments as selected, never checked', () => {
    const { getByTestId } = renderControl('tabs', 'a');
    expect(getByTestId('a').props.role).toBe('tab');
    expect(getByTestId('a').props['aria-selected']).toBe(true);
    expect(getByTestId('b').props['aria-selected']).toBe(false);
    // `aria-checked` on a `tab` is invalid ARIA, so the wrong spelling must be
    // absent rather than merely additionally present.
    expect(getByTestId('a').props['aria-checked']).toBeUndefined();
  });

  it('reports the pressed segment value to the caller', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderControl('radio', 'a', onChange);
    fireEvent.press(getByTestId('b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('is controlled — pressing does not move the state by itself', () => {
    const { getByTestId } = renderControl('radio', 'a');
    fireEvent.press(getByTestId('b'));
    expect(getByTestId('a').props['aria-checked']).toBe(true);
    expect(getByTestId('b').props['aria-checked']).toBe(false);
  });

  it('renders each segment label', () => {
    const { getByText } = renderControl('radio', 'a');
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });

  it('refuses to render a segment outside a control rather than mis-announcing one', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <BloomThemeProvider mode="light" colorPreset="oxy">
          <SegmentedControlItem value="a">
            <SegmentedControlItemText>A</SegmentedControlItemText>
          </SegmentedControlItem>
        </BloomThemeProvider>,
      ),
    ).toThrow(/must be used within a SegmentedControl/);
    spy.mockRestore();
  });
});
