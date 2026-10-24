/**
 * `alignRows`: under an aligned menu surface every row lines up with the rows
 * that draw something at their leading edge — the check / radio indicator's
 * gutter, and a `leading` icon's slot — the way a desktop menu's do. Without
 * the opt-in a row keeps exactly the layout it had (per-row `inset`).
 *
 * Rendered through the native row (jest resolves `.tsx`); the row shell is the
 * one both platforms draw. The real-browser half, label edges measured in
 * Chrome, is `scripts/verify-submenu-flyout.mjs`.
 */
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuLabel } from '../dropdown-menu';
import { MenuSurfaceProvider } from '../floating/context';
import { MenuRowAlignmentScope } from '../floating/menu-row-alignment';
import { resolveMenuDensity } from '../floating/use-menu-density';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const density = resolveMenuDensity('md', false);

function renderMenu(aligned: boolean | undefined, rows: React.ReactNode) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'sheet' }}>
        <MenuRowAlignmentScope enabled={aligned}>{rows}</MenuRowAlignmentScope>
      </MenuSurfaceProvider>
    </BloomThemeProvider>,
  );
}

const paddingLeftOf = (screen: ReturnType<typeof render>, label: string) =>
  resolvedStyle(screen.getByLabelText(label).props.style).paddingLeft;

const leadingSlots = (screen: ReturnType<typeof render>, label: string) =>
  screen
    .getByLabelText(label)
    .findAll(
      (node) =>
        typeof node.type === 'string' &&
        resolvedStyle(node.props.style).width === density.leadingSize,
    ).length;

describe('alignRows', () => {
  it('insets a plain row to the indicator gutter when another row has a check', () => {
    const screen = renderMenu(
      true,
      <>
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>
          Show Tabs in Sidebar
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem>Customize</DropdownMenuItem>
      </>,
    );
    expect(paddingLeftOf(screen, 'Show Tabs in Sidebar')).toBe(density.gutter);
    expect(paddingLeftOf(screen, 'Customize')).toBe(density.gutter);
    expect(resolvedStyle(screen.getByText('View').props.style).paddingLeft).toBe(density.gutter);
  });

  it('keeps an icon-wide slot on a row without an icon when another row has one', () => {
    const screen = renderMenu(
      true,
      <>
        <DropdownMenuItem leading={<Text>★</Text>}>Favourite</DropdownMenuItem>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </>,
    );
    expect(leadingSlots(screen, 'Favourite')).toBe(1);
    expect(leadingSlots(screen, 'Rename')).toBe(1);
    expect(paddingLeftOf(screen, 'Rename')).toBeUndefined();
  });

  it('adds nothing when no row draws at its leading edge', () => {
    const screen = renderMenu(
      true,
      <>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </>,
    );
    expect(paddingLeftOf(screen, 'Rename')).toBeUndefined();
    expect(leadingSlots(screen, 'Rename')).toBe(0);
  });

  it('undoes the column when the row that needed it goes away', () => {
    const rows = (withIcon: boolean) => (
      <>
        {withIcon ? <DropdownMenuItem leading={<Text>★</Text>}>Favourite</DropdownMenuItem> : null}
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </>
    );
    const screen = renderMenu(true, rows(true));
    expect(leadingSlots(screen, 'Rename')).toBe(1);
    screen.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'sheet' }}>
          <MenuRowAlignmentScope enabled>{rows(false)}</MenuRowAlignmentScope>
        </MenuSurfaceProvider>
      </BloomThemeProvider>,
    );
    expect(leadingSlots(screen, 'Rename')).toBe(0);
  });

  it('without the opt-in, rows keep their own layout', () => {
    const screen = renderMenu(
      undefined,
      <>
        <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>
          Show Tabs in Sidebar
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem leading={<Text>★</Text>}>Favourite</DropdownMenuItem>
        <DropdownMenuItem>Customize</DropdownMenuItem>
      </>,
    );
    expect(paddingLeftOf(screen, 'Customize')).toBeUndefined();
    expect(leadingSlots(screen, 'Customize')).toBe(0);
  });
});
