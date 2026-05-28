import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import * as Skeleton from '../skeleton';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Skeleton.Box', () => {
  it('is exported from the Skeleton namespace', () => {
    expect(typeof Skeleton.Box).toBe('function');
    expect(Skeleton.Box.displayName).toBe('Skeleton.Box');
  });

  it('renders without crashing with numeric width/height', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width={100} height={48} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders without crashing with percentage width', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width="100%" height={200} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with sharp corners when borderRadius is 0', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width={50} height={50} borderRadius={0} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with a custom large borderRadius', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width={50} height={50} borderRadius={24} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders when blend prop is set', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width={50} height={50} blend />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('still exposes existing primitives (Pill, Circle, Text, Row, Col)', () => {
    expect(typeof Skeleton.Pill).toBe('function');
    expect(typeof Skeleton.Circle).toBe('function');
    expect(typeof Skeleton.Text).toBe('function');
    expect(typeof Skeleton.Row).toBe('function');
    expect(typeof Skeleton.Col).toBe('function');
  });
});
