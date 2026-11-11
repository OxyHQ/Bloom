import { fireEvent, render, screen } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ColorSwatchPicker } from '../color-swatch-picker';
import { BloomScope } from '../appearance';
import { resolvedStyle } from './support/rendered-style';

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

  it('keeps numeric swatch artwork size independent from BloomScope', () => {
    const defaultSize = render(
      <BloomThemeProvider>
        <BloomScope size="lg">
          <ColorSwatchPicker
            label="Brand colour"
            value="#3b82f6"
            onValueChange={() => undefined}
            colors={['#3b82f6']}
            names={{ '#3b82f6': 'Blue' }}
          />
        </BloomScope>
      </BloomThemeProvider>,
    );
    const blue = defaultSize.getByLabelText('Blue');
    const dimensions = blue
      .findAll((node) => typeof node.type === 'string')
      .map((node) => resolvedStyle(node.props.style).width)
      .filter((width) => width === 50 || width === 40);
    expect(dimensions).toEqual([50, 40]);

    const explicit = render(
      <BloomThemeProvider>
        <BloomScope size="xs">
          <ColorSwatchPicker
            label="Brand colour"
            value="#3b82f6"
            onValueChange={() => undefined}
            colors={['#3b82f6']}
            names={{ '#3b82f6': 'Blue' }}
            size={24}
          />
        </BloomScope>
      </BloomThemeProvider>,
    );
    const custom = explicit.getByLabelText('Blue');
    expect(resolvedStyle(custom.props.style)).toMatchObject({ minWidth: 44, minHeight: 44 });
    const customDimensions = custom
      .findAll((node) => typeof node.type === 'string')
      .map((node) => resolvedStyle(node.props.style).width)
      .filter((width) => width === 34 || width === 24);
    expect(customDimensions).toEqual([34, 24]);
  });
});
