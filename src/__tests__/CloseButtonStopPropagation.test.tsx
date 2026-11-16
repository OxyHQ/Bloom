import { RiCloseLine as DismissActionIcon } from '../icons/remix/RiCloseLine';
/**
 * `CloseButton`'s `stopPropagation`, like `Button`'s: the dismiss X on a
 * pressable card hands over the press event and, on request, stops it.
 */
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderClose(props: Partial<React.ComponentProps<typeof Button>>) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Button
        appearance="outline"
        tone="neutral"
        iconOnly
        icon={DismissActionIcon}
        size={20}
        accessibilityLabel="Dismiss"
        testID="close"
        {...props}
      />
    </BloomThemeProvider>,
  );
}

const pressEvent = () => ({ nativeEvent: {}, stopPropagation: jest.fn() });

describe('CloseButton stopPropagation', () => {
  it('passes the event and leaves it alone by default', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderClose({ onPress });
    const event = pressEvent();
    fireEvent.press(getByTestId('close'), event);
    expect(onPress).toHaveBeenCalledWith(event);
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it('stops the event when asked', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderClose({ onPress, stopPropagation: true });
    const event = pressEvent();
    fireEvent.press(getByTestId('close'), event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a disabled button stops nothing and calls nothing', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderClose({ onPress, stopPropagation: true, disabled: true });
    expect(getByTestId('close').props.accessibilityState).toMatchObject({ disabled: true });
    expect(onPress).not.toHaveBeenCalled();
  });
});

it('preserves native disc geometry and existing hit slop', () => {
  const { getByTestId } = renderClose({ size: 'md' });
  const close = getByTestId('close');
  expect(StyleSheet.flatten(close.props.style)).toMatchObject({ width: 36, height: 36 });
  expect(close.props.hitSlop).toEqual({ top: 4, bottom: 4, left: 4, right: 4 });
});
