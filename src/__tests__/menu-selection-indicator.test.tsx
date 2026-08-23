import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../dropdown-menu';
import { MenuSurfaceProvider } from '../floating/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { classNamesOn, hostNodes } from './support/rendered-style';

function renderRows(children: React.ReactNode) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'sheet' }}>
        {children}
      </MenuSurfaceProvider>
    </BloomThemeProvider>,
  );
}

function classTokens(style: unknown): string[] {
  return classNamesOn(style).flatMap((className) => className.split(/\s+/));
}

describe('the shared menu selection indicator', () => {
  it.each([
    [
      'checkbox',
      <DropdownMenuCheckboxItem
        key="checkbox"
        checked
        onCheckedChange={jest.fn()}
        testID="row">
        Grid
      </DropdownMenuCheckboxItem>,
    ],
    [
      'radio',
      <DropdownMenuRadioGroup key="radio" value="medium" onValueChange={jest.fn()}>
        <DropdownMenuRadioItem value="medium" testID="row">
          Medium
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>,
    ],
  ])('%s keeps Bloom\'s selected mark in the leading gutter by default', (_kind, row) => {
    const rendered = renderRows(row);
    const rowTokens = classTokens(rendered.getByTestId('row').props.style);

    expect(rowTokens).toContain('pl-space-32');
    expect(rowTokens).toContain('pr-space-8');

    const leadingSlots = hostNodes(rendered.toJSON()).filter((node) => {
      const tokens = classTokens(node.props.style);
      return tokens.includes('absolute') && tokens.includes('left-space-8');
    });
    expect(leadingSlots).toHaveLength(1);
    expect(leadingSlots[0]?.children?.length).toBeGreaterThan(0);
  });

  it.each([
    [
      'checkbox',
      <DropdownMenuCheckboxItem
        key="checkbox"
        checked
        onCheckedChange={jest.fn()}
        indicatorPosition="trailing"
        indicator={<View testID="custom-indicator" />}
        testID="row">
        Grid
      </DropdownMenuCheckboxItem>,
    ],
    [
      'radio',
      <DropdownMenuRadioGroup key="radio" value="medium" onValueChange={jest.fn()}>
        <DropdownMenuRadioItem
          value="medium"
          indicatorPosition="trailing"
          indicator={<View testID="custom-indicator" />}
          testID="row">
          Medium
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>,
    ],
  ])('%s composes a custom selected mark into the trailing gutter', (_kind, row) => {
    const rendered = renderRows(row);
    const rowTokens = classTokens(rendered.getByTestId('row').props.style);

    expect(rendered.getByTestId('custom-indicator')).toBeTruthy();
    expect(rowTokens).toContain('pl-space-8');
    expect(rowTokens).toContain('pr-space-32');

    const trailingSlots = hostNodes(rendered.toJSON()).filter((node) => {
      const tokens = classTokens(node.props.style);
      return tokens.includes('absolute') && tokens.includes('right-space-8');
    });
    expect(trailingSlots).toHaveLength(1);
  });

  it('does not render a custom radio mark on an unchecked item', () => {
    const rendered = renderRows(
      <DropdownMenuRadioGroup value="medium" onValueChange={jest.fn()}>
        <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="high"
          indicator={<View testID="unchecked-indicator" />}>
          High
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>,
    );

    expect(rendered.queryByTestId('unchecked-indicator')).toBeNull();
  });
});
