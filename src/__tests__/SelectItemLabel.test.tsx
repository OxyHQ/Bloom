import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
// Imported by explicit filename: jest has no platform-extension resolution, so
// `'../select'` would silently exercise the NATIVE fork — which has always
// applied the label — and the suite would pass no matter what the web fork did.
import {
  Select as WebSelect,
  SelectItem as WebSelectItem,
  SelectItemText as WebSelectItemText,
} from '../select/index.web';
import {
  Select as NativeSelect,
  SelectItem as NativeSelectItem,
  SelectItemText as NativeSelectItemText,
} from '../select/index';

/**
 * `SelectItem` renders `accessibilityRole="radio"`. A radio with no accessible
 * name is announced as nothing at all, and the web fork declared `label` in its
 * props type and then dropped it on the floor — invisible to `tsc`, since an
 * unused destructured prop is not an error.
 *
 * Both forks are asserted from one file so the platforms cannot drift again.
 */
describe.each([
  ['web', WebSelect, WebSelectItem, WebSelectItemText] as const,
  ['native', NativeSelect, NativeSelectItem, NativeSelectItemText] as const,
])('SelectItem (%s fork)', (_platform, Select, SelectItem, SelectItemText) => {
  it('exposes its label as the accessible name', () => {
    const { getByLabelText } = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Select value="a">
          <SelectItem value="a" label="Option A">
            <SelectItemText>Option A</SelectItemText>
          </SelectItem>
        </Select>
      </BloomThemeProvider>,
    );

    const item = getByLabelText('Option A');
    expect(item).toBeTruthy();
    expect(item.props.accessibilityRole).toBe('radio');
  });
});
