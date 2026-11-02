import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

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

  it('is adjustable by an assistive technology: increment and decrement step it by keyboardStep', () => {
    const onValueChange = jest.fn();
    const onSlidingComplete = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Slider
        value={50}
        step={0.25}
        keyboardStep={6.25}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        accessibilityLabel="Volume"
        testID="slider"
      />,
    );
    const node = getByTestId('slider');
    // One element, reached by the platform's keyboard focus, offering the two actions.
    expect(node.props.accessible).toBe(true);
    expect(node.props.focusable).toBe(true);
    expect(node.props.accessibilityActions).toEqual([{ name: 'increment' }, { name: 'decrement' }]);
    fireEvent(node, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onValueChange).toHaveBeenLastCalledWith(56.25);
    expect(onSlidingComplete).toHaveBeenLastCalledWith(56.25);
    fireEvent(node, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onValueChange).toHaveBeenLastCalledWith(43.75);
  });

  it('steps by step without a keyboardStep, never past its ends, and is no stop while disabled', () => {
    const onValueChange = jest.fn();
    const { getByTestId, rerender } = renderWithTheme(
      <Slider
        value={100}
        onValueChange={onValueChange}
        accessibilityLabel="Volume"
        testID="slider"
      />,
    );
    fireEvent(getByTestId('slider'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent(getByTestId('slider'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onValueChange).toHaveBeenLastCalledWith(99);
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Slider
          value={40}
          onValueChange={onValueChange}
          disabled
          accessibilityLabel="Volume"
          testID="slider"
        />
      </BloomThemeProvider>,
    );
    expect(getByTestId('slider').props.focusable).toBe(false);
    fireEvent(getByTestId('slider'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('reads its formatted value: aria-valuetext from formatValue', () => {
    const { getByTestId } = renderWithTheme(
      <Slider
        value={40}
        onValueChange={() => {}}
        formatValue={(v) => `${v} %`}
        showTooltip={false}
        accessibilityLabel="Volume"
        testID="slider"
      />,
    );
    expect(getByTestId('slider').props['aria-valuetext']).toBe('40 %');
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

  it('steps each thumb by an assistive technology, within its neighbour', () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <RangeSlider
        value={[20, 70]}
        step={5}
        onValueChange={onValueChange}
        accessibilityLabel="Price"
      />,
    );
    const lower = getByLabelText('Minimum');
    expect(lower.props.accessibilityActions).toEqual([
      { name: 'increment' },
      { name: 'decrement' },
    ]);
    fireEvent(lower, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onValueChange).toHaveBeenLastCalledWith([25, 70]);
    fireEvent(getByLabelText('Maximum'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onValueChange).toHaveBeenLastCalledWith([20, 65]);
  });

  it('shows one value bubble per thumb, through formatValue', () => {
    const { getByText } = renderWithTheme(
      <RangeSlider
        value={[1, 9]}
        min={0}
        max={10}
        onValueChange={() => {}}
        formatValue={(v, i) => `${i}:${v}`}
      />,
    );
    expect(getByText('0:1')).toBeTruthy();
    expect(getByText('1:9')).toBeTruthy();
  });
});
