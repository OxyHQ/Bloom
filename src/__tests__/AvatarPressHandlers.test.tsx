import { fireEvent, render } from '@testing-library/react-native';

import { Avatar } from '../avatar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

describe('Avatar forwards its pressable’s own press, hover and focus', () => {
  it('each handler reaches the pressable, which only onPress makes a button', () => {
    const onPressIn = jest.fn();
    const onHoverIn = jest.fn();
    const onFocus = jest.fn();
    const { getByTestId, rerender, UNSAFE_root } = render(
      <BloomThemeProvider>
        <Avatar
          testID="a"
          name="Ada"
          onPressIn={onPressIn}
          onHoverIn={onHoverIn}
          onFocus={onFocus}
        />
      </BloomThemeProvider>,
    );
    const buttons = () => UNSAFE_root.findAll((node) => node.props.accessibilityRole === 'button');
    expect(buttons()).toHaveLength(0);
    fireEvent(getByTestId('a'), 'pressIn');
    fireEvent(getByTestId('a'), 'hoverIn');
    fireEvent(getByTestId('a'), 'focus');
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onHoverIn).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    rerender(
      <BloomThemeProvider>
        <Avatar testID="a" name="Ada" onPress={() => {}} onPressIn={onPressIn} />
      </BloomThemeProvider>,
    );
    expect(buttons()).not.toHaveLength(0);
  });
});
