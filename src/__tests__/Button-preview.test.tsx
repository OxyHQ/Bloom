import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      primary: '#166534',
      primaryForeground: '#ffffff',
      card: '#ffffff',
      background: '#ffffff',
      backgroundSecondary: '#eeeeee',
      backgroundTertiary: '#dddddd',
      text: '#17251e',
      textTertiary: '#888888',
    },
  }),
}));
import { Button } from '../button/Button';

it('balances native preview callbacks without activating, including disable during a hold', () => {
  const enter = jest.fn(),
    exit = jest.fn(),
    press = jest.fn();
  const ui = (disabled = false) => (
    <Button testID="button" disabled={disabled} onPressIn={enter} onPressOut={exit} onPress={press}>
      Preview
    </Button>
  );
  const screen = render(ui());
  fireEvent(screen.getByTestId('button'), 'pressIn');
  fireEvent(screen.getByTestId('button'), 'pressIn');
  expect(enter).toHaveBeenCalledTimes(1);
  screen.rerender(ui(true));
  expect(exit).toHaveBeenCalledTimes(1);
  fireEvent(screen.getByTestId('button'), 'pressOut');
  expect(exit).toHaveBeenCalledTimes(1);
  expect(press).not.toHaveBeenCalled();
});
