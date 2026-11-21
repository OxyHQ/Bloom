/**
 * The native sheet shell follows the lens: on a device with Bloom's native lens the sheet presents in
 * the app's own window (a portal under an `OverlayRoot`), so its controls can take the lens; anywhere
 * else it keeps its RN `Modal`, as before.
 */
import { createRef } from 'react';
import { Modal, Text, View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme';

let lens = false;

jest.mock('../floating/lens/native-lens', () => ({
  ...jest.requireActual('../floating/lens/native-lens'),
  getNativeLens: () => (lens ? jest.requireActual('./lens-stub').stubLens : null),
}));

function renderSheet() {
  const ref = createRef<BottomSheetRef>();
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        <BottomSheet ref={ref}>
          <Text>Sheet body</Text>
        </BottomSheet>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  act(() => ref.current?.present());
  return screen;
}

afterEach(() => {
  lens = false;
});

it('keeps the RN Modal where there is no lens', () => {
  const screen = renderSheet();
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  expect(screen.getByText('Sheet body')).toBeTruthy();
});

it('presents in the app window where the device has the lens', () => {
  lens = true;
  const screen = renderSheet();
  expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
  expect(screen.getByText('Sheet body')).toBeTruthy();
});
