import type React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../dropdown-menu';
import { MenuSurfaceProvider } from '../floating/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderRows(children: React.ReactNode) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'sheet' }}>
        {children}
      </MenuSurfaceProvider>
    </BloomThemeProvider>,
  );
}

/** The out-of-flow indicator box 8px from the row's `side` edge. */
function indicatorSlots(tree: unknown, side: 'left' | 'right') {
  return hostNodes(tree).filter((node) => {
    const style = resolvedStyle(node.props.style);
    return style.position === 'absolute' && style[side] === 8 && style.width !== undefined;
  });
}

describe('the shared menu selection indicator', () => {
  it.each([
    [
      'checkbox',
      <DropdownMenuCheckboxItem key="checkbox" checked onCheckedChange={jest.fn()} testID="row">
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
  ])("%s keeps Bloom's selected mark in the leading gutter by default", (_kind, row) => {
    const rendered = renderRows(row);
    const rowStyle = resolvedStyle(rendered.getByTestId('row').props.style);

    // The leading gutter, and the plain inset on the trailing edge.
    expect(rowStyle.paddingLeft).toBeGreaterThanOrEqual(32);
    expect(rowStyle.paddingRight).toBe(8);

    const leadingSlots = indicatorSlots(rendered.toJSON(), 'left');
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
        testID="row"
      >
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
          testID="row"
        >
          Medium
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>,
    ],
  ])('%s composes a custom selected mark into the trailing gutter', (_kind, row) => {
    const rendered = renderRows(row);
    const rowStyle = resolvedStyle(rendered.getByTestId('row').props.style);

    expect(rendered.getByTestId('custom-indicator')).toBeTruthy();
    expect(rowStyle.paddingLeft).toBe(8);
    expect(rowStyle.paddingRight).toBeGreaterThanOrEqual(32);

    const trailingSlots = indicatorSlots(rendered.toJSON(), 'right');
    expect(trailingSlots).toHaveLength(1);
  });

  it('does not render a custom radio mark on an unchecked item', () => {
    const rendered = renderRows(
      <DropdownMenuRadioGroup value="medium" onValueChange={jest.fn()}>
        <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="high" indicator={<View testID="unchecked-indicator" />}>
          High
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>,
    );

    expect(rendered.queryByTestId('unchecked-indicator')).toBeNull();
  });
});
