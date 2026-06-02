import React from 'react';
import { Modal, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { CenteredDialog, CENTERED_DIALOG_BACKDROP_TESTID } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const CLOSE_LABEL = 'Close dialog';

describe('CenteredDialog', () => {
  it('renders the title, children and footer when visible', () => {
    const { getByText } = renderWithTheme(
      <CenteredDialog
        visible
        onClose={() => {}}
        title="Confirm action"
        footer={<Text>Footer area</Text>}
      >
        <Text>Body content</Text>
      </CenteredDialog>,
    );
    expect(getByText('Confirm action')).toBeTruthy();
    expect(getByText('Body content')).toBeTruthy();
    expect(getByText('Footer area')).toBeTruthy();
  });

  it('forwards visible=false to the underlying Modal', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <CenteredDialog visible={false} onClose={() => {}} title="Hidden">
        <Text>Body</Text>
      </CenteredDialog>,
    );
    // The native fork always mounts the RN Modal; the platform hides it via
    // the `visible` prop. Assert the prop is wired through.
    expect(UNSAFE_getByType(Modal).props.visible).toBe(false);
  });

  it('renders a header close button by default when a title is set and fires onClose', () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CenteredDialog visible onClose={onClose} title="With close">
        <Text>Body</Text>
      </CenteredDialog>,
    );
    fireEvent.press(getByLabelText(CLOSE_LABEL));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the header close button when showClose is false even with a title', () => {
    const { queryByLabelText } = renderWithTheme(
      <CenteredDialog visible onClose={() => {}} title="No close" showClose={false}>
        <Text>Body</Text>
      </CenteredDialog>,
    );
    expect(queryByLabelText(CLOSE_LABEL)).toBeNull();
  });

  it('closes when the backdrop is pressed (dismissible default)', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CenteredDialog visible onClose={onClose}>
        <Text>Body</Text>
      </CenteredDialog>,
    );
    fireEvent.press(getByTestId(CENTERED_DIALOG_BACKDROP_TESTID));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close on backdrop press when dismissible is false', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CenteredDialog visible onClose={onClose} dismissible={false}>
        <Text>Body</Text>
      </CenteredDialog>,
    );
    fireEvent.press(getByTestId(CENTERED_DIALOG_BACKDROP_TESTID));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('derives the backdrop testID from a provided testID', () => {
    const { getByTestId } = renderWithTheme(
      <CenteredDialog visible onClose={() => {}} testID="signout">
        <Text>Body</Text>
      </CenteredDialog>,
    );
    expect(getByTestId('signout-backdrop')).toBeTruthy();
  });

  it('renders a chromeless card (no header) when no title and showClose unset', () => {
    const { queryByLabelText, getByText, getByTestId } = renderWithTheme(
      <CenteredDialog visible onClose={() => {}}>
        <Text>Chromeless body</Text>
      </CenteredDialog>,
    );
    expect(getByText('Chromeless body')).toBeTruthy();
    // No header close button; only the backdrop is interactive.
    expect(queryByLabelText(CLOSE_LABEL)).toBeNull();
    expect(getByTestId(CENTERED_DIALOG_BACKDROP_TESTID)).toBeTruthy();
  });
});
