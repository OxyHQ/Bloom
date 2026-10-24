/**
 * `ContactList`'s sticky headings, as the NATIVE ScrollView receives them.
 *
 * On Allo's Android release (RN 0.88 Fabric) the rows rendered unpainted until
 * the first scroll. React Native wraps each `stickyHeaderIndices` child in an
 * animated, `zIndex: 10` `ScrollViewStickyHeader`, one per letter, between the
 * rows — the suspected cause. So on ANDROID the list asks for no sticky
 * headings unless the app opts in with `stickyHeaders`; iOS keeps them.
 *
 * Rendered through the `react-native` MOCK, which passes `stickyHeaderIndices`
 * to the host `ScrollView` untouched, with `Platform.OS` set per test. What
 * this cannot see is whether the rows actually paint on a device: that is the
 * Android check `docs/chat-people.mdx` owes.
 */
import type React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { ContactList } from '../chat-people';
import type { ContactSection } from '../chat-people/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const SECTIONS: ContactSection[] = [
  { letter: 'A', contacts: [{ id: 'ana', name: 'Ana Restrepo' }] },
  { letter: 'K', contacts: [{ id: 'kofi', name: 'Kofi Mensah' }] },
];

const os = Platform.OS;
afterEach(() => {
  Platform.OS = os;
});

function stickyIndicesOf(ui: React.ReactElement): unknown {
  const screen = render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  const value = screen.getByTestId('l-scroll', { includeHiddenElements: true }).props
    .stickyHeaderIndices;
  screen.unmount();
  return value;
}

describe('ContactList sticky headings on native', () => {
  it('pins nothing on Android by default', () => {
    Platform.OS = 'android';
    expect(stickyIndicesOf(<ContactList sections={SECTIONS} testID="l" />)).toBeUndefined();
  });

  it('pins the headings on Android when the app opts in', () => {
    Platform.OS = 'android';
    expect(stickyIndicesOf(<ContactList sections={SECTIONS} stickyHeaders testID="l" />)).toEqual([
      0, 2,
    ]);
  });

  it('keeps pinning on iOS by default, and lets an app turn it off', () => {
    Platform.OS = 'ios';
    expect(stickyIndicesOf(<ContactList sections={SECTIONS} testID="l" />)).toEqual([0, 2]);
    expect(
      stickyIndicesOf(<ContactList sections={SECTIONS} stickyHeaders={false} testID="l" />),
    ).toBeUndefined();
  });

  it('never pins a flat list, even when asked to', () => {
    Platform.OS = 'ios';
    expect(
      stickyIndicesOf(
        <ContactList
          sections={SECTIONS}
          layout="flat"
          flatLabel="Results"
          stickyHeaders
          testID="l"
        />,
      ),
    ).toBeUndefined();
  });
});
