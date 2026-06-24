import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { ResponsiveSheet, RESPONSIVE_SHEET_BACKDROP_TESTID } from '../responsive-sheet';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const LABEL = 'Filters sheet';

describe('ResponsiveSheet', () => {
  it('renders children when open', () => {
    const { getByText } = renderWithTheme(
      <ResponsiveSheet open onClose={() => {}} label={LABEL}>
        <Text>Sheet body</Text>
      </ResponsiveSheet>,
    );
    expect(getByText('Sheet body')).toBeTruthy();
  });

  it('renders nothing when closed (never opened)', () => {
    const { queryByText } = renderWithTheme(
      <ResponsiveSheet open={false} onClose={() => {}} label={LABEL}>
        <Text>Sheet body</Text>
      </ResponsiveSheet>,
    );
    expect(queryByText('Sheet body')).toBeNull();
  });

  // The backdrop animates its opacity from 0 -> BACKDROP_OPACITY on enter, so
  // RNTL treats it as accessibility-hidden during the synchronous first frame.
  // `includeHiddenElements` lets us assert its (real, interactive) press
  // behavior without depending on the enter transition having committed.
  const HIDDEN = { includeHiddenElements: true } as const;

  it('calls onClose when the backdrop is pressed (default dismissOnBackdrop)', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ResponsiveSheet open onClose={onClose} label={LABEL}>
        <Text>Sheet body</Text>
      </ResponsiveSheet>,
    );
    fireEvent.press(getByTestId(RESPONSIVE_SHEET_BACKDROP_TESTID, HIDDEN));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose on backdrop press when dismissOnBackdrop is false', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ResponsiveSheet open onClose={onClose} label={LABEL} dismissOnBackdrop={false}>
        <Text>Sheet body</Text>
      </ResponsiveSheet>,
    );
    fireEvent.press(getByTestId(RESPONSIVE_SHEET_BACKDROP_TESTID, HIDDEN));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('labels the panel and the dismiss backdrop distinctly', () => {
    const { getByLabelText } = renderWithTheme(
      <ResponsiveSheet open onClose={() => {}} label={LABEL}>
        <Text>Sheet body</Text>
      </ResponsiveSheet>,
    );
    expect(getByLabelText(LABEL, HIDDEN)).toBeTruthy();
    expect(getByLabelText(`Dismiss ${LABEL}`, HIDDEN)).toBeTruthy();
  });

  it('keeps the panel mounted through the exit transition after closing', () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText, rerender } = renderWithTheme(
        <ResponsiveSheet open onClose={() => {}} label={LABEL}>
          <Text>Sheet body</Text>
        </ResponsiveSheet>,
      );
      expect(getByText('Sheet body')).toBeTruthy();

      rerender(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <ResponsiveSheet open={false} onClose={() => {}} label={LABEL}>
            <Text>Sheet body</Text>
          </ResponsiveSheet>
        </BloomThemeProvider>,
      );
      // Still mounted immediately after close (exit transition in flight).
      expect(getByText('Sheet body')).toBeTruthy();

      // After the transition duration it unmounts.
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(queryByText('Sheet body')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
