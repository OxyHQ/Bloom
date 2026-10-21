import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
// Explicit native owner: the web dispatcher must not stand in for this coverage.
import { Dialog } from '../dialog/Dialog';
import { ScrollArea } from '../layout/ScrollArea';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

it('fills the native overlay instead of retaining side width or detached-sheet bounds', () => {
  const { getByTestId, getByText } = render(
    <BloomThemeProvider fonts={false}>
      <Dialog
        presentation="fullscreen"
        open
        placement="bottom"
        scrollable={false}
        contentPadding={0}
        width={200}
        inset={{ top: 24, bottom: 32 }}
        testID="history"
        label="Version history"
      >
        <Text>Version preview</Text>
      </Dialog>
    </BloomThemeProvider>,
  );
  const panel = getByTestId('history');
  const style = StyleSheet.flatten(panel.props.style);
  expect(style.width).toBe(375);
  expect(style.top).toBe(0);
  expect(style.bottom).toBe(0);
  expect(panel.props.accessibilityViewIsModal).toBe(true);
  expect(getByText('Version preview')).toBeTruthy();
});

it.each([true, false])('delegates native scrolling only when requested: %s', (scrollable) => {
  const view = render(
    <BloomThemeProvider fonts={false}>
      <Dialog presentation="fullscreen" open scrollable={scrollable} label="Version history">
        <Text>Version preview</Text>
      </Dialog>
    </BloomThemeProvider>,
  );
  expect(view.UNSAFE_queryAllByType(ScrollArea)).toHaveLength(scrollable ? 1 : 0);
});

it('does not reserve a native View for an inactive dialog theme scope', () => {
  const view = render(<BloomThemeProvider fonts={false}>{null}</BloomThemeProvider>);
  const before = view.UNSAFE_getAllByType(View).length;
  view.rerender(
    <BloomThemeProvider fonts={false}>
      <Dialog label="Closed">
        <Text>Hidden</Text>
      </Dialog>
    </BloomThemeProvider>,
  );
  expect(view.UNSAFE_getAllByType(View)).toHaveLength(before);
  expect(view.queryByText('Hidden')).toBeNull();
});
