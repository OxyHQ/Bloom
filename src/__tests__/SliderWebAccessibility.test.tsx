import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Slider } from '../slider';
jest.mock('../styles/platform', () => ({
  ...jest.requireActual('../styles/platform'),
  IS_WEB: true,
}));

it('places the web slider semantics and keyboard controls on the same focusable thumb', () => {
  const change = jest.fn();
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <Slider
        testID="width"
        accessibilityLabel="Column width"
        value={390}
        min={280}
        max={620}
        step={10}
        onValueChange={change}
      />
    </BloomThemeProvider>,
  );
  const thumb = tree.getByLabelText('Column width');
  expect(tree.getByTestId('width').props.accessibilityRole).toBeUndefined();
  expect(thumb.props.accessibilityRole).toBe('adjustable');
  expect(thumb.props.tabIndex).toBe(0);
  expect(thumb.props['aria-valuenow']).toBe(390);
  fireEvent(thumb, 'keyDown', { key: 'End', preventDefault: jest.fn() });
  expect(change).toHaveBeenLastCalledWith(620);
  fireEvent(thumb, 'keyDown', { key: 'Home', preventDefault: jest.fn() });
  expect(change).toHaveBeenLastCalledWith(280);
});

it('removes a disabled web thumb from keyboard focus', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <Slider accessibilityLabel="Column width" value={390} disabled onValueChange={() => {}} />
    </BloomThemeProvider>,
  );
  expect(tree.getByLabelText('Column width').props.tabIndex).toBe(-1);
  expect(tree.getByLabelText('Column width').props['aria-disabled']).toBe(true);
});
