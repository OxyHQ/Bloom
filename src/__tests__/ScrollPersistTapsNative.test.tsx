/**
 * A control inside a Bloom scroller takes its tap while the keyboard is open.
 *
 * React Native's default lets every ancestor ScrollView spend the first tap on
 * dismissing the keyboard. Allo's composer sits inside three of Bloom's (panel,
 * pager, page), and with the keyboard up Send only closed the keyboard (Pixel
 * 8a). `ScrollArea` and `ScreenScrollView` default to `handled`; a caller's
 * own value still wins.
 *
 * Rendered through the `react-native` mock.
 */
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { ScrollArea } from '../layout';
import { Screen, ScreenScrollView } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function persistTaps(ui: React.ReactElement): unknown[] {
  const screen = render(<BloomThemeProvider fonts={false}>{ui}</BloomThemeProvider>);
  return screen.UNSAFE_root.findAll(
    (node) => node.props.keyboardShouldPersistTaps !== undefined,
  ).map((node) => node.props.keyboardShouldPersistTaps);
}

describe('keyboardShouldPersistTaps', () => {
  it('lets a ScrollArea hand taps to its controls', () => {
    expect(persistTaps(<ScrollArea />)).toContain('handled');
  });

  it('lets a page scroller hand taps to its controls', () => {
    expect(
      persistTaps(
        // The native, contained scroller (as `ScreenKeyboard.test.tsx` builds it).
        <Screen
          scroll="auto"
          header={<View />}
          bottomBar={<View />}
          bottomBarKeyboardBehavior="follow"
        >
          <ScreenScrollView />
        </Screen>,
      ),
    ).toContain('handled');
  });

  it("keeps a caller's own choice", () => {
    expect(persistTaps(<ScrollArea keyboardShouldPersistTaps="never" />)).not.toContain('handled');
  });
});
