import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Slider } from '../slider';

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
    expect(node.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });
  });

  it('reflects the disabled state', () => {
    const { getByTestId } = renderWithTheme(
      <Slider value={0} onValueChange={() => {}} disabled testID="slider" />,
    );
    expect(getByTestId('slider').props.accessibilityState).toEqual({ disabled: true });
  });

  it('renders without crashing for fractional steps', () => {
    const { getByTestId } = renderWithTheme(
      <Slider value={0.5} min={0} max={1} step={0.1} onValueChange={() => {}} testID="slider" />,
    );
    expect(getByTestId('slider')).toBeTruthy();
  });
});
