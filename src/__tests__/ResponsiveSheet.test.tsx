import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { ResponsiveSheet } from '../responsive-sheet';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function rerenderWithTheme(
  rerender: ReturnType<typeof render>['rerender'],
  ui: React.ReactElement,
) {
  rerender(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const LABEL = 'Filters sheet';

// `ResponsiveSheet` is now a deprecated thin wrapper over `<Dialog>`. These
// tests verify the controlled wrapper contract it still owns (open/close
// presence + delegation). The jest env reports a 375px-wide viewport (below
// the default `md` breakpoint) so the wrapper resolves to the bottom-sheet
// placement, which delegates to bloom's `BottomSheet`.
describe('ResponsiveSheet (deprecated Dialog wrapper)', () => {
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

  it('unmounts the body after a controlled close settles', () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText, rerender } = renderWithTheme(
        <ResponsiveSheet open onClose={() => {}} label={LABEL}>
          <Text>Sheet body</Text>
        </ResponsiveSheet>,
      );
      expect(getByText('Sheet body')).toBeTruthy();

      rerenderWithTheme(
        rerender,
        <ResponsiveSheet open={false} onClose={() => {}} label={LABEL}>
          <Text>Sheet body</Text>
        </ResponsiveSheet>,
      );

      // After the close animation/fallback settles the body is gone.
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(queryByText('Sheet body')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('forwards a custom label to the dialog surface', () => {
    const { getByLabelText } = renderWithTheme(
      <ResponsiveSheet open onClose={() => {}} label={LABEL}>
        <Text>Sheet body</Text>
      </ResponsiveSheet>,
    );
    expect(getByLabelText(LABEL)).toBeTruthy();
  });
});
