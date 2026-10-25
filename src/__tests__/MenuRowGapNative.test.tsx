/**
 * A menu row keeps its icon off its label on native.
 *
 * The row's gap lived only in `rowClass` (`gap-space-8`), which never reached
 * the row on Android: every Bloom menu drew its icons against their labels
 * ("QSearch", Allo's conversation menu). It is now inline as well, unless a
 * caller `className` restyles the row.
 *
 * Rendered through the `react-native` mock.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';

import { MenuRowShell } from '../floating/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function rowStyle(className?: string) {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MenuRowShell
        role="menuitem"
        disabled={false}
        onPress={() => {}}
        title="Search"
        leading={<View />}
        className={className}
        testID="row"
      />
    </BloomThemeProvider>,
  );
  return StyleSheet.flatten(screen.getByTestId('row').props.style);
}

describe('menu row gap', () => {
  it('spaces the leading glyph from the label inline', () => {
    expect(rowStyle()?.columnGap).toBe(8);
  });

  it('leaves the gap to a caller className', () => {
    expect(rowStyle('gap-0')?.columnGap).toBeUndefined();
  });
});
