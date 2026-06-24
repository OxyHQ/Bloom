import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Dialog } from '../dialog';
import {
  BREAKPOINT_MD,
  useResolvedPlacement,
  type DialogPlacement,
  type ResponsiveDialogPlacement,
} from '../dialog/placement';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

// The RN test mock reports a 375px-wide viewport (below every breakpoint), so a
// responsive `placement` map resolves to its `base`.
const MOCK_VIEWPORT_WIDTH = 375;

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** Capture `useResolvedPlacement`'s output for a given input. */
function ResolveProbe({
  placement,
  onResolve,
}: {
  placement: ResponsiveDialogPlacement | undefined;
  onResolve: (p: DialogPlacement) => void;
}) {
  const resolved = useResolvedPlacement(placement);
  onResolve(resolved);
  return null;
}

function resolve(placement: ResponsiveDialogPlacement | undefined): DialogPlacement {
  let captured: DialogPlacement = 'center';
  renderWithTheme(
    <ResolveProbe placement={placement} onResolve={(p) => { captured = p; }} />,
  );
  return captured;
}

describe('useResolvedPlacement', () => {
  it('defaults to center when placement is undefined', () => {
    expect(resolve(undefined)).toBe('center');
  });

  it('returns a plain string placement unchanged', () => {
    expect(resolve('left')).toBe('left');
    expect(resolve('right')).toBe('right');
    expect(resolve('bottom')).toBe('bottom');
    expect(resolve('center')).toBe('center');
  });

  it('resolves a responsive map to base below the first breakpoint', () => {
    // Sanity: the mock viewport is narrower than md, so md/lg/xl never apply.
    expect(MOCK_VIEWPORT_WIDTH).toBeLessThan(BREAKPOINT_MD);
    expect(resolve({ base: 'bottom', md: 'left' })).toBe('bottom');
    expect(resolve({ base: 'bottom', md: 'center' })).toBe('bottom');
    expect(resolve({ base: 'bottom', sm: 'right', lg: 'center' })).toBe('bottom');
  });

  it('ignores higher breakpoint keys that exceed the viewport width', () => {
    // Only `base` applies at 375px wide; the `xl` override does not engage.
    expect(resolve({ base: 'right', xl: 'left' })).toBe('right');
  });
});

describe('Dialog controlled open mode', () => {
  it('does not render content while open is false', () => {
    const { queryByText } = renderWithTheme(
      <Dialog open={false} onClose={() => {}} title="Controlled">
        <Text>Controlled body</Text>
      </Dialog>,
    );
    expect(queryByText('Controlled body')).toBeNull();
  });

  it('renders content when open flips to true (no control needed)', () => {
    const { getByText, rerender } = renderWithTheme(
      <Dialog open={false} onClose={() => {}} title="Controlled">
        <Text>Controlled body</Text>
      </Dialog>,
    );
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Dialog open onClose={() => {}} title="Controlled">
          <Text>Controlled body</Text>
        </Dialog>
      </BloomThemeProvider>,
    );
    expect(getByText('Controlled body')).toBeTruthy();
    expect(getByText('Controlled')).toBeTruthy();
  });

  it('unmounts after open flips back to false and the close settles', () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText, rerender } = renderWithTheme(
        <Dialog open onClose={() => {}} title="Controlled">
          <Text>Controlled body</Text>
        </Dialog>,
      );
      expect(getByText('Controlled body')).toBeTruthy();

      rerender(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Dialog open={false} onClose={() => {}} title="Controlled">
            <Text>Controlled body</Text>
          </Dialog>
        </BloomThemeProvider>,
      );
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(queryByText('Controlled body')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('requests close via onClose exactly once when an action is pressed (no double-fire)', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithTheme(
      <Dialog
        open
        onClose={onClose}
        title="Controlled"
        actions={[{ label: 'Done' }]}
      />,
    );
    act(() => {
      fireEvent.press(getByText('Done'));
    });
    // In controlled mode the action's close() requests dismissal via onClose
    // once; the host (not the dialog) then flips `open`. It must not fire the
    // close-completion onClose a second time.
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
