import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AlertDialog } from '../alert-dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

// `AlertDialog` is now a thin wrapper over `<Dialog placement="center">`. These
// tests assert the public-API contract it owns (controlled visibility, the
// title/description copy, the confirm/cancel action row, and the
// confirm/cancel/dismiss callbacks) holds on the native Dialog surface.
describe('AlertDialog (built on Dialog)', () => {
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
    const onConfirm = jest.fn();
    const onClose = jest.fn();
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
  });

  it('runs onCancel then onClose when the cancel button is pressed', () => {
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const { getByText } = renderWithTheme(
      <AlertDialog
        visible
        onClose={onClose}
        title="Confirm?"
        cancelLabel="No"
        onCancel={onCancel}
      />,
    );
    act(() => {
      fireEvent.press(getByText('No'));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
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
    const confirm = getByText('Sign out');
    expect(confirm).toBeTruthy();
    act(() => {
      fireEvent.press(confirm);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
