import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RangeSlider, Slider } from '../slider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Slider', () => {
  it('renders with the adjustable accessibility role and value', () => {
    const { getByTestId } = renderWithTheme(
      <Slider value={40} min={0} max={100} onValueChange={() => {}} testID="slider" />,
    );
    const node = getByTestId('slider');
    expect(node.props.accessibilityRole).toBe('adjustable');
    // The FLAT `aria-value*` props, not the `accessibilityValue` object:
    // react-native-web has no handling for the object form at all, so the
    // object shape rendered a `role="slider"` carrying no value on web.
    // React Native folds these three back into `accessibilityValue`.
    expect(node.props['aria-valuemin']).toBe(0);
    expect(node.props['aria-valuemax']).toBe(100);
    expect(node.props['aria-valuenow']).toBe(40);
  });

  it('reflects the disabled state', () => {
    const { getByTestId } = renderWithTheme(
      <Slider value={0} onValueChange={() => {}} disabled testID="slider" />,
    );
    // A `View` has no `disabled` prop for react-native-web to read, and it
    // ignores `accessibilityState`, so `aria-disabled` is the only spelling
    // that reaches the DOM.
    expect(getByTestId('slider').props['aria-disabled']).toBe(true);
  });

  it('renders without crashing for fractional steps', () => {
    const { getByTestId } = renderWithTheme(
      <Slider value={0.5} min={0} max={1} step={0.1} onValueChange={() => {}} testID="slider" />,
    );
    expect(getByTestId('slider')).toBeTruthy();
  });
});

describe('RangeSlider', () => {
  it('gives each thumb its own adjustable role, name and value, bounded by its neighbour', () => {
    const { getByLabelText } = renderWithTheme(
      <RangeSlider value={[20, 70]} onValueChange={() => {}} accessibilityLabel="Price" />,
    );
    const lower = getByLabelText('Minimum');
    const upper = getByLabelText('Maximum');
    expect(lower.props.accessibilityRole).toBe('adjustable');
    expect(lower.props['aria-valuenow']).toBe(20);
    expect(lower.props['aria-valuemin']).toBe(0);
    expect(lower.props['aria-valuemax']).toBe(70);
    expect(upper.props['aria-valuenow']).toBe(70);
    expect(upper.props['aria-valuemin']).toBe(20);
    expect(upper.props['aria-valuemax']).toBe(100);
  });

  it('shows one value bubble per thumb, through formatValue', () => {
    const { getByText } = renderWithTheme(
      <RangeSlider value={[1, 9]} min={0} max={10} onValueChange={() => {}} formatValue={(v, i) => `${i}:${v}`} />,
    );
    expect(getByText('0:1')).toBeTruthy();
    expect(getByText('1:9')).toBeTruthy();
  });
});
