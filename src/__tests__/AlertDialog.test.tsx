import type React from 'react';
import { useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AlertDialog } from '../alert-dialog';
import { createAlertDialog } from '../alert-dialog/AlertDialog';
import { BloomScope } from '../appearance';
import type { DialogProps } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

// `AlertDialog` is a thin wrapper over `<Dialog placement="center">` that maps
// its confirm/cancel props onto the Dialog's declarative `actions` row (the
// shared `ActionRow`/`ActionButton` primitive). These tests assert the
// public-API contract it owns: CONTROLLED visibility, the title/description
// copy, and the confirm/cancel actions.
//
// The imperative counterpart — `confirm()` — is no longer this family's: it
// presents onto the shared surface stack, and its promise contract is asserted
// in `surface-prompts.test.tsx` against the real rendered chrome.
describe('AlertDialog (built on Dialog)', () => {
  it('renders nothing when not open', () => {
    const { queryByText } = renderWithTheme(
      <AlertDialog
        open={false}
        onOpenChange={() => {}}
        title="Delete app?"
        description="This cannot be undone."
      />,
    );
    expect(queryByText('Delete app?')).toBeNull();
    expect(queryByText('This cannot be undone.')).toBeNull();
  });

  it('renders title, description and the confirm/cancel row when open', () => {
    const { getByText } = renderWithTheme(
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Delete app?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
      />,
    );
    expect(getByText('Delete app?')).toBeTruthy();
    expect(getByText('This cannot be undone.')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Keep')).toBeTruthy();
  });

  it('keeps action geometry owned by Dialog across surrounding size scopes', () => {
    const renderAction = (size: 'xs' | 'lg') => {
      const tree = renderWithTheme(
        <BloomScope size={size}>
          <AlertDialog open onOpenChange={() => {}} title="Delete app?" confirmLabel="Delete" />
        </BloomScope>,
      );
      const action = tree.UNSAFE_getByProps({ accessibilityLabel: 'Delete' });
      const geometry = resolvedStyle(action.props.style);
      tree.unmount();
      return geometry;
    };

    // Dialog's shared ActionButton explicitly selects its platform recipe
    // (large on mobile); AlertDialog does not expose a competing size contract.
    expect(renderAction('xs')).toEqual(renderAction('lg'));
  });

  it('runs onConfirm then onOpenChange when the confirm button is pressed', () => {
    const calls: string[] = [];
    const onConfirm = jest.fn(() => calls.push('confirm'));
    const onOpenChange = jest.fn(() => calls.push('close'));
    const { getByText } = renderWithTheme(
      <AlertDialog
        open
        onOpenChange={onOpenChange}
        title="Confirm?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
      />,
    );
    act(() => {
      fireEvent.press(getByText('Yes'));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    // Order matters: onConfirm must resolve the promise BEFORE onOpenChange runs.
    expect(calls).toEqual(['confirm', 'close']);
  });

  it('requests close (resolves cancel) when the cancel button is pressed', () => {
    const onOpenChange = jest.fn();
    const { getByText } = renderWithTheme(
      <AlertDialog open onOpenChange={onOpenChange} title="Confirm?" cancelLabel="No" />,
    );
    act(() => {
      fireEvent.press(getByText('No'));
    });
    // The `cancel` action dismisses via the Dialog's `close()`, which in
    // controlled mode fires `onOpenChange` — the confirm() host's resolve-false.
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('invokes onCancel after the cancel button dismisses the dialog', () => {
    const onCancel = jest.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <AlertDialog
          open={open}
          onOpenChange={() => setOpen(false)}
          title="Confirm?"
          cancelLabel="No"
          onCancel={onCancel}
        />
      );
    }
    const { getByText } = renderWithTheme(<Harness />);
    act(() => {
      fireEvent.press(getByText('No'));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('hides the cancel button when hideCancel is set', () => {
    const { queryByText, getByText } = renderWithTheme(
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Acknowledge"
        confirmLabel="OK"
        cancelLabel="Cancel"
        hideCancel
      />,
    );
    expect(getByText('OK')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('renders a destructive confirm action', () => {
    const onConfirm = jest.fn();
    const { getByText } = renderWithTheme(
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Sign out everywhere?"
        confirmLabel="Sign out"
        destructive
        onConfirm={onConfirm}
      />,
    );
    const confirmButton = getByText('Sign out');
    expect(confirmButton).toBeTruthy();
    act(() => {
      fireEvent.press(confirmButton);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  // Finding 1 (control-mode) + Finding 2 (backdrop-dismiss default). These pin
  // the two behavioural fixes at the prop boundary between `AlertDialog` and the
  // underlying `Dialog`, using a prop-capturing mock `Dialog` so the assertions
  // are deterministic and platform-agnostic.
  describe('control-mode bridge + dismiss defaults', () => {
    function captureDialogProps() {
      const captured: { props?: DialogProps } = {};
      const MockDialog = (props: DialogProps) => {
        captured.props = props;
        return null;
      };
      return { captured, MockDialog };
    }

    it('drives the underlying Dialog imperatively (control), never the controlled `open` prop', () => {
      const { captured, MockDialog } = captureDialogProps();
      const TestAlertDialog = createAlertDialog(MockDialog);
      renderWithTheme(<TestAlertDialog open onOpenChange={() => {}} title="Delete?" />);
      // The whole point of the fix: `confirm()` must take the Dialog's
      // imperative/uncontrolled branch (the one that plays the exit animation),
      // so an imperative `control` handle is passed and the controlled `open`
      // boolean — which would take the other branch — is never set.
      expect(captured.props?.control).toBeDefined();
      expect(captured.props?.open).toBeUndefined();
    });

    it('defaults dismissOnBackdrop to true (backdrop / Escape dismiss by default)', () => {
      const { captured, MockDialog } = captureDialogProps();
      const TestAlertDialog = createAlertDialog(MockDialog);
      renderWithTheme(<TestAlertDialog open onOpenChange={() => {}} title="Delete?" />);
      // Matches the shared Dialog default + Mention's ConfirmPrompt.
      expect(captured.props?.dismissOnBackdrop).toBe(true);
    });

    it('answers Escape and the backdrop as its cancel button, never after a button answered', () => {
      const { captured, MockDialog } = captureDialogProps();
      const TestAlertDialog = createAlertDialog(MockDialog);
      const calls: string[] = [];
      function Harness({ open }: { open: boolean }) {
        return (
          <TestAlertDialog
            open={open}
            onOpenChange={(next) => calls.push(`open:${next}`)}
            onConfirm={() => calls.push('confirm')}
            onCancel={() => calls.push('cancel')}
            title="Keep these display settings?"
          />
        );
      }
      // Mounted closed, then shown: its first dismissal is the person's, and heard.
      const screen = renderWithTheme(<Harness open={false} />);
      screen.rerender(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Harness open />
        </BloomThemeProvider>,
      );
      // Escape (or the backdrop): the Dialog closes on its own, no button pressed.
      act(() => captured.props?.onClose?.());
      expect(calls).toEqual(['cancel', 'open:false']);
      calls.length = 0;
      // Keep: the button's answer, then the close that follows it, which is no cancel.
      act(() => {
        captured.props?.actions?.[0]?.onPress?.(undefined as never);
        captured.props?.onClose?.();
      });
      expect(calls).toEqual(['confirm', 'open:false']);
      calls.length = 0;
      // Revert: cancel once.
      act(() => {
        captured.props?.actions?.[1]?.onPress?.(undefined as never);
        captured.props?.onClose?.();
      });
      expect(calls).toEqual(['cancel', 'open:false']);
    });

    it('an acknowledgement without a cancel button answers nothing on Escape', () => {
      const { captured, MockDialog } = captureDialogProps();
      const TestAlertDialog = createAlertDialog(MockDialog);
      const onCancel = jest.fn();
      const onOpenChange = jest.fn();
      renderWithTheme(
        <TestAlertDialog
          open
          hideCancel
          onCancel={onCancel}
          onOpenChange={onOpenChange}
          title="Done"
        />,
      );
      act(() => captured.props?.onClose?.());
      expect(onCancel).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('still supports an opt-in blocking confirm via dismissible={false}', () => {
      const { captured, MockDialog } = captureDialogProps();
      const TestAlertDialog = createAlertDialog(MockDialog);
      renderWithTheme(
        <TestAlertDialog open onOpenChange={() => {}} title="Delete?" dismissible={false} />,
      );
      expect(captured.props?.dismissOnBackdrop).toBe(false);
    });
  });
});
