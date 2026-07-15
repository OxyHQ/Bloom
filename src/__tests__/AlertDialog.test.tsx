import React, { useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AlertDialog, AlertDialogHost, confirm } from '../alert-dialog';
import { getConfirmQueue, resolveConfirm } from '../alert-dialog/confirm-store';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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
// public-API contract it owns — controlled visibility, the title/description
// copy, the confirm/cancel actions, and — most importantly — the exact
// `confirm()` promise-resolution contract every ecosystem call site relies on:
// the confirm button resolves `true`; the cancel button (or Escape / backdrop,
// which route through the Dialog's `onClose`) resolves `false`.
describe('AlertDialog (built on Dialog)', () => {
  afterEach(() => {
    // Drain any confirm() entries a test left pending so the module-scoped
    // queue never bleeds across tests.
    for (const entry of [...getConfirmQueue()]) {
      resolveConfirm(entry.id, false);
    }
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = renderWithTheme(
      <AlertDialog
        visible={false}
        onClose={() => {}}
        title="Delete app?"
        description="This cannot be undone."
      />,
    );
    expect(queryByText('Delete app?')).toBeNull();
    expect(queryByText('This cannot be undone.')).toBeNull();
  });

  it('renders title, description and the confirm/cancel row when visible', () => {
    const { getByText } = renderWithTheme(
      <AlertDialog
        visible
        onClose={() => {}}
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

  it('runs onConfirm then onClose when the confirm button is pressed', () => {
    const calls: string[] = [];
    const onConfirm = jest.fn(() => calls.push('confirm'));
    const onClose = jest.fn(() => calls.push('close'));
    const { getByText } = renderWithTheme(
      <AlertDialog
        visible
        onClose={onClose}
        title="Confirm?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
      />,
    );
    act(() => {
      fireEvent.press(getByText('Yes'));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    // Order matters: onConfirm must resolve the promise BEFORE onClose runs.
    expect(calls).toEqual(['confirm', 'close']);
  });

  it('requests close (resolves cancel) when the cancel button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithTheme(
      <AlertDialog
        visible
        onClose={onClose}
        title="Confirm?"
        cancelLabel="No"
      />,
    );
    act(() => {
      fireEvent.press(getByText('No'));
    });
    // The `cancel` action dismisses via the Dialog's `close()`, which in
    // controlled mode fires `onClose` — the confirm() host's resolve-false.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onCancel after the cancel button dismisses the dialog', () => {
    const onCancel = jest.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <AlertDialog
          visible={open}
          onClose={() => setOpen(false)}
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
        visible
        onClose={() => {}}
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
        visible
        onClose={() => {}}
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

  // The authoritative ecosystem contract: `confirm()` + `<AlertDialogHost />`.
  // Every consuming call site does `const ok = await confirm({...})`, so these
  // assert the exact promise resolution against the REAL rendered action row.
  describe('confirm() + AlertDialogHost promise contract', () => {
    it('resolves true when the confirm button is pressed', async () => {
      const { getByText } = renderWithTheme(<AlertDialogHost />);
      let result!: Promise<boolean>;
      act(() => {
        result = confirm({
          title: 'Delete app?',
          confirmLabel: 'Delete',
          cancelLabel: 'Keep',
        });
      });
      act(() => {
        fireEvent.press(getByText('Delete'));
      });
      await expect(result).resolves.toBe(true);
      expect(getConfirmQueue()).toHaveLength(0);
    });

    it('resolves false when the cancel button is pressed', async () => {
      const { getByText } = renderWithTheme(<AlertDialogHost />);
      let result!: Promise<boolean>;
      act(() => {
        result = confirm({
          title: 'Discard changes?',
          confirmLabel: 'Discard',
          cancelLabel: 'Keep editing',
        });
      });
      act(() => {
        fireEvent.press(getByText('Keep editing'));
      });
      await expect(result).resolves.toBe(false);
      expect(getConfirmQueue()).toHaveLength(0);
    });

    it('resolves true even though confirm fires both onConfirm and onClose', async () => {
      // The confirm button runs onConfirm (resolve true, drains the entry) then
      // onClose (resolve false — a no-op once the entry is gone). The net must
      // be `true`; this guards the double-resolution path explicitly.
      const { getByText } = renderWithTheme(<AlertDialogHost />);
      let result!: Promise<boolean>;
      act(() => {
        result = confirm({ title: 'Proceed?', confirmLabel: 'Proceed' });
      });
      act(() => {
        fireEvent.press(getByText('Proceed'));
      });
      await expect(result).resolves.toBe(true);
    });
  });
});
