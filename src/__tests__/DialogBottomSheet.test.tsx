import React, { createRef } from 'react';
import { Text, type View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Dialog, useDialogControl } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * The Dialog `bottom` placement must delegate to the shared cross-platform
 * `BottomSheet` (via `DialogBottomSheet`) — the SAME surface native and web use
 * — instead of a bespoke CSS slide-up sheet. These tests pin that delegation:
 * the declarative content renders through the sheet, the close lifecycle bridges
 * `open`/`onClose` correctly, and brand theming (`panelStyle` surface paint +
 * `containerStyle` theme scope) threads through to the sheet surface.
 *
 * The jest environment resolves `../dialog` to the native barrel (`Dialog.tsx`),
 * which routes `bottom` through `DialogBottomSheet` → `BottomSheet`. The web
 * fork (`Dialog.web.tsx`) routes through the EXACT same `DialogBottomSheet`, so
 * this delegation is one shared code path across platforms.
 */

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function Harness({
  children,
}: {
  children: (control: ReturnType<typeof useDialogControl>) => React.ReactNode;
}) {
  const control = useDialogControl();
  return <>{children(control)}</>;
}

describe('Dialog bottom placement delegates to BottomSheet', () => {
  it('does not render bottom-sheet content until opened', () => {
    const { queryByText } = renderWithTheme(
      <Harness>
        {(control) => (
          <Dialog control={control} placement="bottom" title="Sheet title">
            <Text>Sheet body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    // BottomSheet keeps its subtree unmounted until present() — proof the bottom
    // placement is the sheet, not an always-mounted CSS panel.
    expect(queryByText('Sheet title')).toBeNull();
    expect(queryByText('Sheet body')).toBeNull();
  });

  it('renders declarative title + description + actions through the sheet when opened', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const { getByText } = renderWithTheme(
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog
              control={c}
              placement="bottom"
              title="Delete item?"
              description="This cannot be undone."
              actions={[{ label: 'Delete', color: 'destructive' }, { label: 'Cancel', color: 'cancel' }]}
            />
          );
        }}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    expect(getByText('Delete item?')).toBeTruthy();
    expect(getByText('This cannot be undone.')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('requests close via onClose exactly once on action press in controlled mode (no double-fire)', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithTheme(
      <Dialog open onClose={onClose} placement="bottom" title="Confirm" actions={[{ label: 'Done' }]} />,
    );
    act(() => {
      fireEvent.press(getByText('Done'));
    });
    // Controlled mode: the action's close() requests dismissal via onClose once;
    // the host (not the dialog) then flips `open`. It must not fire the
    // close-completion onClose a second time.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('threads panelStyle (brand surface) and containerStyle (theme scope) onto the sheet content', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const panelRef = createRef<View>();
    const { getByTestId } = renderWithTheme(
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog
              control={c}
              placement="bottom"
              testID="brand-sheet"
              panelStyle={{ backgroundColor: 'rebeccapurple' }}
              containerStyle={{ paddingTop: 7 }}
            >
              <Text ref={panelRef}>Branded</Text>
            </Dialog>
          );
        }}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    const content = getByTestId('brand-sheet');
    const flattened = Array.isArray(content.props.style)
      ? Object.assign({}, ...content.props.style.filter(Boolean))
      : content.props.style;
    // panelStyle paints the surface; containerStyle (theme-var scope) wraps the
    // content subtree. Both land on the sheet content container.
    expect(flattened.backgroundColor).toBe('rebeccapurple');
    expect(flattened.paddingTop).toBe(7);
  });
});
