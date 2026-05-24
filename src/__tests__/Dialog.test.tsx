import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  alert,
  BloomDialogProvider,
  Dialog,
  useDialogControl,
} from '../dialog';
import { dismissAlert, getAlertQueue } from '../dialog/alert-store';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function Harness({
  children,
  onControl,
}: {
  children?: (control: ReturnType<typeof useDialogControl>) => React.ReactNode;
  onControl?: (control: ReturnType<typeof useDialogControl>) => void;
}) {
  const control = useDialogControl();
  React.useEffect(() => {
    onControl?.(control);
  }, [control, onControl]);
  return <>{children?.(control)}</>;
}

describe('Dialog (unified API)', () => {
  it('does not render content until control.open() is called', () => {
    const { queryByText } = renderWithTheme(
      <Harness>
        {(control) => (
          <Dialog control={control} title="Hidden until opened">
            <Text>Body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    expect(queryByText('Hidden until opened')).toBeNull();
    expect(queryByText('Body')).toBeNull();
  });

  it('renders declarative title + description + actions when opened', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const onDelete = jest.fn();
    const { getByText } = renderWithTheme(
      <Harness onControl={(c) => { control = c; }}>
        {(c) => (
          <Dialog
            control={c}
            title="Delete item?"
            description="This action cannot be undone."
            actions={[
              { label: 'Delete', color: 'destructive', onPress: onDelete },
              { label: 'Cancel', color: 'cancel' },
            ]}
          />
        )}
      </Harness>,
    );
    act(() => { control?.open(); });
    expect(getByText('Delete item?')).toBeTruthy();
    expect(getByText('This action cannot be undone.')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('renders custom children alongside the declarative header', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const { getByText } = renderWithTheme(
      <Harness onControl={(c) => { control = c; }}>
        {(c) => (
          <Dialog control={c} title="Pick a tag">
            <Text>Custom body content</Text>
          </Dialog>
        )}
      </Harness>,
    );
    act(() => { control?.open(); });
    expect(getByText('Pick a tag')).toBeTruthy();
    expect(getByText('Custom body content')).toBeTruthy();
  });

  it('fires the action onPress after the dialog finishes closing', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const onConfirm = jest.fn();
    const { getByText } = renderWithTheme(
      <Harness onControl={(c) => { control = c; }}>
        {(c) => (
          <Dialog
            control={c}
            title="Confirm?"
            actions={[
              { label: 'Confirm', onPress: onConfirm },
            ]}
          />
        )}
      </Harness>,
    );
    act(() => { control?.open(); });
    act(() => {
      fireEvent.press(getByText('Confirm'));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('alert() helper', () => {
  // The alert store is module-scope; ensure no cross-test contamination by
  // draining anything left over from prior tests before each new run.
  beforeEach(() => {
    while (getAlertQueue().length > 0) {
      const head = getAlertQueue()[0];
      if (head) dismissAlert(head.id);
    }
  });

  it('queues alerts before any provider mounts and drains them on subscribe', () => {
    // Call alert() *before* the provider mounts — entry should sit in the
    // queue until a subscriber attaches, at which point the head is
    // rendered.
    alert('Pending', 'Was queued before provider', [
      { text: 'OK' },
    ]);
    expect(getAlertQueue().length).toBe(1);

    const { getByText } = renderWithTheme(
      <BloomDialogProvider>
        <Text>app body</Text>
      </BloomDialogProvider>,
    );
    // The queued entry now renders inside the provider.
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Was queued before provider')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
  });

  it('defaults to a single OK button when no buttons are passed', () => {
    const { getByText } = renderWithTheme(
      <BloomDialogProvider>
        <Text>app</Text>
      </BloomDialogProvider>,
    );
    act(() => {
      alert('Hello');
    });
    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
  });

  it('invokes the button onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <BloomDialogProvider>
        <Text>app</Text>
      </BloomDialogProvider>,
    );
    act(() => {
      alert('Sign out?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress },
      ]);
    });
    act(() => {
      fireEvent.press(getByText('Sign out'));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
