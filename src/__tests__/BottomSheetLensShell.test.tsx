/**
 * The native sheet shell follows the lens: on a device with Bloom's native lens the sheet presents in
 * the app's own window (a portal under an `OverlayRoot`), so its controls can take the lens; anywhere
 * else it keeps its RN `Modal`, as before.
 */
import { createRef } from 'react';
import { Modal, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme';

let lens = false;

jest.mock('../floating/lens/native-lens', () => ({
  ...jest.requireActual('../floating/lens/native-lens'),
  getNativeLens: () => (lens ? jest.requireActual('./lens-stub').stubLens : null),
  useInLensBase: () => false,
}));

function renderSheet({ portalProvider = true } = {}) {
  const ref = createRef<BottomSheetRef>();
  const sheet = (
    <BottomSheet ref={ref}>
      <Text>Sheet body</Text>
    </BottomSheet>
  );
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {portalProvider ? (
        <PortalProvider>
          {sheet}
          <PortalOutlet />
        </PortalProvider>
      ) : (
        sheet
      )}
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

// Mention 2.2.0 mounted its surface host beside its PortalProvider, not under it: on a lens phone
// the sheet went into a portal nobody rendered, and the account switcher, sign-in and every confirm
// showed nothing. Without a provider the sheet keeps its Modal, as it did before the lens.
it('keeps the RN Modal where the device has the lens but no PortalProvider is above the sheet', () => {
  lens = true;
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = renderSheet({ portalProvider: false });
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  expect(screen.getByText('Sheet body')).toBeTruthy();
  warn.mockRestore();
});
