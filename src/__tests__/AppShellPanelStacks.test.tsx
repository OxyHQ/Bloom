import { fireEvent, render } from '@testing-library/react-native';
import type React from 'react';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { AppShell } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);

beforeEach(() => mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 }));
afterEach(() => jest.restoreAllMocks());

const measure = (screen: ReturnType<typeof render>, width = 1200) =>
  fireEvent(screen.getByTestId('shell-panels'), 'layout', {
    nativeEvent: { layout: { width, height: 800, x: 0, y: 0 } },
  });

/** Counts how many times it has mounted: a remount is a lost scroll, a lost selection. */
const mounts = jest.fn();
function Main() {
  useEffect(() => {
    mounts();
  }, []);
  return <Text>Main</Text>;
}

const stacked = (open: boolean): AppShellPanelLayout => ({
  mode: 'split',
  gap: 0,
  panels: [
    { id: 'main', stack: 'column', content: <Main />, minWidth: 300 },
    {
      id: 'pane',
      stack: 'column',
      content: <Text>Pane</Text>,
      visible: open,
      minHeight: 120,
    },
    { id: 'context', width: 350, content: <Text>Context</Text> },
  ],
});

describe('stacked panels', () => {
  beforeEach(() => mounts.mockClear());

  it('draws every panel of a stack, each as a sibling panel, beside the other slots', () => {
    const screen = render(<AppShell testID="shell" panelLayout={stacked(true)} />, { wrapper });
    measure(screen);
    // A nested ContentPanel would throw here: the stack's panels are siblings.
    expect(screen.getByText('Main')).toBeTruthy();
    expect(screen.getByText('Pane')).toBeTruthy();
    expect(screen.getByText('Context')).toBeTruthy();
  });

  it('does not draw a hidden panel of the stack, and draws the others as before', () => {
    const screen = render(<AppShell testID="shell" panelLayout={stacked(false)} />, { wrapper });
    measure(screen);
    expect(screen.getByText('Main')).toBeTruthy();
    expect(screen.queryByText('Pane')).toBeNull();
  });

  it('keeps the main panel mounted while its stack opens and closes', () => {
    const screen = render(<AppShell testID="shell" panelLayout={stacked(false)} />, { wrapper });
    measure(screen);
    screen.rerender(<AppShell testID="shell" panelLayout={stacked(true)} />);
    expect(screen.getByText('Pane')).toBeTruthy();
    screen.rerender(<AppShell testID="shell" panelLayout={stacked(false)} />);
    expect(mounts).toHaveBeenCalledTimes(1);
  });
});
