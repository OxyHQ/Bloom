import { fireEvent, render, screen } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ColorSwatchPicker } from '../color-swatch-picker';

describe('ColorSwatchPicker', () => {
  it('names each swatch, marks the chosen one and reports a press', () => {
    const onValueChange = jest.fn();
    render(
      <BloomThemeProvider>
        <ColorSwatchPicker
          label="Brand colour"
          value="#3b82f6"
          onValueChange={onValueChange}
          colors={['#3b82f6', '#ef4444']}
          names={{ '#ef4444': 'Red' }}
        />
      </BloomThemeProvider>,
    );

    expect(screen.getByLabelText('Brand colour')).toBeTruthy();
    expect(screen.getByLabelText('#3b82f6').props.accessibilityState.selected).toBe(true);
    const red = screen.getByLabelText('Red');
    expect(red.props.accessibilityState.selected).toBe(false);
    fireEvent.press(red);
    expect(onValueChange).toHaveBeenCalledWith('#ef4444');
  });
});
