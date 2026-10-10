import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RatingInput } from '../rating/RatingInput';

it.each(['ios', 'android'] as const)(
  'keeps %s touch selection on the named radio while decoration changes',
  (platform) => {
    const previous = Platform.OS;
    Platform.OS = platform;
    const onChange = jest.fn();
    function Picker({ disabled = false }: { disabled?: boolean }) {
      const [value, setValue] = useState<number | null>(null);
      return (
        <BloomThemeProvider mode="light">
          <RatingInput
            value={value}
            disabled={disabled}
            onChange={(next) => {
              onChange(next);
              setValue(next);
            }}
            accessibilityLabel="Rating"
            testID="picker"
          />
        </BloomThemeProvider>
      );
    }
    try {
      const api = render(<Picker />);
      const radio = () => api.getByTestId('picker-star-4');
      expect(radio().props.accessibilityRole).toBe('radio');
      const decoration = radio()
        .findAllByType(View)
        .find((node) => node.props.pointerEvents === 'none');
      expect(decoration?.props.accessibilityElementsHidden).toBe(true);
      expect(decoration?.props.importantForAccessibility).toBe('no-hide-descendants');
      fireEvent(radio(), 'hoverIn');
      expect(radio().props['aria-checked']).toBe(false);
      fireEvent.press(radio());
      expect(radio().props['aria-checked']).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
      fireEvent.press(radio());
      expect(onChange).toHaveBeenCalledTimes(1);
      api.rerender(<Picker disabled />);
      fireEvent.press(api.getByTestId('picker-star-5'));
      expect(onChange).toHaveBeenCalledTimes(1);
    } finally {
      Platform.OS = previous;
    }
  },
);
