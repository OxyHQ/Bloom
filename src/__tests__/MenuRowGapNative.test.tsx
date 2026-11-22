/**
 * A menu row keeps its icon off its label on native.
 *
 * The row's gap once lived only in a class (`gap-space-8`), which never
 * reached the row on Android: every Bloom menu drew its icons against their
 * labels ("QSearch", Allo's conversation menu). It is inline, and a caller's
 * `style` still restyles the row.
 *
 * Rendered through the `react-native` mock.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';

import { MenuRowShell } from '../floating/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function rowStyle(style?: { columnGap: number }) {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MenuRowShell
        role="menuitem"
        disabled={false}
        onPress={() => {}}
        title="Search"
        leading={<View />}
        style={style}
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

  it('leaves the gap to a caller style', () => {
    expect(rowStyle({ columnGap: 0 })?.columnGap).toBe(0);
  });
});
