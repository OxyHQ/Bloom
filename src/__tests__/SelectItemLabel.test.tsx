import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomScope } from '../appearance';
import { resolvedStyle } from './support/rendered-style';
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
 * `SelectItem` renders a web option or native radio. A choice with no accessible
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
    expect(_platform === 'web' ? item.props.role : item.props.accessibilityRole).toBe(
      _platform === 'web' ? 'option' : 'radio',
    );
    expect(item.props[_platform === 'web' ? 'aria-selected' : 'aria-checked']).toBe(true);
  });

  /** Options inherit the shared scope independently of an explicit trigger size. */
  it.each([
    ['xs', 12],
    ['sm', 13],
    ['md', 14],
    ['lg', 16],
  ] as const)('takes the %s list size for its own type ramp', (size, fontSize) => {
    const tree = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <BloomScope size={size}>
          <Select value="a" size="lg">
            <SelectItem value="a" label="Option A">
              <SelectItemText>Option A</SelectItemText>
            </SelectItem>
          </Select>
        </BloomScope>
      </BloomThemeProvider>,
    );

    expect(resolvedStyle(tree.getByText('Option A').props.style).fontSize).toBe(fontSize);
  });
});
