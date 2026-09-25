/**
 * `ChipRow` on NATIVE, where a software keyboard exists.
 *
 * React Native's default for a ScrollView is `keyboardShouldPersistTaps:
 * 'never'`: while the keyboard is open, the first tap inside the scroller only
 * dismisses the keyboard and never reaches the pill under the finger. A row of
 * pills is exactly the control that sits under a text field — a composer's
 * audience and language pills, a search screen's filters — so every one of them
 * needed two taps and took the reader's keyboard away with the first. The row
 * now lets the pill take the press (`handled`), and a caller can still opt back.
 *
 * Rendered against the native mock (`__mocks__/react-native.ts`), which passes a
 * ScrollView's props through untouched; react-native-web drops the prop, which
 * is why `Chip.test.tsx` (the web suite) cannot see it.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { Chip, ChipRow } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function scrollerProps(ui: React.ReactElement): Record<string, unknown> {
  const screen = render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  return screen.getByTestId('row-track').props as Record<string, unknown>;
}

describe('ChipRow keyboard taps', () => {
  it('lets a pill take a tap while the keyboard is open, by default', () => {
    const props = scrollerProps(
      <ChipRow testID="row">
        <Chip onPress={() => {}}>Anyone</Chip>
      </ChipRow>,
    );
    expect(props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('keeps the caller’s choice when one is given', () => {
    const props = scrollerProps(
      <ChipRow testID="row" keyboardShouldPersistTaps="never">
        <Chip onPress={() => {}}>Anyone</Chip>
      </ChipRow>,
    );
    expect(props.keyboardShouldPersistTaps).toBe('never');
  });
});
