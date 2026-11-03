import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Stepper } from '../stepper';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

describe.each(['separate', 'outline'] as const)('native Stepper %s', (appearance) => {
  it('keeps adjustable increment/decrement bounded and never maps them to removal', () => {
    const change = jest.fn();
    const remove = jest.fn();
    const { getByTestId } = render(
      <BloomThemeProvider>
        <Stepper
          appearance={appearance}
          value={1}
          min={1}
          max={3}
          onValueChange={change}
          onRemove={remove}
          testID="stepper"
          accessibilityLabel="Quantity"
        />
      </BloomThemeProvider>,
    );
    fireEvent(getByTestId('stepper-value'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(change).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    fireEvent(getByTestId('stepper-value'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(change).toHaveBeenCalledWith(2);
    fireEvent.press(getByTestId('stepper-decrement'));
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe.each(['separate', 'outline'] as const)('native Stepper %s from the keyboard', (appearance) => {
  it('is one keyboard stop, its value; the buttons beside it are none', () => {
    const { getAllByTestId } = render(
      <BloomThemeProvider>
        <Stepper
          appearance={appearance}
          value={2}
          min={1}
          max={3}
          onValueChange={jest.fn()}
          testID="stepper"
          accessibilityLabel="Quantity"
        />
      </BloomThemeProvider>,
    );
    const host = (id: string) => {
      const all = getAllByTestId(id);
      return all.find((node) => typeof node.type === 'string') ?? all[0]!;
    };
    expect(host('stepper-value').props.focusable).toBe(true);
    expect(host('stepper-value').props.accessible).toBe(true);
    expect(host('stepper-decrement').props.tabIndex).toBe(-1);
    expect(host('stepper-increment').props.tabIndex).toBe(-1);
  });
});
