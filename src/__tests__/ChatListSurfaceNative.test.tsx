/**
 * Measured on Android (Allo, Bloom 15.50.1, light Raspberry theme): a list on
 * the card panel #fff8f8 drew page-coloured #ffe8ed swipe faces that looked
 * selected. Bubble actions now clip their reveal, so the moving face stays
 * transparent. Press and selection colours still derive from the actual
 * parent surface. This protects the original panel/page regression.
 * Rendered through the native mock; this does not claim device verification.
 */
import { render } from '@testing-library/react-native';
import { Pressable, StyleSheet } from 'react-native';
import { ListItem } from '../list';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { mixColors } from '../styles/color-contrast';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';

const PANEL = '#fff8f8';
let theme: Theme;
function ReadTheme() {
  theme = useTheme();
  return null;
}

describe('shared list surface on native', () => {
  it.each([false, true])(
    'keeps bubble faces transparent and derives selection from the panel (active=%s)',
    (active) => {
      const screen = render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <ReadTheme />
          <SurfaceLevelProvider level={1} fill={PANEL}>
            <ListItem
              conversation={{ name: 'Ana' }}
              active={active}
              onPress={() => undefined}
              swipeActions={{ right: [{ key: 'delete', label: 'Delete', icon: RiDeleteBinLine }] }}
              swipeEnabled
              testID="row"
            />
          </SurfaceLevelProvider>
        </BloomThemeProvider>,
      );
      const row = screen.getByTestId('row', { includeHiddenElements: true });
      const link = screen
        .UNSAFE_getAllByType(Pressable)
        .find((el) => el.props.testID === 'row-link')!;
      const fill = mixColors(PANEL, theme.colors.text, 0.06);
      expect(StyleSheet.flatten(row.props.style).backgroundColor).toBe(
        active ? fill : 'transparent',
      );
      expect(StyleSheet.flatten(link.props.style({ pressed: true }))?.backgroundColor).toBe(
        active ? undefined : fill,
      );
      expect(fill).not.toBe(mixColors(theme.colors.background, theme.colors.text, 0.06));
    },
  );
});
