import React, { createRef } from 'react';
import { Text, type View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Dialog, useDialogControl } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * Minimal shape of a `react-test-renderer` JSON node — enough to walk the tree
 * by host `type` string without depending on `@types/react-test-renderer`.
 */
type RenderedNode = {
  type: string;
  children: Array<RenderedNode | string> | null;
};

/** Count host nodes of a given `type` in a rendered `toJSON()` tree. */
function countNodesByType(
  tree: RenderedNode | RenderedNode[] | null,
  type: string,
): number {
  if (tree === null) return 0;
  const roots = Array.isArray(tree) ? tree : [tree];
  let count = 0;
  for (const node of roots) {
    if (node.type === type) count += 1;
    if (node.children) {
      for (const child of node.children) {
        if (typeof child !== 'string') count += countNodesByType(child, type);
      }
    }
  }
  return count;
}

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

  it('applies the default 20px content padding when contentPadding is omitted', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const { getByTestId } = renderWithTheme(
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog control={c} placement="bottom" testID="default-pad">
              <Text>Body</Text>
            </Dialog>
          );
        }}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    const content = getByTestId('default-pad');
    const flattened = Array.isArray(content.props.style)
      ? Object.assign({}, ...content.props.style.filter(Boolean))
      : content.props.style;
    // Omitting `contentPadding` keeps the legacy 20px chrome padding.
    expect(flattened.padding).toBe(20);
  });

  it('removes the body padding when contentPadding={0} (host owns its insets)', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const { getByTestId } = renderWithTheme(
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog control={c} placement="bottom" testID="flush-pad" contentPadding={0}>
              <Text>Flush body</Text>
            </Dialog>
          );
        }}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    const content = getByTestId('flush-pad');
    const flattened = Array.isArray(content.props.style)
      ? Object.assign({}, ...content.props.style.filter(Boolean))
      : content.props.style;
    // `contentPadding={0}` yields flush content the host pads itself.
    expect(flattened.padding).toBe(0);
  });

  it('does NOT wrap pure custom children in a second scroll container (no scroll-in-scroll)', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const result = renderWithTheme(
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog control={c} placement="bottom">
              <Text>Custom children own their own scrolling</Text>
            </Dialog>
          );
        }}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    // Pure custom children → DialogBottomSheet passes `scrollable={false}` to
    // BottomSheet, so the sheet does NOT add its internal ScrollView. A child
    // that contains its own scroller is then the ONLY scroll container.
    const tree: RenderedNode | RenderedNode[] | null = result.toJSON();
    expect(countNodesByType(tree, 'Animated.ScrollView')).toBe(0);
  });

  it('keeps the internal scrollable body for declarative dialogs (title/description/actions)', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const result = renderWithTheme(
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog
              control={c}
              placement="bottom"
              title="Confirm"
              description="Short declarative body."
              actions={[{ label: 'OK' }]}
            />
          );
        }}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    // Declarative chrome → the default scrollable body is retained, so a long
    // title/description list still scrolls gracefully on a small viewport.
    const tree: RenderedNode | RenderedNode[] | null = result.toJSON();
    expect(countNodesByType(tree, 'Animated.ScrollView')).toBe(1);
  });
});
