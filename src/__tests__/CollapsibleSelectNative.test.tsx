import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
const mockControl = {
  id: 'select',
  ref: { current: null },
  open: jest.fn(),
  close: jest.fn(),
};
jest.mock('../dialog/context', () => ({
  ...jest.requireActual('../dialog/context'),
  useDialogControl: () => mockControl,
}));
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}));
import { Select, SelectTrigger } from '../select/Select';
import { Collapsible } from '../collapsible/Collapsible';
it('closes the native Select owner when its logical body hides and prevents hidden reopening', () => {
  const draw = (open: boolean) => (
    <BloomThemeProvider>
      <Collapsible open={open}>
        <Select defaultValue="monthly">
          <SelectTrigger label="Frequency">
            <Text>Monthly</Text>
          </SelectTrigger>
        </Select>
      </Collapsible>
    </BloomThemeProvider>
  );
  const ui = render(draw(true));
  fireEvent.press(ui.getByLabelText('Frequency'));
  expect(mockControl.open).toHaveBeenCalledTimes(1);
  ui.rerender(draw(false));
  expect(mockControl.close).toHaveBeenCalledTimes(1);
  fireEvent.press(
    ui.getByLabelText('Frequency', { includeHiddenElements: true }),
  );
  expect(mockControl.open).toHaveBeenCalledTimes(1);
  ui.rerender(draw(true));
  expect(mockControl.open).toHaveBeenCalledTimes(1);
  fireEvent.press(ui.getByLabelText('Frequency'));
  expect(mockControl.open).toHaveBeenCalledTimes(2);
});
