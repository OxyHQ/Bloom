import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
// Both forks by explicit filename: jest resolves no platform extensions.
import {
  Select as WebSelect,
  SelectTrigger as WebSelectTrigger,
  SelectValue as WebSelectValue,
} from '../select/index.web';
import {
  Select as NativeSelect,
  SelectTrigger as NativeSelectTrigger,
  SelectValue as NativeSelectValue,
} from '../select/index';

const LONG = 'Raspberry + Antique Gold + Cobalt';

/**
 * A select trigger is never wider than the line it is on, and its value gives
 * way to the chevron. Measured in Allo's Appearance "Colour" row on a Pixel 8a:
 * the trigger kept its full content width, so the pill and its chevron ran past
 * the card's edge. Yoga measures an `auto` item at most the line's width, but a
 * non-shrinking item keeps a min-content wider than that, and a non-shrinking
 * value text pushes the chevron out of the pill.
 */
describe.each([
  ['web', WebSelect, WebSelectTrigger, WebSelectValue] as const,
  ['native', NativeSelect, NativeSelectTrigger, NativeSelectValue] as const,
])('SelectTrigger fit (%s fork)', (_platform, Select, SelectTrigger, SelectValue) => {
  it('shrinks to its line and truncates the value', () => {
    const { getByTestId, getByText } = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Select value={LONG}>
          <SelectTrigger label="Colour" testID="trigger">
            <SelectValue placeholder={LONG} />
          </SelectTrigger>
        </Select>
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(getByTestId('trigger').props.style)).toMatchObject({
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '100%',
    });
    const value = getByText(LONG);
    expect(value.props.numberOfLines).toBe(1);
    expect(resolvedStyle(value.props.style)).toMatchObject({ flexShrink: 1, minWidth: 0 });
  });
});
