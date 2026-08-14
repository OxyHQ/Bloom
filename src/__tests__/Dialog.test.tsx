import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Dialog, useDialogControl } from '../dialog';
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

describe('Dialog nav header (rich fields)', () => {
  function openHeader(header: React.ComponentProps<typeof Dialog>['header']) {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const utils = renderWithTheme(
      <Harness onControl={(c) => { control = c; }}>
        {(c) => (
          <Dialog control={c} header={header} scrollable>
            <Text>Screen body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    act(() => { control?.open(); });
    return utils;
  }

  it('renders primaryAction, actions, search and segments', () => {
    const { getByText, getByLabelText, getByPlaceholderText } = openHeader({
      title: 'Rich title',
      primaryAction: { label: 'Save', onPress: jest.fn() },
      actions: [
        { icon: <Text>·</Text>, accessibilityLabel: 'Share', onPress: jest.fn() },
        { icon: <Text>·</Text>, accessibilityLabel: 'Star', onPress: jest.fn() },
      ],
      search: { value: '', onChangeText: jest.fn(), placeholder: 'Find items' },
      segments: {
        items: [
          { key: 'all', label: 'All' },
          { key: 'photos', label: 'Photos' },
        ],
        value: 'all',
        onChange: jest.fn(),
      },
      progress: { step: 2, total: 5 },
    });
    expect(getByText('Save')).toBeTruthy();
    expect(getByLabelText('Share')).toBeTruthy();
    expect(getByLabelText('Star')).toBeTruthy();
    expect(getByPlaceholderText('Find items')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Photos')).toBeTruthy();
  });

  it('fires primaryAction.onPress when the CTA is pressed', () => {
    const onSave = jest.fn();
    const { getByText } = openHeader({
      title: 'T',
      primaryAction: { label: 'Save', onPress: onSave },
    });
    act(() => { fireEvent.press(getByText('Save')); });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('collapses surplus actions into a "More" overflow trigger', () => {
    const { getByLabelText } = openHeader({
      title: 'T',
      actions: [
        { icon: <Text>a</Text>, accessibilityLabel: 'A1', onPress: jest.fn() },
        { icon: <Text>b</Text>, accessibilityLabel: 'A2', onPress: jest.fn() },
        { icon: <Text>c</Text>, accessibilityLabel: 'A3', onPress: jest.fn() },
        { icon: <Text>d</Text>, accessibilityLabel: 'A4', onPress: jest.fn() },
      ],
    });
    // 4 actions > the inline max (3): the first two stay inline + a "More" trigger.
    expect(getByLabelText('A1')).toBeTruthy();
    expect(getByLabelText('A2')).toBeTruthy();
    expect(getByLabelText('More')).toBeTruthy();
  });

  it('backward-compat: a title-only header still renders the default close', () => {
    const { getAllByText, getByLabelText } = openHeader({ title: 'Just a title' });
    // Title renders in both the large title and the (collapsed) bar title.
    expect(getAllByText('Just a title').length).toBeGreaterThanOrEqual(1);
    expect(getByLabelText('Close')).toBeTruthy();
  });
});
