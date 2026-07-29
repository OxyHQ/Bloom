import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';
import { useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import { Z_INDEX } from '../styles/z-index';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * `BottomSheet` draws a decorative drag handle by default; `SheetShell` draws
 * its own PRESSABLE one (tap to dismiss). Leaving both on painted two pills
 * 2dp apart in every Bloom sheet menu, select, popover and context menu, so
 * `SheetShell` turns the built-in one off.
 *
 * The built-in handle is identified by the z-index reserved for it, which no
 * other element in the tree uses. `describe('control case')` below proves that
 * query can actually FIND a handle — without it, a query that silently matched
 * nothing would report the fix as working whether or not it did.
 */
const sheetHandles = (root: ReactTestInstance) =>
  root.findAll((node) => {
    const style: unknown = node.props?.style;
    return (
      typeof style === 'object' &&
      style !== null &&
      !Array.isArray(style) &&
      (style as { zIndex?: number }).zIndex === Z_INDEX.sheetHandle
    );
  });

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function OpenSheetShell() {
  const control = useDialogControl();
  React.useEffect(() => {
    control.open();
  }, [control]);
  return (
    <SheetShell control={control} label="Menu">
      <Text>Row</Text>
    </SheetShell>
  );
}

describe('SheetShell drag handle', () => {
  it('renders exactly one handle — its own pressable one', () => {
    const { UNSAFE_root, getByHintText, getByText } = renderWithTheme(<OpenSheetShell />);
    act(() => {});

    expect(getByText('Row')).toBeTruthy();
    // SheetShell's own handle: a Pressable that dismisses the sheet on tap.
    // Matched on the hint rather than the label, which the backdrop shares.
    expect(getByHintText('Tap to close')).toBeTruthy();
    // BottomSheet's built-in decorative handle must be suppressed.
    expect(sheetHandles(UNSAFE_root)).toHaveLength(0);
  });

  describe('control case', () => {
    it('finds the built-in handle on a plain BottomSheet, which leaves it on', () => {
      const ref = React.createRef<BottomSheetRef>();
      const { UNSAFE_root } = renderWithTheme(
        <BottomSheet ref={ref}>
          <Text>Row</Text>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });

      expect(sheetHandles(UNSAFE_root).length).toBeGreaterThan(0);
    });
  });
});
